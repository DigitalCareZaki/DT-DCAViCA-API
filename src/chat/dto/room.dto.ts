import { IsNotEmpty, IsUUID } from 'class-validator';

export class RoomDTO {
  @IsNotEmpty()
  @IsUUID()
  user_id: string;
}
