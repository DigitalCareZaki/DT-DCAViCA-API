import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';
import { GetUser } from 'src/auth/decorators';
import { UserRes } from '@types';

@Controller('web/logs')
export class WebLogsController extends LogsController {
  constructor(logsService: LogsService) {
    super(logsService);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/')
  public async getLogs(@GetUser() user: UserRes) {
    return this.getLogsService().getLogs(user);
  }
}
