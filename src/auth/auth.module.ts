import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { JwtStrategy } from './strategy';

import { AuthWebController } from './web.controller';
import { AuthAppController } from './app.controller';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: async () => {
        return {
          secret: process.env.JWT_SECRET,
          signOptions: { expiresIn: process.env.JWT_EXPIRESIN },
        };
      },
    }),
  ],
  controllers: [AuthWebController, AuthAppController],
  providers: [AuthService, JwtStrategy, OtpService],
  exports: [AuthService, JwtModule, OtpService],
})
export class AuthModule { }
