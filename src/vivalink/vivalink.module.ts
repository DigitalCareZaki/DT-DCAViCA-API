import { Module } from '@nestjs/common';
import { VivalinkController } from './vivalink.controller';
import { VivalinkService } from './vivalink.service';
import { VivalinkWebPortalTokenService } from './vivalink-webportal-token.service';

@Module({
  controllers: [VivalinkController],
  providers: [VivalinkService, VivalinkWebPortalTokenService],
  exports: [VivalinkWebPortalTokenService],
})
export class VivalinkModule { }
