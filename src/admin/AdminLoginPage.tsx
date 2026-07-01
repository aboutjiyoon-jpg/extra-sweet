import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAdminAuth } from "./AdminAuthContext";

export default function AdminLoginPage() {
  const { setPassword } = useAdminAuth();
  const [input, setInput] = useState("");
  const [checking, setChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input) return;
    setChecking(true);
    setErrorMsg("");

    const { data, error } = await supabase.rpc("admin_check_password", {
      p_password: input,
    });

    setChecking(false);

    if (error) {
      setErrorMsg("로그인 확인 중 오류가 발생했어요: " + error.message);
      return;
    }
    if (!data) {
      setErrorMsg("비밀번호가 올바르지 않아요.");
      return;
    }
    setPassword(input);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 360,
          background: "#fff",
          borderRadius: 16,
          padding: 32,
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
          요즘 선물 어드민
        </h1>
        <input
          type="password"
          autoFocus
          placeholder="비밀번호"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid #e5e8eb",
            fontSize: 16,
            outline: "none",
            marginBottom: 12,
            boxSizing: "border-box",
          }}
        />
        {errorMsg && (
          <p style={{ color: "#f04452", fontSize: 13, marginBottom: 12 }}>
            {errorMsg}
          </p>
        )}
        <button
          type="submit"
          disabled={checking}
          style={{
            width: "100%",
            padding: "12px 0",
            borderRadius: 10,
            border: "none",
            background: "#3182f6",
            color: "#fff",
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
            opacity: checking ? 0.6 : 1,
          }}
        >
          {checking ? "확인 중..." : "로그인"}
        </button>
      </form>
    </div>
  );
}
