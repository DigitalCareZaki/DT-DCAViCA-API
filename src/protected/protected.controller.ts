import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from 'src/auth/guards';

@Controller('protected')
export class ProtectedController {
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  @Get('')
  public getProtected() {
    return [];
  }
}
