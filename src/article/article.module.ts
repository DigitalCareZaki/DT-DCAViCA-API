import { Module } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ArticleWebController } from './web.controller';

@Module({
  controllers: [ArticleWebController],
  providers: [ArticleService],
})
export class ArticleModule {}
