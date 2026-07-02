export interface ProductLinks {
  coupang: string;
  "29cm": string;
  kakaoGift: string;
  brandSite: string;
}

export interface Product {
  seq?: number;
  id: string;
  name: string;
  brand: string;
  price: number;
  priceGroup: string;
  receiver: string[];
  tags: string[];
  category: string;
  occasion: string[];
  collections: string[];
  isPremium: boolean;
  images: string[];
  headline: string;
  review: string;
  brandStory: string | null;
  reason: string;
  upgradeOf: string | null;
  relatedTo?: string | null;
  links: ProductLinks;
  createdAt?: string;
}

export interface FilterCriteria {
  receiver: string;
  priceGroup: string;
  tastes: string[];
}

export function filterProducts(
  products: Product[],
  criteria: FilterCriteria
): Product[] {
  return products.filter((product) => {
    const matchReceiver = product.receiver.includes(criteria.receiver);
    const matchPrice = product.priceGroup === criteria.priceGroup;
    const matchTaste =
      criteria.tastes.length === 0 ||
      criteria.tastes.some((taste) => product.tags.includes(taste));

    return matchReceiver && matchPrice && matchTaste;
  });
}

export function filterByCollection(products: Product[], collection: string): Product[] {
  return products.filter((p) => p.collections.includes(collection));
}

export function scoreProduct(product: Product): number {
  let score = 0;
  if (product.images.length > 0) score += 40;
  const linkCount = Object.values(product.links).filter(Boolean).length;
  if (linkCount > 0) score += 30;
  if (linkCount >= 2) score += 10;
  if (product.brandStory) score += 10;
  score += Math.max(0, 20 - product.collections.length * 2);
  return score;
}

function selectDiverse(products: Product[], n: number): Product[] {
  const sorted = [...products].sort((a, b) => scoreProduct(b) - scoreProduct(a));
  const selected: Product[] = [];
  const usedCategories = new Set<string>();

  for (const p of sorted) {
    if (selected.length >= n) break;
    if (!usedCategories.has(p.category)) {
      selected.push(p);
      usedCategories.add(p.category);
    }
  }
  for (const p of sorted) {
    if (selected.length >= n) break;
    if (!selected.includes(p)) selected.push(p);
  }
  return selected;
}

export function splitResults(products: Product[]) {
  const popular = selectDiverse(products.filter((p) => !p.isPremium), 3);
  const premium = selectDiverse(products.filter((p) => p.isPremium), 3);
  return { popular, premium };
}

export function formatPrice(price: number): string {
  return price.toLocaleString("ko-KR") + "원";
}

// --- 구매 링크 라우팅 ---

export interface ResolvedLink {
  url: string;
  label: string;
  type: "coupang" | "29cm" | "kakaoGift" | "brandSite" | "search";
}

const LINK_PRIORITY: { key: keyof ProductLinks; label: string; type: ResolvedLink["type"] }[] = [
  { key: "coupang", label: "쿠팡에서 구매", type: "coupang" },
  { key: "kakaoGift", label: "카카오로 선물하기", type: "kakaoGift" },
  { key: "29cm", label: "29CM에서 보기", type: "29cm" },
  { key: "brandSite", label: "공식몰에서 보기", type: "brandSite" },
];

export function resolveLinks(product: Product): {
  primary: ResolvedLink;
  secondary: ResolvedLink[];
} {
  const available: ResolvedLink[] = [];

  for (const { key, label, type } of LINK_PRIORITY) {
    const url = product.links[key];
    if (url) {
      available.push({ url, label, type });
    }
  }

  if (available.length === 0) {
    const searchQuery = encodeURIComponent(`${product.name} ${product.brand}`);
    const fallback: ResolvedLink = {
      url: `https://search.naver.com/search.naver?query=${searchQuery}`,
      label: "검색해서 구매",
      type: "search",
    };
    return { primary: fallback, secondary: [] };
  }

  return {
    primary: available[0],
    secondary: available.slice(1),
  };
}

// 앱인토스 환경 감지
export function isAppsInToss(): boolean {
  return typeof window !== "undefined" && !!(window as any).__GRANITE__;
}

export function openPurchaseLink(url: string) {
  if (isAppsInToss()) {
    // 앱인토스 SDK: openURL(url)
    // import { openURL } from '@apps-in-toss/web-framework';
    // openURL(url);
    // 폴백: 앱인토스 SDK 미설치 시
    window.open(url, "_blank");
  } else {
    window.open(url, "_blank");
  }
}
