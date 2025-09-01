"use client";

import React, { createContext, useContext } from "react";
import { useGroupBuyingStatus } from "@/hooks/useGroupBuyingStatus";

interface StatusContextType {
  isLoading: boolean;
  statusMap: Record<string, string>;
  colorMap: Record<string, { bg: string; color: string }>;
  statusList: { key: string; label: string }[];
  statusToStepIndex: Record<string, number>;
}

const StatusContext = createContext<StatusContextType | undefined>(undefined);

export const StatusProvider = ({ children }: { children: React.ReactNode }) => {
  const { isLoading, statusMap, colorMap, statusList, statusToStepIndex } =
    useGroupBuyingStatus();

  return (
    <StatusContext.Provider
      value={{ isLoading, statusMap, colorMap, statusList, statusToStepIndex }}
    >
      {children}
    </StatusContext.Provider>
  );
};

export const useStatusContext = () => {
  const context = useContext(StatusContext);
  if (!context) {
    throw new Error("useStatusContext must be used within a StatusProvider.");
  }
  return context;
};
