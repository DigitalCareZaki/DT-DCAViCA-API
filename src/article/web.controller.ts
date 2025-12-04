import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
import { AdminService } from 'src/admin/admin.service';
import { GetUser } from 'src/auth/decorators';
import { UserRes } from '@types';

@Controller('web/articles')
export class ArticleWebController extends ArticleController {
  constructor(articleService: ArticleService, private readonly adminService: AdminService) {
    super(articleService);
  }

  @HttpCode(HttpStatus.OK)
  @Get('')
  public async getArticles(@GetUser() user: UserRes): Promise<any> {
    const branch = await this.adminService.getBranchId(user.id);
    return this.getArticleService().getArticles(branch.id);
  }
}
