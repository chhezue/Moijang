import { Body, Controller, Post, UseGuards, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { JwtAuthGuard } from '../auth/guard/auth.guard';
import { UserDecorator } from '../user/decorator/user.decorator';
import { Participant } from '../participant/schema/participant.schema';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @ApiOperation({ summary: '결제 시작' })
  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  async checkout(
    @Body() createCheckoutDto: CreateCheckoutDto,
    @UserDecorator('id') userId: string,
  ) {
    return await this.paymentService.checkout(createCheckoutDto, userId);
  }

  @ApiOperation({ summary: '결제 완료 및 참여자 생성' })
  @UseGuards(JwtAuthGuard)
  @Post('confirm')
  async confirm(
    @Body() verifyPaymentDto: VerifyPaymentDto,
    @UserDecorator('id') userId: string,
  ): Promise<Participant> {
    return await this.paymentService.confirm(verifyPaymentDto, userId);
  }

  @ApiOperation({ summary: '토스 페이먼츠 웹훅 (비동기 결과 수신)' })
  @Post('webhook')
  async handleWebhook(@Body() webhookData: any) {
    return await this.paymentService.handleWebhook(webhookData);
  }

  @ApiOperation({ summary: '결제 환불 (참여자용)' })
  @UseGuards(JwtAuthGuard)
  @Post('refund/:paymentKey')
  async refund(
    @Param('paymentKey') paymentKey: string,
    @Body() refundPaymentDto: RefundPaymentDto,
    @UserDecorator('id') userId: string,
  ): Promise<Participant | null> {
    return await this.paymentService.refund(paymentKey, refundPaymentDto.cancelReason, userId);
  }
}
