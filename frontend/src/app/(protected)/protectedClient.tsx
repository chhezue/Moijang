"use client";
import Header from "@/layouts/header/Header";

export default function ProtectedClient({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}
