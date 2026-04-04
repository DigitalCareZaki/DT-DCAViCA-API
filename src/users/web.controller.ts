import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { AppError } from '../errors';

@Controller('web/users')
export class UsersWebController {
  constructor(private readonly usersService: UsersService) {}

  @Get('check-username/:username')
  public async checkUsername(@Param('username') username: string) {
    if (!username) throw new AppError('Username is required', 400);
    return this.usersService.checkUsername(username);
  }
}
