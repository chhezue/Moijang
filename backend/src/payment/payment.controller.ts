import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // @Post('checkout')
  // @ApiOperation({ summary: '결제 시작 (선점 및 장부 생성)' })
  // // @HttpCode(HttpStatus.CREATED) // 새로운 결제 시도 기록을 생성하므로 201 반환
  // async checkout(@Body() createCheckoutDto: CreateCheckoutDto) {
  //   return await this.paymentService.checkout(createCheckoutDto);
  // }
  //
  // @Post('confirm')
  // @ApiOperation({ summary: '결제 승인 완료 및 검증' })
  // // @HttpCode(HttpStatus.OK) // 상태 업데이트 및 승인 완료이므로 200 반환
  // async confirm(@Body() verifyPaymentDto: VerifyPaymentDto) {
  //   return await this.paymentService.confirm(verifyPaymentDto);
  // }
  //
  // @Post('webhook')
  // @ApiOperation({ summary: '토스 페이먼츠 웹훅 (비동기 결과 수신)' })
  // // @HttpCode(HttpStatus.OK)
  // async handleWebhook(@Body() webhookData: any) {
  //   return await this.paymentService.handleWebhook(webhookData);
  // }
  //
  // @Post('refund')
  // @ApiOperation({ summary: '결제 환불' })
  // // @HttpCode(HttpStatus.OK)
  // async refund(@Body() refundPaymentDto: RefundPaymentDto) {
  //   return await this.paymentService.refund(refundPaymentDto);
  // }
}
