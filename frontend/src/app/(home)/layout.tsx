"use client";
import React from "react";
import Header from "@/layouts/header/Header";
import Providers from "@/redux/Provider";

export default function HomeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <Providers>
      <Header />
      {children}
    </Providers>
  );
}
