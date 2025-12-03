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
import { EducationService } from './education.service';
import { JwtGuard, RolesGuard } from 'src/auth/guards';
import { Role } from 'src/auth/enums/role.enum';
import { RequirePermission } from 'src/auth/decorators/role.decorator';
import { GetUser } from 'src/auth/decorators';
import { PostDTO } from './dto';
import type { HealthRes, JsonRes, UserRes } from '@types';
import type { PostRes, Post as PostSchemaTypes } from './types';
import { AdminService } from 'src/admin/admin.service';

@Controller('web/education')
@UseGuards(JwtGuard)
export class EducationWebController {
  constructor(private readonly educationService: EducationService, private readonly adminService: AdminService) { }

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
  public async getPosts(@Query('page') page?: number, @Query('limit') limit?: number): Promise<PostRes[]> {
    return this.educationService.getPosts(page ? +page : 1, limit ? +limit : 10);
  }

  @UseGuards(RolesGuard)
  @RequirePermission(Role.DOCTOR, Role.ADMIN, Role.SUPERADMIN)
  @HttpCode(HttpStatus.CREATED)
  @Post()
  public async createdPost(
    @GetUser() user: UserRes,
    @Body() data: PostDTO,
  ): Promise<PostSchemaTypes> {
    return this.educationService.createPost(user.id, data);
  }

  @HttpCode(HttpStatus.ACCEPTED)
  @Get('like/:id') // :id -> post_id
  public async likePost(
    @GetUser() user: UserRes,
    @Param('id') postId: string,
  ): Promise<JsonRes> {
    return this.educationService.likePost(postId, user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/trending-posts')
  public async getTrendingPosts(@GetUser() user: UserRes): Promise<PostRes[]> {
    const branch = await this.adminService.getBranchId(user.id);
    return this.educationService.getTrendingPosts(branch.id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/my-posts')
  public async getMyArticles(@GetUser() user: UserRes): Promise<PostRes[]> {
    // return this.getEducationService()
    return this.educationService.getMyPosts(user);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/search')
  public async search(@Query('value') value: string): Promise<PostRes[]> {
    return this.educationService.search(value);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/detail/:id')
  public async getDetails(
    @GetUser() user: UserRes,
    @Param('id') postId: string,
  ) {
    const post = await this.educationService.getPostDetail(postId);

    await this.educationService.viewPost(postId, user.id);

    return post;
  }

  @HttpCode(HttpStatus.OK)
  @Get('/:id')
  public async getIndividialPost(
    @GetUser() user: UserRes,
    @Param('id') postId: string,
  ): Promise<any> {
    console.log(postId, '======>>>');
    const post = await this.educationService.getIndividualPost(postId);
    console.log(post, '======>>>');
    await this.educationService.viewPost(postId, user.id);

    return post;
  }

  @HttpCode(HttpStatus.OK)
  @Delete('/:id')
  public async deletePost(
    @GetUser() user: UserRes,
    @Param('id') postId: string,
  ): Promise<any> {
    return await this.educationService.deletePost(user.id, postId);
  }
}
