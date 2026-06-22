import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        fontFamily: "sans-serif",
        gap: "16px",
        textAlign: "center",
        padding: "0 16px",
      }}
    >
      <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600 }}>페이지를 찾을 수 없습니다</h2>
      <p style={{ color: "#666", margin: 0, fontSize: "0.875rem" }}>
        요청하신 페이지가 존재하지 않거나 이동되었습니다.
      </p>
      <Link
        href="/"
        style={{
          padding: "6px 18px",
          border: "1px solid #ccc",
          borderRadius: "6px",
          textDecoration: "none",
          color: "inherit",
          fontSize: "0.875rem",
        }}
      >
        홈으로
      </Link>
    </div>
  );
}
