import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { rowToProduct, type GiftRow } from "../lib/giftMapper";
import type { Product } from "../utils/filter";
import { useAdminAuth } from "./AdminAuthContext";

export default function AdminListPage() {
  const { logout } = useAdminAuth();
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
      .order("created_at", { ascending: false });
    setProducts(((data ?? []) as GiftRow[]).map(rowToProduct));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
    );
  }, [products, search]);

  const { password } = useAdminAuth();

  const handleDelete = async (id: string) => {
    if (!password) return;
    if (!confirm(`"${id}" 상품을 삭제할까요?`)) return;
    setDeletingId(id);
    const { error } = await supabase.rpc("admin_delete_gift", {
      p_password: password,
      p_id: id,
    });
    setDeletingId(null);
    if (error) {
      alert("삭제 실패: " + error.message);
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div
      style={{
        padding: "20px 16px 80px",
        fontFamily: "-apple-system, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>선물 관리</h1>
        <button
          onClick={logout}
          style={{
            border: "none",
            background: "none",
            color: "#8b95a1",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          로그아웃
        </button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <button
          onClick={() => navigate("/admin/collections")}
          style={{
            width: "100%", padding: "10px 0", borderRadius: 10,
            border: "1px dashed #3182f6", background: "#e8f3ff",
            color: "#3182f6", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}
        >
          컬렉션 관리 (홈 화면 카테고리)
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          placeholder="검색 (ID, 상품명, 브랜드)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #e5e8eb",
            fontSize: 15,
            outline: "none",
          }}
        />
        <button
          onClick={() => navigate("/admin/new")}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "none",
            background: "#3182f6",
            color: "#fff",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          + 새 상품
        </button>
      </div>

      <p style={{ color: "#8b95a1", fontSize: 13, marginBottom: 12 }}>
        총 {products.length}개 · {filtered.length}개 표시 중
      </p>

      {loading ? (
        <p style={{ color: "#8b95a1" }}>불러오는 중...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((p) => (
            <div
              key={p.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "#fff",
                border: "1px solid #e5e8eb",
                borderRadius: 12,
                padding: 12,
              }}
            >
              <img
                src={p.images[0] || "https://placehold.co/64x64/f2f4f6/adb5bd?text=No+img"}
                alt={p.name}
                referrerPolicy="no-referrer"
                onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/64x64/f2f4f6/adb5bd?text=No+img"; }}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 8,
                  objectFit: "cover",
                  background: "#f2f4f6",
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: "#8b95a1" }}>
                  {p.brand} · {p.priceGroup}
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.name}
                </div>
                <div style={{ fontSize: 13, color: "#3182f6", fontWeight: 600 }}>
                  {p.price.toLocaleString()}원
                </div>
              </div>
              <Link
                to={`/admin/${p.id}`}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  background: "#f2f4f6",
                  color: "#4e5968",
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                수정
              </Link>
              <button
                onClick={() => handleDelete(p.id)}
                disabled={deletingId === p.id}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: "#fdedee",
                  color: "#f04452",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  opacity: deletingId === p.id ? 0.5 : 1,
                }}
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
