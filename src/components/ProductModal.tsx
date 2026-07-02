import { useEffect } from "react";
import { formatPrice, resolveLinks, openPurchaseLink, type Product } from "../utils/filter";

const CATEGORY_EMOJIS: Record<string, string> = {
  가전: "🔌", 건강: "💊", 경험: "🎫", 리빙: "🏠", 문구: "✏️",
  바디케어: "🧴", 반려동물: "🐾", 뷰티: "💄", 상품권: "🎟️",
  생활용품: "🧹", 식기: "🍽️", 인테리어: "🪴", 조명: "💡",
  주방가전: "🍳", 주방용품: "🥄", 키즈: "🧸", 테크: "📱",
  패브릭: "🧶", 패션: "👗", 패션잡화: "👜", 푸드: "🍫",
};

const LINK_ICONS: Record<string, string> = {
  coupang: "🛒", kakaoGift: "🎁", "29cm": "🛍️", brandSite: "🏪", search: "🔍",
};

interface Props {
  product: Product;
  onClose: () => void;
}

export default function ProductModal({ product, onClose }: Props) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const { primary, secondary } = resolveLinks(product);
  const fallbackEmoji = CATEGORY_EMOJIS[product.category] ?? "🎁";
  const hasImage = product.images.length > 0;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        padding: "0",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 560,
          maxHeight: "90dvh",
          background: "#fff",
          borderRadius: "20px 20px 0 0",
          overflowY: "auto",
          padding: "0 0 40px",
        }}
      >
        {/* 드래그 핸들 */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "#e5e8eb" }} />
        </div>

        {/* 이미지 */}
        {hasImage ? (
          <img
            src={product.images[0]}
            alt={product.name}
            referrerPolicy="no-referrer"
            style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block", marginTop: 12 }}
          />
        ) : (
          <div style={{
            width: "100%", aspectRatio: "4/3", background: "#f2f4f6",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            marginTop: 12,
          }}>
            <span style={{ fontSize: 48 }}>{fallbackEmoji}</span>
            <span style={{ fontSize: 14, color: "#8b95a1", marginTop: 8 }}>{product.brand}</span>
          </div>
        )}

        <div style={{ padding: "20px 20px 0" }}>
          <div style={{ fontSize: 13, color: "#8b95a1", marginBottom: 4 }}>{product.brand}</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, lineHeight: 1.4 }}>{product.name}</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#3182f6", marginBottom: 16 }}>{formatPrice(product.price)}</div>

          {/* 태그 */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {product.tags.map((t) => (
              <span key={t} style={{ padding: "4px 10px", borderRadius: 12, background: "#f2f4f6", color: "#4e5968", fontSize: 12 }}>
                {t}
              </span>
            ))}
          </div>

          {/* 헤드라인 */}
          <p style={{ fontSize: 16, fontWeight: 700, color: "#191f28", lineHeight: 1.6, marginBottom: 12 }}>
            {product.headline}
          </p>

          {/* 리뷰 */}
          <p style={{ fontSize: 14, color: "#4e5968", lineHeight: 1.8, marginBottom: 12 }}>
            {product.review}
          </p>

          {/* 브랜드 스토리 */}
          {product.brandStory && (
            <p style={{ fontSize: 13, color: "#8b95a1", lineHeight: 1.7, background: "#f8f9fa", borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
              {product.brandStory}
            </p>
          )}

          {/* Primary CTA */}
          <button
            onClick={() => openPurchaseLink(primary.url)}
            style={{
              width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
              background: "#3182f6", color: "#fff", fontSize: 16, fontWeight: 700,
              cursor: "pointer", marginBottom: 10,
            }}
          >
            {LINK_ICONS[primary.type]} {primary.label}
          </button>

          {/* Secondary */}
          {secondary.length > 0 && (
            <div style={{ display: "flex", gap: 8 }}>
              {secondary.map((link) => (
                <button
                  key={link.type}
                  onClick={() => openPurchaseLink(link.url)}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #e5e8eb",
                    background: "#fff", color: "#4e5968", fontSize: 13, fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {link.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
