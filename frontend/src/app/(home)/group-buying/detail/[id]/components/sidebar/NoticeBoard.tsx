"use client";

import React from "react";
import styled from "styled-components";
import { Alert } from "@mui/material";
import { GroupBuyingItem, IParticipant, IUser } from "@/types/groupBuying";

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

function getRemainingTime(updatedAt: string | Date): string {
  const now = new Date();
  const start = new Date(updatedAt);

  // updatedAt + 24시간
  const deadline = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const diff = deadline.getTime() - now.getTime();

  console.log("📌 getRemainingTime debug");
  console.log(" updatedAt(raw):", updatedAt);
  console.log(" start(parsed):", start.toISOString());
  console.log(" deadline(+24h):", deadline.toISOString());
  console.log(" now:", now.toISOString(), " diff(ms):", diff);

  if (diff <= 0) return "0분";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}시간 ${minutes}분`;
}

const getNoticeMessage = (item: GroupBuyingItem): Notice | null => {
  const { isOwner, isParticipant, groupBuyingStatus, participantInfo } = item;

  const isPaid = participantInfo?.isPaid ?? false;
  const count = participantInfo?.count ?? 0;

  // ---- 상태 분기 ----
  if (!isParticipant && !isOwner) {
    return { type: "info", text: "참여자만 상세 진행 내용을 볼 수 있어요." };
  }

  if (isParticipant && !isOwner && groupBuyingStatus === "CONFIRMED") {
    return {
      type: "info",
      text: "총대가 입금 요청을 하면 24시간 내에 송금을 완료해 주세요.",
    };
  }

  if (isOwner && groupBuyingStatus === "PAYMENT_IN_PROGRESS") {
    return {
      type: "warning",
      text: "24시간 이내에 미입금자가 생기면 공구는 자동 취소돼요. 팀원이 모두 입금 완료해서 주문 대기 상태로 바뀌면 총대는 입금을 확인하고 3일 이내에 주문을 완료해 주세요.",
    };
  }

  if (isParticipant && !isOwner && groupBuyingStatus === "PAYMENT_IN_PROGRESS") {
    if (!isPaid && count > 0) {
      const amount = (count * item.estimatedPrice).toLocaleString("ko-KR");
      return {
        type: "warning",
        text: (
          <>
            <span style={{ color: "#d32f2f", fontWeight: 600 }}>
              {getRemainingTime(item.updatedAt)} 이내 입금해주세요.
            </span>
            <br />
            <br />
            <span>
              구매 수량: <strong>{count}개</strong>
            </span>
            <br />
            <span>
              입금 금액(총): <strong>{amount}원</strong>
            </span>
            <br />
            <span>
              은행: <strong>{item.bank}</strong>
            </span>
            <br />
            <span>
              계좌: <strong>{item.account}</strong>
            </span>
            <br />
            <br />
            입금 후 <strong>입금완료</strong> 버튼을 꼭 눌러주세요.
          </>
        ),
      };
    }
    return {
      type: "info",
      text: "입금 확인 대기 중이에요. 총대가 확인 후 진행될 예정이에요.",
    };
  }

  if (
    isParticipant &&
    ["PAYMENT_IN_PROGRESS", "ORDER_PENDING"].includes(groupBuyingStatus) &&
    isPaid
  ) {
    return {
      type: "info",
      text: "입금 확인 대기 중이에요. 총대가 확인 후 진행될 예정이에요.",
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
