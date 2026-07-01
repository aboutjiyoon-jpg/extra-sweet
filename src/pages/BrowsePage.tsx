import { useEffect, useMemo, useState } from "react";
import { useGifts } from "../hooks/useGifts";
import type { Product } from "../utils/filter";
import { formatPrice } from "../utils/filter";
import ProductModal from "../components/ProductModal";

const CATEGORY_EMOJIS: Record<string, string> = {
  가전: "🔌", 건강: "💊", 경험: "🎫", 리빙: "🏠", 문구: "✏️",
  바디케어: "🧴", 반려동물: "🐾", 뷰티: "💄", 상품권: "🎟️",
  생활용품: "🧹", 식기: "🍽️", 인테리어: "🪴", 조명: "💡",
  주방가전: "🍳", 주방용품: "🥄", 키즈: "🧸", 테크: "📱",
  패브릭: "🧶", 패션: "👗", 패션잡화: "👜", 푸드: "🍫",
};

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

function MasonryCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const hasImage = product.images.length > 0;
  const emoji = CATEGORY_EMOJIS[product.category] ?? "🎁";
  const reviewLines = product.review.length > 120;

  return (
    <div
      style={{
        breakInside: "avoid",
        marginBottom: 12,
        borderRadius: 16,
        overflow: "hidden",
        background: "#fff",
        border: "1px solid #f0f2f4",
        cursor: "pointer",
      }}
    >
      {/* 이미지 */}
      <div onClick={onClick}>
        {hasImage ? (
          <img
            src={product.images[0]}
            alt={product.name}
            referrerPolicy="no-referrer"
            loading="lazy"
            style={{ width: "100%", display: "block", background: "#f8f9fa" }}
          />
        ) : (
          <div style={{
            width: "100%", aspectRatio: "1", background: "#f2f4f6",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            <span style={{ fontSize: 32 }}>{emoji}</span>
            <span style={{ fontSize: 11, color: "#8b95a1", textAlign: "center", padding: "0 8px" }}>{product.brand}</span>
          </div>
        )}
      </div>

      <div style={{ padding: "10px 12px 12px" }}>
        {/* 브랜드 + 날짜 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
          <span style={{ fontSize: 11, color: "#8b95a1" }}>{product.brand}</span>
          {product.createdAt && (
            <span style={{ fontSize: 10, color: "#c9cdd4" }}>{formatDate(product.createdAt)}</span>
          )}
        </div>

        {/* 헤드라인 */}
        <div onClick={onClick} style={{ fontSize: 13, fontWeight: 700, color: "#191f28", lineHeight: 1.45, marginBottom: 6 }}>
          {product.headline}
        </div>

        {/* 리뷰 본문 */}
        <div style={{ marginBottom: 8 }}>
          <p style={{
            fontSize: 12, color: "#6b7684", lineHeight: 1.7, margin: 0,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
          }}>
            {product.review}
          </p>
          {reviewLines && (
            <button
              onClick={(e) => { e.stopPropagation(); onClick(); }}
              style={{
                display: "block", marginTop: 4, border: "none", background: "none",
                color: "#3182f6", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0,
              }}
            >
              더보기
            </button>
          )}
        </div>

        {/* 가격 */}
        <div onClick={onClick} style={{ fontSize: 13, fontWeight: 700, color: "#191f28" }}>
          {formatPrice(product.price)}
        </div>
      </div>
    </div>
  );
}

export default function BrowsePage() {
  const { products, loading } = useGifts();
  const isMobile = useIsMobile();
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [premiumUnlocked, setPremiumUnlocked] = useState(false);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.filter(p => !p.isPremium).map(p => p.category))).sort();
    return ["전체", ...cats];
  }, [products]);

  const { freeProducts, premiumProducts } = useMemo(() => {
    const free = products.filter(p => !p.isPremium);
    const premium = products.filter(p => p.isPremium);
    const filtered = selectedCategory === "전체"
      ? free
      : free.filter(p => p.category === selectedCategory);
    return { freeProducts: filtered, premiumProducts: premium };
  }, [products, selectedCategory]);

  const handleWatchAd = () => {
    // TODO: Google AdSense 리워드 광고 연동
    setPremiumUnlocked(true);
  };

  const columnCount = isMobile ? 1 : 3;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#fafafa",
      fontFamily: "-apple-system, 'Toss Product Sans', sans-serif",
      paddingBottom: isMobile ? 80 : 40,
    }}>

      {/* 헤더 + 카테고리 탭 */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "#fff", borderBottom: "1px solid #f0f2f4",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", padding: "14px 0 0", marginBottom: 10 }}>
            <span style={{ fontSize: 18 }}>🎁</span>
            <span style={{ fontSize: 16, fontWeight: 800, marginLeft: 6, color: "#191f28" }}>요즘 선물</span>
          </div>
          <div style={{
            display: "flex", gap: 6, overflowX: "auto", paddingBottom: 12,
            scrollbarWidth: "none",
          }}>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{ height: 30, width: 52, borderRadius: 14, background: "#f2f4f6", flexShrink: 0 }} />
                ))
              : categories.map((cat) => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} style={{
                    flexShrink: 0, padding: "5px 12px", borderRadius: 14, border: "none",
                    fontSize: 12, fontWeight: selectedCategory === cat ? 700 : 400, cursor: "pointer",
                    background: selectedCategory === cat ? "#191f28" : "#f2f4f6",
                    color: selectedCategory === cat ? "#fff" : "#4e5968",
                  }}>
                    {cat === "전체" ? "전체" : `${CATEGORY_EMOJIS[cat] ?? ""} ${cat}`}
                  </button>
                ))}
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 16px 0" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#8b95a1" }}>
            선물을 불러오는 중이에요...
          </div>
        ) : (
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>

            {/* 메인 컨텐츠 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* 상품 masonry 그리드 */}
              <div style={{ columns: columnCount, columnGap: 12 }}>
                {freeProducts.map((p) => (
                  <MasonryCard key={p.id} product={p} onClick={() => setSelectedProduct(p)} />
                ))}
              </div>

              {/* 프리미엄 섹션 */}
              {premiumProducts.length > 0 && (
                <div style={{
                  marginTop: 24, padding: "24px 20px",
                  background: "#fff", borderRadius: 16,
                  border: "1px solid #f0f2f4", textAlign: "center",
                }}>
                  {premiumUnlocked ? (
                    <>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#191f28", marginBottom: 16 }}>
                        💎 센스 있는 선물
                      </div>
                      <div style={{ columns: columnCount, columnGap: 12 }}>
                        {premiumProducts.map((p) => (
                          <MasonryCard key={p.id} product={p} onClick={() => setSelectedProduct(p)} />
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 22, marginBottom: 10 }}>💎</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#191f28", marginBottom: 6 }}>
                        센스 있는 선물 {premiumProducts.length}개 더 있어요
                      </div>
                      <div style={{ fontSize: 13, color: "#8b95a1", marginBottom: 20 }}>
                        카카오 선물하기에서 흔히 보이지 않는 선물
                      </div>
                      <button
                        onClick={handleWatchAd}
                        style={{
                          padding: "12px 28px", borderRadius: 12, border: "none",
                          background: "#191f28", color: "#fff",
                          fontSize: 14, fontWeight: 700, cursor: "pointer",
                        }}
                      >
                        광고 보고 더보기
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* 데스크탑 우측 광고 사이드바 */}
            {!isMobile && (
              <div style={{ flexShrink: 0, width: 200, position: "sticky", top: 100 }}>
                <div style={{
                  width: "100%", minHeight: 280, borderRadius: 16, marginBottom: 16,
                  background: "#f2f4f6", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 12, color: "#adb5bd",
                }}>
                  {/* Google AdSense 슬롯 1 */}
                  광고
                </div>
                <div style={{
                  width: "100%", minHeight: 280, borderRadius: 16,
                  background: "#f2f4f6", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 12, color: "#adb5bd",
                }}>
                  {/* Google AdSense 슬롯 2 */}
                  광고
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 모바일 하단 고정 광고 띠배너 */}
      {isMobile && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200,
          height: 60, background: "#f2f4f6",
          borderTop: "1px solid #e5e8eb",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, color: "#adb5bd",
        }}>
          {/* Google AdSense 띠배너 슬롯 */}
          광고 영역 (320×50 또는 320×100)
        </div>
      )}

      {/* 상품 모달 */}
      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  );
}
