import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { AppError } from '../errors';
import { AuthService } from 'src/auth/auth.service';
import { ResetPasswordDTO } from 'src/auth/dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService
  ) { }

  @Get()
  findAll(@Query('role') role: string, @Query('search') search = "") {
    if (!role) throw new AppError('role in query parameter is required', 400);

    return this.usersService.findAll(role, search);
  }

  @Get('profile/:id')
  public async getProfile(@Param('id') id: string) {
    return this.usersService.getProfile(id);
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  public async resetPassword(@Body() dto: ResetPasswordDTO) {
    return this.authService.resetPassword(dto);
  }
}