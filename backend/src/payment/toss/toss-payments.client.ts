import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { TossConfirmRequest, TossPaymentResponse, TossErrorResponse } from './toss-payments.types';

@Injectable()
export class TossPaymentsClient {
  private readonly baseUrl = 'https://api.tosspayments.com/v1/payments';

  constructor(private readonly httpService: HttpService) {}

  // 공통 헤더 생성 (Basic Auth)
  private getAuthHeader() {
    const encodedKey = Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64');
    return {
      Authorization: `Basic ${encodedKey}`,
      'Content-Type': 'application/json',
    };
  }

  // 1. 결제 승인 호출
  async confirm(data: TossConfirmRequest): Promise<TossPaymentResponse> {
    try {
      const response = await this.httpService.axiosRef.post<TossPaymentResponse>(
        `${this.baseUrl}/confirm`,
        data,
        { headers: this.getAuthHeader() },
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // 2. 결제 단건 조회 호출 (orderId 기준)
  // 웹훅이나 confirm 누락 시 토스 측의 최신 상태를 확인하기 위해 사용
  async getPaymentByOrderId(orderId: string): Promise<TossPaymentResponse> {
    try {
      const response = await this.httpService.axiosRef.get<TossPaymentResponse>(
        `${this.baseUrl}/orders/${orderId}`,
        { headers: this.getAuthHeader() },
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // 3. 결제 취소 호출 (paymentKey 기준)
  async cancel(paymentKey: string, cancelReason: string): Promise<TossPaymentResponse> {
    try {
      const response = await this.httpService.axiosRef.post<TossPaymentResponse>(
        `${this.baseUrl}/${paymentKey}/cancel`,
        { cancelReason },
        { headers: this.getAuthHeader() },
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // 토스 에러 응답 처리 로직
  private handleError(error: any) {
    const errorData = error.response?.data as TossErrorResponse;

    if (errorData) {
      // 토스가 정의한 에러 코드와 메시지를 포함하여 예외를 던짐
      // 서비스 레이어에서 이 code를 보고 멱등성 처리 등을 수행 가능
      return new BadRequestException({
        message: `Toss API Error: ${errorData.message}`,
        code: errorData.code,
      });
    }

    return new InternalServerErrorException('토스 API 통신 중 서버 오류가 발생했습니다.');
  }
}
