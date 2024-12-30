import { Module } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { ComplianceWebController } from './compliance.web';
import { ComplianceAppController } from './compliance.app';

@Module({
  controllers: [ComplianceWebController, ComplianceAppController],
  providers: [ComplianceService],
})
export class ComplianceModule {}
