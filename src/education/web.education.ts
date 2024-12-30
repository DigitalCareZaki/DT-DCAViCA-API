import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EducationController } from './education.controller';
import { EducationService } from './education.service';
import { RolesGuard } from 'src/auth/guards';
import { Role } from 'src/auth/enums/role.enum';
import { RequirePermission } from 'src/auth/decorators/role.decorator';
import { GetUser } from 'src/auth/decorators';
import { PostDTO } from './dto';

import type { HealthRes, JsonRes, UserRes } from '@types';
import type { PostRes, Post as PostSchemaTypes } from './types';
@Controller('web/education')
export class EducationWebController extends EducationController {
  constructor(private readonly educationService: EducationService) {
    super(educationService);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/health')
  public async health(): Promise<HealthRes> {
    return {
      status: 'running',
      availableRoutes: [],
    };
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  public async getPosts(): Promise<PostRes[]> {
    return this.getEducationService().getPosts();
  }

  @UseGuards(RolesGuard)
  @RequirePermission(Role.DOCTOR, Role.ADMIN, Role.SUPERADMIN)
  @HttpCode(HttpStatus.CREATED)
  @Post()
  public async createdPost(
    @GetUser() user: UserRes,
    @Body() data: PostDTO,
  ): Promise<PostSchemaTypes> {
    return this.getEducationService().createPost(user.id, data);
  }

  @HttpCode(HttpStatus.ACCEPTED)
  @Get('like/:id') // :id -> post_id
  public async likePost(
    @GetUser() user: UserRes,
    @Param('id') postId: string,
  ): Promise<JsonRes> {
    return this.getEducationService().likePost(postId, user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/trending-posts')
  public async getTrendingPosts(): Promise<PostRes[]> {
    return this.getEducationService().getTrendingPosts();
  }

  @HttpCode(HttpStatus.OK)
  @Get('/my-posts')
  public async getMyArticles(@GetUser() user: UserRes): Promise<PostRes[]> {
    // return this.getEducationService()
    return this.getEducationService().getMyPosts(user);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/search')
  public async search(@Query('value') value: string): Promise<PostRes[]> {
    return this.getEducationService().search(value);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/detail/:id')
  public async getDetails(
    @GetUser() user: UserRes,
    @Param('id') postId: string,
  ) {
    const post = await this.getEducationService().getPostDetail(postId);

    await this.getEducationService().viewPost(postId, user.id);

    return post;
  }

  @HttpCode(HttpStatus.OK)
  @Get('/:id')
  public async getIndividialPost(
    @GetUser() user: UserRes,
    @Param('id') postId: string,
  ): Promise<any> {
    const post = await this.getEducationService().getIndividualPost(postId);
    await this.getEducationService().viewPost(postId, user.id);

    return post;
  }

  @HttpCode(HttpStatus.OK)
  @Delete('/:id')
  public async deletePost(
    @GetUser() user: UserRes,
    @Param('id') postId: string,
  ): Promise<any> {
    return await this.getEducationService().deletePost(user.id, postId);
  }
}
