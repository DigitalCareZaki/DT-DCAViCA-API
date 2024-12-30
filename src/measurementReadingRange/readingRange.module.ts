import { Module } from '@nestjs/common';
import { ReadingRangeService } from './readingRange.service';
import { ReadingRangeWebController } from './readingRange.web';
import { ReadingRangeAppController } from './readingRange.app';

@Module({
  controllers: [ReadingRangeWebController, ReadingRangeAppController],
  providers: [ReadingRangeService],
})
export class ReadingRangeModule {}
