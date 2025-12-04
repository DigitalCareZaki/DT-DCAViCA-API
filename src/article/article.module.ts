import { Module } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ArticleWebController } from './web.controller';
import { AdminService } from 'src/admin/admin.service';

@Module({
  controllers: [ArticleWebController],
  providers: [ArticleService, AdminService],
})
export class ArticleModule { }
