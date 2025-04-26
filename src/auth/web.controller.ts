import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import {
  LoginDTO,
  ChangePasswordDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
  SetPincodeDTO,
  VerifyPincodeDTO,
} from './dto';
import { JwtGuard } from './guards';
import { GetUser } from './decorators';
import { UserRes } from '@types';

@Controller('web/auth')
export class AuthWebController extends AuthController {
  constructor(authService: AuthService) {
    super(authService);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  public async login(@Body() dto: LoginDTO) {
    return this.getAuthService().login(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  public async forgotPassword(@Body() dto: ForgotPasswordDTO) {
    return this.getAuthService().forgotPassword(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('reset-password')
  public async resetPassword(@Body() dto: ResetPasswordDTO) {
    return this.getAuthService().resetPassword(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('change-password')
  @UseGuards(JwtGuard)
  public async changePassword(
    @Body() dto: ChangePasswordDTO,
    @GetUser() user: UserRes,
  ): Promise<UserRes> {
    return this.getAuthService().changePassword(dto, user);
  }

  @HttpCode(HttpStatus.OK)
  @Get('current')
  @UseGuards(JwtGuard)
  public current(@GetUser() user: UserRes): UserRes {
    return user;
  }

  @HttpCode(HttpStatus.OK)
  @Patch('set-pincode')
  @UseGuards(JwtGuard)
  public setPincode(@GetUser() user: UserRes, @Body() dto: SetPincodeDTO) {
    return this.getAuthService().setPincode(user, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('verify-pincode')
  @UseGuards(JwtGuard)
  public changePincode(
    @GetUser() user: UserRes,
    @Body() dto: VerifyPincodeDTO,
  ) {
    return this.getAuthService().verifyPincode(user, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Get('exists-pincode')
  @UseGuards(JwtGuard)
  public async existsPincode(@GetUser() user: UserRes) {
    return this.getAuthService().existsPincode(user);
  }
  @HttpCode(HttpStatus.OK)
  @Get('pinpassword')
  @UseGuards(JwtGuard)
  public async getPinPasswordList(@GetUser() user: UserRes) {
    return this.getAuthService().getPinPasswordList(user);
  }
}
