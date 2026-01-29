import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SitesService } from './sites.service';
import { CreateSiteDto, UpdateSiteDto } from './dto';
import { JwtGuard, RolesGuard } from 'src/auth/guards';
import { Role } from 'src/auth/enums/role.enum';
import { RequirePermission } from 'src/auth/decorators/role.decorator';

@Controller('web/sites')
@UseGuards(JwtGuard, RolesGuard)
@RequirePermission(Role.ADMIN, Role.SUPERADMIN, Role.MASTER)
export class SitesWebController {
  constructor(private siteService: SitesService) { }

  @Get()
  getAllSites(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.siteService.getAllSites(Number(page) || 1, Number(limit) || 10);
  }

  @Get(':id')
  getSiteById(@Param('id') id: string) {
    return this.siteService.getSiteById(id);
  }

  @Post()
  createSite(@Body() dto: CreateSiteDto) {
    return this.siteService.createSite(dto);
  }

  @Patch(':id')
  updateSiteById(@Param('id') id: string, @Body() dto: UpdateSiteDto) {
    return this.siteService.updateSiteById(id, dto);
  }

  @Delete(':id')
  deleteSiteById(@Param('id') id: string) {
    return this.siteService.deleteSiteById(id);
  }
}
