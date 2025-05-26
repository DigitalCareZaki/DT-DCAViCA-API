import { Controller, Get, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { AppError } from '../errors';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  findAll(@Query('role') role: string, @Query('search') search = "") {
    if (!role) throw new AppError('role in query parameter is required', 400);

    return this.usersService.findAll(role, search);
  }
}
