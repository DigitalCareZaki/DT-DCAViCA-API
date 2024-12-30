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

@Controller('web/chat')
export class ChatWebController extends ChatController {
  constructor(chatService: ChatService) {
    super(chatService);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/room')
  public getRooms(@GetUser() user: UserRes): Promise<GetRoomsProps[]> {
    return this.getChatService().getChatRooms(user);
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
  @Get('/search/users')
  public searchRooms(
    @Query('search') search: string,
    @GetUser() user: UserRes,
  ): Promise<SearchUsersProps[]> {
    return this.getChatService().searchRooms(search, user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/room/:id')
  public getRoomChats(@Param('id') id: string): Promise<any> {
    return this.getChatService().getRoomChats(id);
  }
}
