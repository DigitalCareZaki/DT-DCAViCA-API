import { Module } from '@nestjs/common';
import { VivalinkController } from './vivalink.controller';
import { VivalinkService } from './vivalink.service';
import { VivalinkWebPortalTokenService } from './vivalink-webportal-token.service';
import { UsersService } from 'src/users/users.service';

@Module({
  controllers: [VivalinkController],
  providers: [VivalinkService, VivalinkWebPortalTokenService, UsersService],
  exports: [VivalinkWebPortalTokenService],
})
export class VivalinkModule { }
