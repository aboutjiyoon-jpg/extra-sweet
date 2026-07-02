import { useEffect, useState, useRef, type ReactNode, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { rowToProduct, productToGiftPayload, type GiftRow } from "../lib/giftMapper";
import type { Product, ProductLinks } from "../utils/filter";
import { useAdminAuth } from "./AdminAuthContext";

const EMPTY: Product = {
  id: "",
  name: "",
  brand: "",
  price: 0,
  priceGroup: "5만원 이하",
  receiver: [],
  tags: [],
  category: "",
  occasion: [],
  collections: [],
  isPremium: false,
  images: [],
  headline: "",
  review: "",
  brandStory: "",
  reason: "",
  upgradeOf: null,
  relatedTo: null,
  links: { coupang: "", "29cm": "", kakaoGift: "", brandSite: "" },
};

const PRICE_GROUPS = ["1만원 이하", "3만원 이하", "5만원 이하", "10만원 이하", "20만원 이상"];
const RECEIVER_OPTIONS = ["연인", "친구", "부모님", "직장동료", "형제자매", "아이"];
const TASTE_OPTIONS = ["커피", "향", "인테리어", "운동", "캠핑", "독서", "술", "귀여운 것", "실용적인 것"];

function field(label: string, children: ReactNode) {
  return (
    <label style={{ display: "block", marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#4e5968", marginBottom: 6 }}>
        {label}
      </div>
      {children}
    </label>
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #e5e8eb",
  fontSize: 15,
  outline: "none",
  boxSizing: "border-box",
};

function ChipToggle({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() =>
              onChange(active ? selected.filter((s) => s !== opt) : [...selected, opt])
            }
            style={{
              padding: "6px 12px",
              borderRadius: 16,
              border: "none",
              fontSize: 13,
              cursor: "pointer",
              background: active ? "#3182f6" : "#f2f4f6",
              color: active ? "#fff" : "#4e5968",
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export default function AdminEditPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { password } = useAdminAuth();

  const [product, setProduct] = useState<Product>(EMPTY);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const copyToClipboard = async (value: string, key: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  useEffect(() => {
    if (isNew) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from("gifts").select("*").eq("id", id).single();
      if (!error && data) {
        setProduct(rowToProduct(data as GiftRow));
      }
      setLoading(false);
    })();
  }, [id, isNew]);

  const update = <K extends keyof Product>(key: K, value: Product[K]) =>
    setProduct((p) => ({ ...p, [key]: value }));

  const updateLink = (key: keyof ProductLinks, value: string) =>
    setProduct((p) => ({ ...p, links: { ...p.links, [key]: value } }));

  const handleImageUpload = async (file: File) => {
    if (!product.id) {
      alert("이미지를 올리기 전에 먼저 상품 ID를 입력해주세요.");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${product.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("gift-images").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    setUploading(false);
    if (error) {
      alert("이미지 업로드 실패: " + error.message);
      return;
    }
    const { data } = supabase.storage.from("gift-images").getPublicUrl(path);
    update("images", [...product.images, data.publicUrl]);
  };

  const removeImage = (idx: number) =>
    update(
      "images",
      product.images.filter((_, i) => i !== idx)
    );

  const handleSave = async () => {
    if (!password) return;
    if (!product.id || !product.name || !product.brand) {
      setErrorMsg("ID, 상품명, 브랜드는 필수예요.");
      return;
    }
    setSaving(true);
    setErrorMsg("");
    const { error } = await supabase.rpc("admin_upsert_gift", {
      p_password: password,
      p_gift: productToGiftPayload(product),
    });
    setSaving(false);
    if (error) {
      setErrorMsg("저장 실패: " + error.message);
      return;
    }
    navigate("/admin");
  };

  if (loading) {
    return <div style={{ padding: 24 }}>불러오는 중...</div>;
  }

  return (
    <div
      style={{
        padding: "20px 16px 100px",
        fontFamily: "-apple-system, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => navigate("/admin")}
          style={{ border: "none", background: "none", fontSize: 20, cursor: "pointer" }}
        >
          ←
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>
          {isNew ? "새 상품" : "상품 수정"}
        </h1>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, padding: 20 }}>
        {field(
          "ID (고유, 영문-숫자-하이픈)",
          <input
            style={inputStyle}
            value={product.id}
            disabled={!isNew}
            onChange={(e) => update("id", e.target.value)}
            placeholder="kotona-towel"
          />
        )}
        {field(
          "상품명",
          <input
            style={inputStyle}
            value={product.name}
            onChange={(e) => update("name", e.target.value)}
          />
        )}
        {field(
          "브랜드",
          <input
            style={inputStyle}
            value={product.brand}
            onChange={(e) => update("brand", e.target.value)}
          />
        )}
        {field(
          "가격",
          <input
            type="number"
            style={inputStyle}
            value={product.price}
            onChange={(e) => update("price", Number(e.target.value))}
          />
        )}
        {field(
          "가격대",
          <select
            style={inputStyle}
            value={product.priceGroup}
            onChange={(e) => update("priceGroup", e.target.value)}
          >
            {PRICE_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        )}
        {field(
          "카테고리",
          <input
            style={inputStyle}
            value={product.category}
            onChange={(e) => update("category", e.target.value)}
          />
        )}
        {field(
          "받는 사람",
          <ChipToggle
            options={RECEIVER_OPTIONS}
            selected={product.receiver}
            onChange={(v) => update("receiver", v)}
          />
        )}
        {field(
          "취향 태그",
          <ChipToggle
            options={TASTE_OPTIONS}
            selected={product.tags}
            onChange={(v) => update("tags", v)}
          />
        )}
        {field(
          "프리미엄 상품",
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={product.isPremium}
              onChange={(e) => update("isPremium", e.target.checked)}
            />
            <span style={{ fontSize: 14 }}>광고 시청 후 공개되는 상품</span>
          </label>
        )}
        {field(
          "헤드라인",
          <input
            style={inputStyle}
            value={product.headline}
            onChange={(e) => update("headline", e.target.value)}
          />
        )}
        {field(
          "리뷰",
          <textarea
            style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
            value={product.review}
            onChange={(e) => update("review", e.target.value)}
          />
        )}
        {field(
          "브랜드 스토리",
          <textarea
            style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
            value={product.brandStory ?? ""}
            onChange={(e) => update("brandStory", e.target.value)}
          />
        )}
        {field(
          "이미지",
          <div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              {product.images.map((url, idx) => (
                <div key={url + idx} style={{ position: "relative" }}>
                  <img
                    src={url}
                    alt=""
                    referrerPolicy="no-referrer"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/72x72/f2f4f6/adb5bd?text=X"; }}
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 8,
                      objectFit: "cover",
                      background: "#f2f4f6",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      border: "none",
                      background: "#333d4b",
                      color: "#fff",
                      fontSize: 12,
                      lineHeight: "20px",
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                disabled={uploading}
                onClick={() => cameraInputRef.current?.click()}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #e5e8eb",
                  background: "#f8f9fa", fontSize: 14, cursor: "pointer",
                }}
              >
                📷 카메라
              </button>
              <button
                type="button"
                disabled={uploading}
                onClick={() => galleryInputRef.current?.click()}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #e5e8eb",
                  background: "#f8f9fa", fontSize: 14, cursor: "pointer",
                }}
              >
                🖼️ 앨범
              </button>
            </div>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
                e.target.value = "";
              }}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
                e.target.value = "";
              }}
            />
            {uploading && (
              <p style={{ fontSize: 13, color: "#8b95a1", marginTop: 6 }}>업로드 중...</p>
            )}
          </div>
        )}

        {(["coupang", "29cm", "kakaoGift", "brandSite"] as const).map((key) => {
          const labels: Record<string, string> = {
            coupang: "쿠팡 링크",
            "29cm": "29CM 링크",
            kakaoGift: "카카오 선물하기 링크",
            brandSite: "브랜드 자사몰 링크",
          };
          const value = product.links[key];
          return field(
            labels[key],
            <div style={{ display: "flex", gap: 6 }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={value}
                onChange={(e) => updateLink(key, e.target.value)}
              />
              <button
                type="button"
                onClick={() => copyToClipboard(value, key)}
                disabled={!value}
                style={{
                  flexShrink: 0, padding: "0 12px", borderRadius: 8,
                  border: "1px solid #e5e8eb", background: copied === key ? "#e8f3ff" : "#f8f9fa",
                  color: copied === key ? "#3182f6" : "#4e5968",
                  fontSize: 13, cursor: value ? "pointer" : "default",
                  whiteSpace: "nowrap",
                }}
              >
                {copied === key ? "복사됨" : "복사"}
              </button>
            </div>
          );
        })}

        {errorMsg && (
          <p style={{ color: "#f04452", fontSize: 13, marginBottom: 12 }}>{errorMsg}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: "100%",
            padding: "14px 0",
            borderRadius: 10,
            border: "none",
            background: "#3182f6",
            color: "#fff",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}
