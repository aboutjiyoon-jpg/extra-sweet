import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { rowToProduct, type GiftRow } from "../lib/giftMapper";
import type { Product } from "../utils/filter";
import { useAdminAuth } from "./AdminAuthContext";

function isOnelink(url: string): boolean {
  return url.includes("onelink.me");
}

function isAffiliateCoupang(url: string): boolean {
  return url.startsWith("https://link.coupang.com/a/");
}

function LinkBadge({ label, ok, warn }: { label: string; ok: boolean; warn: boolean }) {
  if (!warn && !ok) return null;
  const bg = ok ? "#e8f7ee" : "#fff0e6";
  const color = ok ? "#1a7a3f" : "#c05000";
  const dot = ok ? "✓" : "!";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 2,
      fontSize: 10, fontWeight: 700, padding: "2px 6px",
      borderRadius: 4, background: bg, color,
    }}>
      {dot} {label}
    </span>
  );
}

function ProductCard({ p, onDelete, deletingId }: {
  p: Product;
  onDelete: (id: string) => void;
  deletingId: string | null;
}) {
  const navigate = useNavigate();
  const cm29 = p.links["29cm"];
  const coupang = p.links.coupang;

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e8eb",
        borderRadius: 12,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
      }}
      onClick={() => navigate(`/admin/${p.seq}`)}
    >
      <div style={{ position: "relative", paddingTop: "75%", background: "#f2f4f6" }}>
        <img
          src={p.images[0] || "https://placehold.co/320x240/f2f4f6/adb5bd?text=No+img"}
          alt={p.name}
          referrerPolicy="no-referrer"
          onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/320x240/f2f4f6/adb5bd?text=No+img"; }}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover",
          }}
        />
        {p.isPremium && (
          <span style={{
            position: "absolute", top: 6, left: 6,
            fontSize: 10, fontWeight: 700, padding: "2px 6px",
            borderRadius: 4, background: "#333d4b", color: "#fff",
          }}>
            PREMIUM
          </span>
        )}
      </div>
      <div style={{ padding: "10px 12px", flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ fontSize: 11, color: "#8b95a1" }}>{p.brand} · {p.priceGroup}</div>
        <div style={{
          fontSize: 13, fontWeight: 600,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {p.name}
        </div>
        <div style={{ fontSize: 13, color: "#3182f6", fontWeight: 700 }}>
          {p.price.toLocaleString()}원
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 2 }}>
          {cm29 && (
            <LinkBadge
              label={isOnelink(cm29) ? "원링크" : "29cm 일반"}
              ok={isOnelink(cm29)}
              warn={!isOnelink(cm29)}
            />
          )}
          {coupang && (
            <LinkBadge
              label={isAffiliateCoupang(coupang) ? "쿠팡 제휴" : "쿠팡 비제휴"}
              ok={isAffiliateCoupang(coupang)}
              warn={!isAffiliateCoupang(coupang)}
            />
          )}
        </div>
      </div>
      <div
        style={{ padding: "8px 12px", borderTop: "1px solid #f2f4f6", display: "flex", gap: 6 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => navigate(`/admin/${p.seq}`)}
          style={{
            flex: 1, padding: "6px 0", borderRadius: 7, border: "1px solid #e5e8eb",
            background: "#f8f9fa", color: "#4e5968", fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}
        >
          수정
        </button>
        <button
          onClick={() => onDelete(p.id)}
          disabled={deletingId === p.id}
          style={{
            flex: 1, padding: "6px 0", borderRadius: 7, border: "none",
            background: "#fdedee", color: "#f04452", fontSize: 12, fontWeight: 600,
            cursor: "pointer", opacity: deletingId === p.id ? 0.5 : 1,
          }}
        >
          삭제
        </button>
      </div>
    </div>
  );
}

export default function AdminListPage() {
  const { logout } = useAdminAuth();
  const { password } = useAdminAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("gifts")
      .select("*")
      .order("seq", { ascending: false });
    setProducts(((data ?? []) as GiftRow[]).map(rowToProduct));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        String(p.seq).includes(q)
    );
  }, [products, search]);

  const handleDelete = async (id: string) => {
    if (!password) return;
    if (!confirm(`"${id}" 상품을 삭제할까요?`)) return;
    setDeletingId(id);
    const { error } = await supabase.rpc("admin_delete_gift", {
      p_password: password,
      p_id: id,
    });
    setDeletingId(null);
    if (error) { alert("삭제 실패: " + error.message); return; }
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div style={{ fontFamily: "-apple-system, sans-serif", minHeight: "100vh", background: "#f8f9fa" }}>
      {/* Top Navbar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "#fff", borderBottom: "1px solid #e5e8eb",
        padding: "0 20px",
      }}>
        <div style={{
          maxWidth: 1400, margin: "0 auto",
          display: "flex", alignItems: "center", gap: 12, height: 56,
        }}>
          <h1 style={{ fontSize: 17, fontWeight: 700, whiteSpace: "nowrap", margin: 0 }}>
            선물 관리
          </h1>
          <span style={{ fontSize: 13, color: "#8b95a1", whiteSpace: "nowrap" }}>
            {loading ? "..." : `${products.length}개`}
          </span>
          <input
            placeholder="검색 (번호, ID, 상품명, 브랜드)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1, padding: "7px 12px", borderRadius: 8,
              border: "1px solid #e5e8eb", fontSize: 14, outline: "none",
              minWidth: 0,
            }}
          />
          <button
            onClick={() => navigate("/admin/collections")}
            style={{
              padding: "7px 14px", borderRadius: 8,
              border: "1px solid #3182f6", background: "#e8f3ff",
              color: "#3182f6", fontSize: 13, fontWeight: 600, cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            컬렉션
          </button>
          <button
            onClick={() => navigate("/admin/new")}
            style={{
              padding: "7px 16px", borderRadius: 8, border: "none",
              background: "#3182f6", color: "#fff",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            + 새 상품
          </button>
          <button
            onClick={logout}
            style={{ border: "none", background: "none", color: "#8b95a1", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 16px 80px" }}>
        {search && (
          <p style={{ color: "#8b95a1", fontSize: 13, marginBottom: 12 }}>
            {filtered.length}개 검색됨
          </p>
        )}
        {loading ? (
          <p style={{ color: "#8b95a1" }}>불러오는 중...</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: "#8b95a1" }}>검색 결과가 없어요.</p>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 12,
          }}>
            {filtered.map((p) => (
              <ProductCard
                key={p.id}
                p={p}
                onDelete={handleDelete}
                deletingId={deletingId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
