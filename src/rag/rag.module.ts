import { Module } from '@nestjs/common';
import { RagService } from './rag.service';
import { RagWebController } from './rag.web';
import { RagAppController } from './rag.app';

@Module({
  controllers: [RagWebController, RagAppController],
  providers: [RagService],
})
export class RagModule {}
