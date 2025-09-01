"use client";
import Header from "@/layouts/header/Header";
import AuthInitializer from "@/components/AuthInitializer";

export default function ProtectedClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <AuthInitializer requireAuth>{children}</AuthInitializer>
    </>
  );
}
