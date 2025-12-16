import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { GetUser } from 'src/auth/decorators';
import { UserRes } from '@types';
import { RoomDTO } from './dto/room.dto';
import { CreateRoomProps, GetRoomsProps, SearchUsersProps } from './types';
import { AdminService } from 'src/admin/admin.service';

@Controller('web/chat')
export class ChatWebController extends ChatController {
  constructor(chatService: ChatService, private readonly adminService: AdminService) {
    super(chatService);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/room')
  public async getRooms(@GetUser() user: UserRes): Promise<GetRoomsProps[]> {
    const branchId = await this.adminService.getBranchId(user.id);
    return this.getChatService().getChatRooms(user, branchId.id);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('/room')
  public createRoom(
    @GetUser() user: UserRes,
    @Body() dto: RoomDTO,
  ): Promise<CreateRoomProps> {
    return this.getChatService().ceateRoom(user, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/room/:id/read')
  public markRoomRead(
    @GetUser() user: UserRes,
    @Param('id') id: string,
  ): Promise<{ updated: number }> {
    return this.getChatService().markRoomRead(user, id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/search/users')
  public async searchRooms(
    @Query('search') search: string,
    @GetUser() user: UserRes,
  ): Promise<SearchUsersProps[]> {
    const branch = await this.adminService.getBranchId(user.id);
    return this.getChatService().searchRooms(search, user, branch.id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/room/:id')
  public getRoomChats(@Param('id') id: string): Promise<any> {
    return this.getChatService().getRoomChats(id);
  }
}
