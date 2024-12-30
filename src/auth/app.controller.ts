import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

import { AuthController } from './auth.controller';
import { LoginDTO } from './dto/login.dto';

@Controller('app/auth')
export class AuthAppController extends AuthController {
  constructor(authService: AuthService) {
    super(authService);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDTO) {
    return this.getAuthService().login(dto);
  }
}
