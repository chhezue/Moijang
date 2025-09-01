"use client";

import React, { Suspense } from "react";
import Providers from "@/redux/Provider";

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Providers>
      <main className="grid min-h-screen w-full place-items-center overflow-hidden">
        {children}
      </main>
    </Providers>
  );
}
