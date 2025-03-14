import { Module } from '@nestjs/common';
import { ReadingRangeService } from './readingRange.service';
import { ReadingRangeWebController } from './readingRange.web';
import { ReadingRangeAppController } from './readingRange.app';
import { TwilioService } from 'src/twilio/twilio.service';

@Module({
  controllers: [ReadingRangeWebController, ReadingRangeAppController],
  providers: [ReadingRangeService, TwilioService],
})
export class ReadingRangeModule { }
