import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAdminAuth } from "./AdminAuthContext";

interface CollectionRow {
  key: string;
  label: string;
  subtitle: string;
  section: "situation" | "tricky" | "taste";
  image_url: string;
  result_title: string;
  result_desc: string;
  sort_order: number;
  enabled: boolean;
}

const SECTION_LABELS: Record<string, string> = {
  situation: "상황별",
  tricky: "고민되는 선물",
  taste: "취향별",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #e5e8eb",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const EMPTY: CollectionRow = {
  key: "",
  label: "",
  subtitle: "",
  section: "situation",
  image_url: "",
  result_title: "",
  result_desc: "",
  sort_order: 99,
  enabled: true,
};

export default function AdminCollectionsPage() {
  const navigate = useNavigate();
  useAdminAuth();
  const [rows, setRows] = useState<CollectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CollectionRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("collections")
      .select("*")
      .order("sort_order", { ascending: true });
    setRows((data ?? []) as CollectionRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.key || !editing.label) {
      setErrorMsg("Key와 라벨은 필수예요.");
      return;
    }
    setSaving(true);
    setErrorMsg("");
    const { error } = await supabase
      .from("collections")
      .upsert([editing], { onConflict: "key" });
    setSaving(false);
    if (error) { setErrorMsg("저장 실패: " + error.message); return; }
    setEditing(null);
    load();
  };

  const handleToggleEnabled = async (row: CollectionRow) => {
    await supabase.from("collections").update({ enabled: !row.enabled }).eq("key", row.key);
    load();
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`"${key}" 컬렉션을 삭제할까요?`)) return;
    await supabase.from("collections").delete().eq("key", key);
    load();
  };

  const upd = <K extends keyof CollectionRow>(k: K, v: CollectionRow[K]) =>
    setEditing((e) => e ? { ...e, [k]: v } : e);

  const grouped = (["situation", "tricky", "taste"] as const).map((sec) => ({
    section: sec,
    items: rows.filter((r) => r.section === sec),
  }));

  return (
    <div style={{ padding: "20px 16px 100px", fontFamily: "-apple-system, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => navigate("/admin")}
          style={{ border: "none", background: "none", fontSize: 20, cursor: "pointer" }}
        >
          ←
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 700, flex: 1 }}>컬렉션 관리</h1>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          style={{
            padding: "8px 16px", borderRadius: 8, border: "none",
            background: "#3182f6", color: "#fff", fontSize: 14, cursor: "pointer",
          }}
        >
          + 추가
        </button>
      </div>

      {loading ? (
        <p style={{ color: "#8b95a1", fontSize: 14 }}>불러오는 중...</p>
      ) : (
        grouped.map(({ section, items }) => (
          <div key={section} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#4e5968", marginBottom: 10 }}>
              {SECTION_LABELS[section]}
            </h2>
            {items.map((row) => (
              <div
                key={row.key}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "#fff", borderRadius: 12, padding: "10px 14px",
                  marginBottom: 8, opacity: row.enabled ? 1 : 0.5,
                }}
              >
                {row.image_url && (
                  <img src={row.image_url} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{row.label}</div>
                  <div style={{ fontSize: 12, color: "#8b95a1" }}>{row.key} · {row.subtitle}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => handleToggleEnabled(row)}
                    style={{
                      padding: "4px 10px", borderRadius: 6, border: "1px solid #e5e8eb",
                      fontSize: 12, cursor: "pointer", background: "#f8f9fa",
                    }}
                  >
                    {row.enabled ? "숨기기" : "표시"}
                  </button>
                  <button
                    onClick={() => setEditing({ ...row })}
                    style={{
                      padding: "4px 10px", borderRadius: 6, border: "none",
                      fontSize: 12, cursor: "pointer", background: "#e8f3ff", color: "#3182f6",
                    }}
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(row.key)}
                    style={{
                      padding: "4px 10px", borderRadius: 6, border: "none",
                      fontSize: 12, cursor: "pointer", background: "#fff0f0", color: "#f04452",
                    }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))
      )}

      {editing && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
            display: "flex", alignItems: "flex-end", zIndex: 100,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setEditing(null); }}
        >
          <div style={{ background: "#fff", borderRadius: "16px 16px 0 0", padding: 20, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>
              {editing.key ? "컬렉션 수정" : "새 컬렉션"}
            </h2>

            {[
              { k: "key", label: "Key (영문·한글, 고유)" },
              { k: "label", label: "라벨 (표시 이름)" },
              { k: "subtitle", label: "부제목" },
              { k: "image_url", label: "이미지 URL" },
              { k: "result_title", label: "결과 페이지 제목" },
              { k: "result_desc", label: "결과 페이지 설명" },
            ].map(({ k, label }) => (
              <label key={k} style={{ display: "block", marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: "#4e5968", marginBottom: 4 }}>{label}</div>
                <input
                  style={inputStyle}
                  value={(editing as any)[k]}
                  onChange={(e) => upd(k as any, e.target.value)}
                  disabled={k === "key" && !!rows.find((r) => r.key === editing.key)}
                />
              </label>
            ))}

            <label style={{ display: "block", marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "#4e5968", marginBottom: 4 }}>섹션</div>
              <select
                style={inputStyle}
                value={editing.section}
                onChange={(e) => upd("section", e.target.value as CollectionRow["section"])}
              >
                <option value="situation">상황별</option>
                <option value="tricky">고민되는 선물</option>
                <option value="taste">취향별</option>
              </select>
            </label>

            <label style={{ display: "block", marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "#4e5968", marginBottom: 4 }}>정렬 순서</div>
              <input
                type="number"
                style={inputStyle}
                value={editing.sort_order}
                onChange={(e) => upd("sort_order", Number(e.target.value))}
              />
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <input
                type="checkbox"
                checked={editing.enabled}
                onChange={(e) => upd("enabled", e.target.checked)}
              />
              <span style={{ fontSize: 14 }}>홈 화면에 표시</span>
            </label>

            {errorMsg && <p style={{ color: "#f04452", fontSize: 13, marginBottom: 12 }}>{errorMsg}</p>}

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setEditing(null)}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 10, border: "1px solid #e5e8eb",
                  background: "#f8f9fa", fontSize: 15, cursor: "pointer",
                }}
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex: 2, padding: "12px 0", borderRadius: 10, border: "none",
                  background: "#3182f6", color: "#fff", fontSize: 15, fontWeight: 700,
                  cursor: "pointer", opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
