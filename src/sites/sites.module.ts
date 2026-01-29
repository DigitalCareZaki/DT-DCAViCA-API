import { Module } from '@nestjs/common';
import { SitesWebController } from './sites.web';
import { SitesService } from './sites.service';
import { VivalinkModule } from 'src/vivalink/vivalink.module';

@Module({
  imports: [VivalinkModule],
  controllers: [SitesWebController],
  providers: [SitesService],
})
export class SitesModule { }

