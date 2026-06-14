"use client";

import React from "react";
import { Button } from "@mui/material";
import styled from "styled-components";
import { GroupBuyingItem } from "@/types/groupBuying";
import { ModalType } from "../types";

const ButtonWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

interface ActionButtonsProps {
  item: GroupBuyingItem;
  onOpenModal: (type: ModalType, action?: "join" | "modify") => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ item, onOpenModal }) => {
  const { isOwner, isParticipant, groupBuyingStatus } = item;

  return (
    <ButtonWrap>
      {!isOwner && !isParticipant && (
        <Button variant="contained" fullWidth onClick={() => onOpenModal("participation", "join")}>
          공동구매 참여하기
        </Button>
      )}

      {!isOwner && isParticipant && groupBuyingStatus === "RECRUITING" && (
        <Button
          variant="contained"
          color="error"
          onClick={() => onOpenModal("cancelParticipation")}
          fullWidth
        >
          참여 취소
        </Button>
      )}

      {isOwner && (
        <>
          {groupBuyingStatus === "RECRUITING" && (
            <>
              <Button
                variant="contained"
                color="warning"
                onClick={() => onOpenModal("editGroupBuying")}
                fullWidth
              >
                공동구매 수정
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => onOpenModal("cancelGroupBuying")}
                fullWidth
              >
                인원 모집 취소
              </Button>
            </>
          )}

          {groupBuyingStatus === "CONFIRMED" && (
            <Button
              variant="contained"
              color="secondary"
              onClick={() => onOpenModal("order")}
              fullWidth
            >
              공구 상품 주문하기
            </Button>
          )}

          {groupBuyingStatus === "ORDERED" && (
            <>
              <Button
                variant="contained"
                color="warning"
                onClick={() => onOpenModal("shipped")}
                fullWidth
              >
                배송 완료 및 공지
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => onOpenModal("cancelForPayment")}
                fullWidth
              >
                공동구매 취소
              </Button>
            </>
          )}

          {groupBuyingStatus === "SHIPPED" && (
            <>
              <Button
                variant="contained"
                color="warning"
                onClick={() => onOpenModal("editShipped")}
                fullWidth
              >
                수령 시간 및 장소 수정
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => onOpenModal("completeGroupBuying")}
                fullWidth
              >
                수령 확인 및 공구 완료
              </Button>
            </>
          )}
        </>
      )}
    </ButtonWrap>
  );
};

export default ActionButtons;
