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

  // 2. 결제 취소 호출 (paymentKey 기준)
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
  private handleError(error: { response?: { data?: TossErrorResponse } }) {
    const errorData = error.response?.data;
    if (errorData) {
      throw new BadRequestException({
        message: `Toss API Error: ${errorData.message}`,
        code: errorData.code,
      });
    }

    throw new InternalServerErrorException('토스 API 통신 중 서버 오류가 발생했습니다.');
  }
}
