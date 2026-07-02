-- 요즘 선물 — Supabase 스키마
-- Supabase 대시보드 > SQL Editor 에서 전체 실행하세요.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. gifts 테이블
-- ---------------------------------------------------------------------
create table if not exists public.gifts (
  id            text primary key,
  name          text not null,
  brand         text not null,
  price         integer not null,
  price_group   text not null,
  receiver      text[] not null default '{}',
  tags          text[] not null default '{}',
  category      text not null,
  occasion      text[] not null default '{}',
  is_premium    boolean not null default false,
  images        text[] not null default '{}',
  headline      text not null,
  review        text not null,
  brand_story   text,
  reason        text,
  upgrade_of    text,
  related_to    text,
  links         jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.gifts enable row level security;

-- 누구나(소비자 앱 포함) 읽기 가능
drop policy if exists "gifts public read" on public.gifts;
create policy "gifts public read" on public.gifts
  for select using (true);

-- 직접 insert/update/delete는 막는다 (default deny, 정책 없음).
-- 쓰기는 아래 admin_* 함수(SECURITY DEFINER)를 통해서만 가능.

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists gifts_set_updated_at on public.gifts;
create trigger gifts_set_updated_at
  before update on public.gifts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 2. 관리자 비밀번호 (해시 저장)
-- ---------------------------------------------------------------------
create table if not exists public.admin_settings (
  id            int primary key default 1,
  password_hash text not null,
  constraint admin_settings_singleton check (id = 1)
);

alter table public.admin_settings enable row level security;
-- 정책을 만들지 않는다 = anon/authenticated 모두 직접 조회/수정 불가.
-- 아래 함수들만 (SECURITY DEFINER) 내부적으로 접근 가능.

-- 비밀번호를 설정/변경할 때 이 함수를 SQL Editor에서 한 번 실행하세요:
--   select public.admin_set_password('여기에_원하는_비밀번호');
create or replace function public.admin_set_password(p_password text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  insert into public.admin_settings (id, password_hash)
  values (1, crypt(p_password, gen_salt('bf')))
  on conflict (id) do update set password_hash = excluded.password_hash;
end;
$$;

create or replace function public.admin_check_password(p_password text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_hash text;
begin
  select password_hash into v_hash from public.admin_settings where id = 1;
  if v_hash is null then
    return false;
  end if;
  return v_hash = crypt(p_password, v_hash);
end;
$$;

-- ---------------------------------------------------------------------
-- 3. 쓰기 RPC (비밀번호 검증 후 upsert/delete)
-- ---------------------------------------------------------------------
create or replace function public.admin_upsert_gift(p_password text, p_gift jsonb)
returns public.gifts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.gifts;
begin
  if not public.admin_check_password(p_password) then
    raise exception 'invalid admin password';
  end if;

  insert into public.gifts as g (
    id, name, brand, price, price_group, receiver, tags, category, occasion,
    is_premium, images, headline, review, brand_story, reason,
    upgrade_of, related_to, links
  )
  values (
    p_gift->>'id',
    p_gift->>'name',
    p_gift->>'brand',
    (p_gift->>'price')::integer,
    p_gift->>'priceGroup',
    coalesce((select array_agg(value) from jsonb_array_elements_text(p_gift->'receiver')), '{}'),
    coalesce((select array_agg(value) from jsonb_array_elements_text(p_gift->'tags')), '{}'),
    p_gift->>'category',
    coalesce((select array_agg(value) from jsonb_array_elements_text(p_gift->'occasion')), '{}'),
    coalesce((p_gift->>'isPremium')::boolean, false),
    coalesce((select array_agg(value) from jsonb_array_elements_text(p_gift->'images')), '{}'),
    p_gift->>'headline',
    p_gift->>'review',
    p_gift->>'brandStory',
    p_gift->>'reason',
    p_gift->>'upgradeOf',
    p_gift->>'relatedTo',
    coalesce(p_gift->'links', '{}'::jsonb)
  )
  on conflict (id) do update set
    name = excluded.name,
    brand = excluded.brand,
    price = excluded.price,
    price_group = excluded.price_group,
    receiver = excluded.receiver,
    tags = excluded.tags,
    category = excluded.category,
    occasion = excluded.occasion,
    is_premium = excluded.is_premium,
    images = excluded.images,
    headline = excluded.headline,
    review = excluded.review,
    brand_story = excluded.brand_story,
    reason = excluded.reason,
    upgrade_of = excluded.upgrade_of,
    related_to = excluded.related_to,
    links = excluded.links
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.admin_delete_gift(p_password text, p_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.admin_check_password(p_password) then
    raise exception 'invalid admin password';
  end if;

  delete from public.gifts where id = p_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 4. 마이그레이션용: 초기 205개 데이터 insert는
--    scripts/migrate-to-supabase.ts 가 service_role 키로 직접 수행한다
--    (RLS를 우회하므로 admin_upsert_gift를 거치지 않아도 됨).
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- 5. Storage: 어드민에서 새로 추가하는 이미지용 버킷
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('gift-images', 'gift-images', true)
on conflict (id) do nothing;

drop policy if exists "gift-images public read" on storage.objects;
create policy "gift-images public read" on storage.objects
  for select using (bucket_id = 'gift-images');

-- 업로드는 anon으로도 가능하게 둔다 (개인용 어드민 도구, 비밀번호는
-- 클라이언트 단에서만 게이트하므로 완전한 인증은 아님 — 알고 사용할 것).
drop policy if exists "gift-images anon insert" on storage.objects;
create policy "gift-images anon insert" on storage.objects
  for insert with check (bucket_id = 'gift-images');
