import type { ReactNode } from "react";

export default function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8f9fa",
        display: "flex",
        justifyContent: "center",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          minHeight: "100vh",
          background: "#f8f9fa",
          position: "relative",
        }}
      >
        {children}
      </div>
    </div>
  );
}
