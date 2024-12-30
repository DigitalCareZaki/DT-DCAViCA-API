import { Module } from '@nestjs/common';
import { VivalinkController } from './vivalink.controller';
import { VivalinkService } from './vivalink.service';

@Module({
  controllers: [VivalinkController],
  providers: [VivalinkService],
})
export class VivalinkModule {}
