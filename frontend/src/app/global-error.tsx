"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="ko">
      <body
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          fontFamily: "sans-serif",
          gap: "16px",
          margin: 0,
          textAlign: "center",
          padding: "0 16px",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600 }}>문제가 발생했습니다</h2>
        <p style={{ color: "#666", margin: 0, fontSize: "0.875rem" }}>잠시 후 다시 시도해주세요.</p>
        <button
          onClick={reset}
          style={{
            padding: "6px 18px",
            cursor: "pointer",
            border: "1px solid #ccc",
            borderRadius: "6px",
            background: "white",
            fontSize: "0.875rem",
          }}
        >
          다시 시도
        </button>
      </body>
    </html>
  );
}
