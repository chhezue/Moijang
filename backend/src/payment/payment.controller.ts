import { Body, Controller, Post, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { JwtAuthGuard } from '../auth/guard/auth.guard';
import { UserDecorator } from '../user/decorator/user.decorator';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @ApiOperation({ summary: '결제 시작' })
  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  // @HttpCode(HttpStatus.CREATED) // 새로운 결제 시도 기록을 생성하므로 201 반환
  async checkout(
    @Body() createCheckoutDto: CreateCheckoutDto,
    @UserDecorator('id') userId: string,
  ) {
    return await this.paymentService.checkout(createCheckoutDto, userId);
  }

  @ApiOperation({ summary: '결제 완료 및 참여자 생성' })
  @UseGuards(JwtAuthGuard)
  @Post('confirm')
  // @HttpCode(HttpStatus.OK) // 상태 업데이트 및 승인 완료이므로 200 반환
  async confirm(@Body() verifyPaymentDto: VerifyPaymentDto, @UserDecorator('id') userId: string) {
    return await this.paymentService.confirm(verifyPaymentDto, userId);
  }

  // 순서	하는 일	의미
  // ①
  // orderId로 Payment 조회
  // 이 주문이 우리 서버에 checkout으로 만들어진 건지
  // ②
  // 없으면 404
  // 위조·오타 orderId 차단
  // ③
  // 이미 PAID면 토스 호출 없이 성공 응답
  // 멱등성 — 같은 confirm이 여러 번 와도 이중 승인 안 함
  // ④
  // payment.amount === dto.amount
  // 클라이언트가 토스에 넣은 금액이 checkout 때 DB에 박아 둔 금액과 같은지 (조작·불일치 방지)
  // ⑤
  // 그 다음에 tossPaymentsClient.confirm(...)
  // 이제서야 토스에 “이 금액으로 승인해 달라” 요청

  @ApiOperation({ summary: '토스 페이먼츠 웹훅 (비동기 결과 수신)' })
  @Post('webhook')
  // @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() webhookData: any) {
    return await this.paymentService.handleWebhook(webhookData);
  }

  @ApiOperation({ summary: '결제 환불' })
  @UseGuards(JwtAuthGuard)
  @Post('refund')
  // @HttpCode(HttpStatus.OK)
  async refund(@Body() refundPaymentDto: RefundPaymentDto, @UserDecorator('id') userId: string) {
    return await this.paymentService.refund(refundPaymentDto, userId);
  }
}
