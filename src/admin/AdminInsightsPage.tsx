import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

// 요즘선물 앱의 PricePage.tsx PRICE_OPTIONS와 반드시 같은 값으로 유지할 것.
// (yozm-gift/src/pages/PricePage.tsx)
const TIERS = [
  { label: "부담 없이 (2-3만원)", groups: ["1만원 이하", "3만원 이하"] },
  { label: "센스 있게 (3-5만원)", groups: ["5만원 이하"] },
  { label: "조금 더 특별하게 (10만원대)", groups: ["10만원 이하"] },
  { label: "정말 아끼는 사람 (20만원 이상)", groups: ["20만원 이상"] },
];

interface CollectionRow {
  key: string;
  label: string;
  sort_order: number;
  enabled: boolean;
}

interface GiftRow {
  price_group: string;
  collections: string[];
}

function countLabelStyle(count: number): { background: string; color: string } {
  if (count === 0) return { background: "#fdedee", color: "#f04452" };
  if (count <= 5) return { background: "#fff5e5", color: "#c76e00" };
  return { background: "transparent", color: "#191f28" };
}

// 이 콜렉션 x 가격대 조합만으로 결과 페이지를 봤을 때, 상위 6개를 넘는 만큼은
// 광고 시청 후에만 보이는 잠금 상품이 된다 (ResultPage.tsx splitResults 로직과 동일).
function lockedCount(count: number): number {
  return Math.max(0, count - 6);
}

const cellStyle: React.CSSProperties = {
  padding: "8px 10px",
  textAlign: "center",
  borderTop: "1px solid #f2f4f6",
  fontSize: 13,
  fontWeight: 600,
};

export default function AdminInsightsPage() {
  const navigate = useNavigate();
  const [gifts, setGifts] = useState<GiftRow[]>([]);
  const [collectionRows, setCollectionRows] = useState<CollectionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("gifts").select("price_group, collections"),
      supabase
        .from("collections")
        .select("key, label, sort_order, enabled")
        .order("sort_order", { ascending: true }),
    ]).then(([giftsRes, collectionsRes]) => {
      setGifts((giftsRes.data ?? []) as GiftRow[]);
      setCollectionRows((collectionsRes.data ?? []) as CollectionRow[]);
      setLoading(false);
    });
  }, []);

  const crossTab = useMemo(() => {
    const counts = new Map<string, number[]>(); // collection key -> [tier0, tier1, tier2, tier3]
    for (const g of gifts) {
      const tierIdx = TIERS.findIndex((t) => t.groups.includes(g.price_group));
      if (tierIdx === -1) continue;
      for (const c of g.collections ?? []) {
        const arr = counts.get(c) ?? [0, 0, 0, 0];
        arr[tierIdx]++;
        counts.set(c, arr);
      }
    }
    return collectionRows
      .filter((r) => r.enabled)
      .map((r) => ({ key: r.key, label: r.label, counts: counts.get(r.key) ?? [0, 0, 0, 0] }));
  }, [gifts, collectionRows]);

  const adLockTable = useMemo(() => {
    return TIERS.map((tier) => {
      const total = gifts.filter((g) => tier.groups.includes(g.price_group)).length;
      const popular = Math.min(6, total);
      const locked = Math.max(0, total - 6);
      return { label: tier.label, total, popular, locked };
    });
  }, [gifts]);

  return (
    <div style={{ padding: "20px 16px 100px", fontFamily: "-apple-system, sans-serif", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => navigate("/admin")}
          style={{ border: "none", background: "none", fontSize: 20, cursor: "pointer" }}
        >
          ←
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 700, flex: 1 }}>가격대 인사이트</h1>
      </div>

      {loading ? (
        <p style={{ color: "#8b95a1", fontSize: 14 }}>불러오는 중...</p>
      ) : (
        <>
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#4e5968", marginBottom: 4 }}>
              콜렉션 × 가격대 상품 개수
            </h2>
            <p style={{ fontSize: 12, color: "#8b95a1", marginBottom: 10 }}>
              빨간색 = 0개, 주황색 = 5개 이하. "(잠금 N)"은 이 콜렉션·가격대 조합만 봤을 때 상위 6개를 넘어서
              광고 시청 후에만 보이는 상품 수예요. 상품을 추가/수정하면 새로고침 시 바로 반영돼요.
            </p>
            <div style={{ overflowX: "auto", background: "#fff", borderRadius: 12, border: "1px solid #e5e8eb" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ padding: "8px 10px", textAlign: "left", color: "#8b95a1", fontWeight: 600, whiteSpace: "nowrap" }}>
                      콜렉션
                    </th>
                    {TIERS.map((t) => (
                      <th
                        key={t.label}
                        style={{ padding: "8px 10px", textAlign: "center", color: "#8b95a1", fontWeight: 600, whiteSpace: "nowrap" }}
                      >
                        {t.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {crossTab.map((row) => (
                    <tr key={row.key}>
                      <td style={{ padding: "8px 10px", borderTop: "1px solid #f2f4f6", whiteSpace: "nowrap" }}>{row.label}</td>
                      {row.counts.map((count, i) => {
                        const locked = lockedCount(count);
                        return (
                          <td key={i} style={{ ...cellStyle, ...countLabelStyle(count) }}>
                            {count}
                            {locked > 0 && (
                              <div style={{ fontSize: 11, fontWeight: 500, color: "#8b95a1" }}>
                                (잠금 {locked})
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#4e5968", marginBottom: 4 }}>
              가격대별 광고 잠금 상품 개수
            </h2>
            <p style={{ fontSize: 12, color: "#8b95a1", marginBottom: 10 }}>
              결과 페이지는 가격대로 거른 상품 중 상위 6개만 무료로 보여주고 나머지는 광고 시청 후 노출돼요.
            </p>
            <div style={{ overflowX: "auto", background: "#fff", borderRadius: 12, border: "1px solid #e5e8eb" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ padding: "8px 10px", textAlign: "left", color: "#8b95a1", fontWeight: 600 }}>가격대</th>
                    <th style={{ padding: "8px 10px", textAlign: "center", color: "#8b95a1", fontWeight: 600 }}>전체</th>
                    <th style={{ padding: "8px 10px", textAlign: "center", color: "#8b95a1", fontWeight: 600 }}>무료(인기 6개)</th>
                    <th style={{ padding: "8px 10px", textAlign: "center", color: "#8b95a1", fontWeight: 600 }}>광고 잠금</th>
                  </tr>
                </thead>
                <tbody>
                  {adLockTable.map((row) => (
                    <tr key={row.label}>
                      <td style={{ padding: "8px 10px", borderTop: "1px solid #f2f4f6" }}>{row.label}</td>
                      <td style={cellStyle}>{row.total}</td>
                      <td style={cellStyle}>{row.popular}</td>
                      <td style={cellStyle}>{row.locked}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
