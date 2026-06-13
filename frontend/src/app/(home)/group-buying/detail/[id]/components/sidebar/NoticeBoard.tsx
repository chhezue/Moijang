"use client";

import React from "react";
import styled from "styled-components";
import { Alert } from "@mui/material";
import { GroupBuyingItem } from "@/types/groupBuying";

const NoticeWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  .MuiAlert-root {
    font-size: 0.9rem;
    line-height: 1.4;
  }

  .MuiAlert-message {
    font-size: 0.9rem;
  }
`;

type NoticeType = "info" | "warning" | "success" | "error";

interface Notice {
  type: NoticeType;
  text: React.ReactNode;
}

const getNoticeMessage = (item: GroupBuyingItem): Notice | null => {
  const { isOwner, isParticipant, groupBuyingStatus } = item;

  // ---- 상태 분기 ----
  if (!isParticipant && !isOwner) {
    return { type: "info", text: "참여자만 상세 진행 내용을 볼 수 있어요." };
  }

  if (isParticipant && !isOwner && groupBuyingStatus === "CONFIRMED") {
    return {
      type: "info",
      text: "결제가 완료되었어요. 총대가 곧 상품을 주문할 예정이에요.",
    };
  }

  if (isParticipant && groupBuyingStatus === "ORDERED") {
    return {
      type: "success",
      text: "총대가 주문을 완료했어요. 배송 후 수령 장소와 시간이 공지될 예정이에요.",
    };
  }

  if (groupBuyingStatus === "SHIPPED") {
    return {
      type: "info",
      text: (
        <>
          <div
            style={{
              color: "#1976d2",
              fontWeight: 600,
              marginBottom: "0.5rem",
            }}
          >
            상품이 배송 완료되어 수령 가능해요.
          </div>
          <div>
            수령 가능 기간: <strong>{item.pickupTime}</strong>
          </div>
          <div>
            수령 장소: <strong>{item.pickupPlace}</strong>
          </div>
          <div style={{ marginTop: "0.75rem", color: "#555" }}>
            ※ 배송 완료일로부터 <strong>3일 후</strong>에 공동구매는 자동 종료돼요.
          </div>
        </>
      ),
    };
  }

  if (isOwner && groupBuyingStatus === "COMPLETED") {
    return {
      type: "success",
      text: "총대님 고생 많으셨어요! 공구가 성공적으로 끝났어요 ✨",
    };
  }

  if (isParticipant && groupBuyingStatus === "COMPLETED") {
    return {
      type: "success",
      text: (
        <>
          <div
            style={{
              color: "#2e7d32",
              fontWeight: 600,
              marginBottom: "0.5rem",
            }}
          >
            이 공구는 완료되었어요 ✅
          </div>
          <div>참여해주셔서 감사합니다!</div>
        </>
      ),
    };
  }

  return null;
};

interface NoticeBoardProps {
  item: GroupBuyingItem;
}

const NoticeBoard: React.FC<NoticeBoardProps> = ({ item }) => {
  const notice = getNoticeMessage(item);
  if (!notice) return null;
  return (
    <NoticeWrap>
      <Alert severity={notice.type}>{notice.text}</Alert>
    </NoticeWrap>
  );
};

export default NoticeBoard;
