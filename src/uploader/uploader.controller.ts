import { Controller, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guards';
import { UploaderService } from './uploader.service';

@Controller()
@UseGuards(JwtGuard)
export class UploaderController {
  constructor(private uploaderService: UploaderService) {}

  public getUploaderService(): UploaderService {
    return this.uploaderService;
  }
}
