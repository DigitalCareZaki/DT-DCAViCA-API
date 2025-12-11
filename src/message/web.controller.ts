import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { GetUser } from 'src/auth/decorators';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { ComposeDTO } from './dto/compose.dto';

import type { InboxRes, Message, SearchUserRes } from './types';
import type { HealthRes, UserRes } from '@types';
import { Role } from 'src/auth/enums/role.enum';
import { AdminService } from 'src/admin/admin.service';

@Controller('web/message')
export class MessageWebController extends MessageController {
  constructor(messageService: MessageService, private readonly adminService: AdminService) {
    super(messageService);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/health')
  public health(): HealthRes {
    return {
      status: 'running',
      availableRoutes: [],
    };
  }

  @HttpCode(HttpStatus.OK)
  @Get('/inbox')
  public async inbox(
    @GetUser() user: UserRes,
    @Query('search') search: string,
  ): Promise<InboxRes[]> {
    return this.getMessageService().inbox(user.id, search);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/sent')
  public async sent(
    @GetUser() user: UserRes,
    @Query('search') search: string,
  ): Promise<InboxRes[]> {
    return this.getMessageService().getSentMessages(user.id, search);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/starred')
  public async starred(
    @GetUser() user: UserRes,
    @Query('search') search: string,
  ): Promise<InboxRes[]> {
    return this.getMessageService().getStarredMessages(user.id, search);
  }

  @HttpCode(HttpStatus.ACCEPTED)
  @Patch('/action/:id')
  public async action(
    @GetUser() user: UserRes,
    @Query('type') type: string,
    @Param('id') id: string,
  ): Promise<boolean> {
    console.log('Starring message userId: ', user.id);
    if (type === 'starred') {
      return await this.getMessageService().starredMessage(user.id, id);
    }

    if (type === 'delete') {
      return await this.getMessageService().deleteMessage(user.id, id);
    }

    if (type === 'unstarred') {
      return await this.getMessageService().unstarredMessage(user.id, id);
    }

    return false;
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('/compose')
  public async compose(
    @GetUser() user: UserRes,
    @Body() data: ComposeDTO,
  ): Promise<Message> {
    return this.getMessageService().compose(user.id, data);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/search/users')
  public async searchUsers(
    @GetUser() user: UserRes,
    @Query('value') value: string,
  ) {

    let branchId: any;
    if (user.role === Role.ADMIN || user.role === Role.DOCTOR || user.role === Role.PATIENT) {
      branchId = await this.adminService.getBranchId(user.id);
    }
    const targetId =
      user.role === Role.SUPERADMIN ? user.organization_id : branchId.id;
    console.log('targetId', targetId);

    return this.getMessageService().searchUsers(value, targetId, user.role, user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/thread')
  public async getThreadByParent(@Query('messageId') messageId: string) {
    return this.getMessageService().getThreadByParent(messageId);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/messagesbyuser')
  public async getUserMessages(
    @GetUser() user: UserRes,
    @Query('messageId') messageId: string,
  ) {
    return this.getMessageService().getUserMessages(user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('/update/:rootId')
  public async markThreadAsRead(
    @GetUser() user: UserRes,
    @Param('rootId') rootId: string,
  ): Promise<any> {
    console.log('Marking thread as read for user:', user.id, 'and rootId:', rootId);
    return this.getMessageService().markThreadAsRead(user.id, rootId);
  }
  @HttpCode(HttpStatus.OK)
  @Patch('/update-message/:id')
  public async markMessageAsRead(
    @GetUser() user: UserRes,
    @Param('id') id: string,
  ): Promise<any> {
    console.log('Marking thread as read for user:', user.id, 'and rootId:', id);
    return this.getMessageService().markMessageAsRead(user.id, id);
  }
}
