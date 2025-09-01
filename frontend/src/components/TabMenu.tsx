"use client";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@mui/material";

interface TabItem {
  label: string;
  value: string;
}

interface TabMenuProps {
  tabs: TabItem[];
  activeTab?: string;
  onTabChange?: (value: string) => void;
  basePath?: string;
}

export default function TabMenu({
  tabs,
  basePath,
  activeTab,
  onTabChange,
}: TabMenuProps) {
  const pathname = usePathname();
  const router = useRouter();

  // basePath가 있을 경우 → 라우팅 기반 탭
  // basePath가 없고 activeTab만 있을 경우 → 상태 기반 탭
  const currentTab = activeTab ?? pathname.split("/").pop();

  const handleTabClick = (value: string) => {
    if (onTabChange) {
      onTabChange(value);
    } else if (basePath) {
      router.push(`${basePath}/${value}`);
    }
  };

  return (
    <nav style={{ display: "flex", gap: "1.5rem" }}>
      {tabs.map((tab) => {
        const isActive = currentTab === tab.value;

        return (
          <Button
            key={tab.value}
            onClick={() => handleTabClick(tab.value)}
            sx={{
              transition: "transform 0.2s",
              transform: isActive ? "none" : "translateY(0)",
              "&:hover": {
                transform: isActive ? "none" : "translateY(-2px)",
              },
              padding: "0.75rem 1rem",
              fontWeight: isActive ? 700 : 500,
              color: isActive ? "primary.main" : "text.secondary",
              borderBottom: isActive ? "2px solid" : "2px solid transparent",
              borderColor: isActive ? "primary.main" : "transparent",
              borderRadius: 0,
              textTransform: "none",
              background: "none",
              boxShadow: "none",
            }}
          >
            {tab.label}
          </Button>
        );
      })}
    </nav>
  );
}
