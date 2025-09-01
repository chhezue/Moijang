"use client";

import React, { createContext, useContext } from "react";
import { useGroupBuyingCategory } from "@/hooks/useGroupBuyingCategory";

interface CategoryContextType {
  isLoading: boolean;
  categoryMap: Record<string, string>;
  categoryIconMap: Record<string, React.ComponentType>;
  categoryList: { key: string; label: string }[];
}

const CategoryContext = createContext<CategoryContextType | undefined>(
  undefined
);

export const CategoryProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { isLoading, categoryMap, categoryIconMap, categoryList } =
    useGroupBuyingCategory();

  return (
    <CategoryContext.Provider
      value={{
        isLoading,
        categoryMap,
        categoryIconMap,
        categoryList,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategoryContext = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error(
      "useCategoryContext must be used within a CategoryProvider."
    );
  }
  return context;
};
