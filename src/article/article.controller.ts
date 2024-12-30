import { Controller, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guards';
import { ArticleService } from './article.service';

@Controller()
@UseGuards(JwtGuard)
export class ArticleController {
  constructor(private articleService: ArticleService) {}

  public getArticleService(): ArticleService {
    return this.articleService;
  }
}
