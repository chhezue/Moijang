import api from "@/apis/apiClient";
import { IParticipant } from "@/types/groupBuying";

export interface CheckoutRequest {
  gbId: string;
  count: number;
}

export interface CheckoutResponse {
  orderId: string;
  amount: number;
  clientKey: string;
  orderName: string;
  gbId: string;
  count: number;
}

export interface ConfirmPaymentRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
}

export interface RefundPaymentRequest {
  gbId: string;
  cancelReason: string;
}

export const checkout = async (req: CheckoutRequest): Promise<CheckoutResponse> => {
  const { data } = await api.post("/api/payment/checkout", req);
  return data;
};

export const confirmPayment = async (
  req: ConfirmPaymentRequest,
): Promise<IParticipant | string> => {
  const { data } = await api.post("/api/payment/confirm", req);
  return data;
};

export const refundPayment = async (req: RefundPaymentRequest): Promise<IParticipant | string> => {
  const { data } = await api.post("/api/payment/refund", req);
  return data;
};
