import { Global, Module } from '@nestjs/common';
import { GroupBuyingModule } from '../group-buying/group-buying.module';
import { PaymentModule } from '../payment/payment.module';
import { GroupBuyingCancelOrchestratorService } from './group-buying-cancel-orchestrator.service';

@Global()
@Module({
  imports: [GroupBuyingModule, PaymentModule],
  providers: [GroupBuyingCancelOrchestratorService],
  exports: [GroupBuyingCancelOrchestratorService],
})
export class GroupBuyingCancelOrchestratorModule {}
