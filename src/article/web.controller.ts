import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';

@Controller('web/articles')
export class ArticleWebController extends ArticleController {
  constructor(articleService: ArticleService) {
    super(articleService);
  }

  @HttpCode(HttpStatus.OK)
  @Get('')
  public async getArticles(): Promise<any> {
    return this.getArticleService().getArticles();
  }
}
