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
import type { UserRes } from '@types';
import { GetUser } from 'src/auth/decorators';
import { RequirePermission } from 'src/auth/decorators/role.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { JwtGuard, RolesGuard } from 'src/auth/guards';

import { CreateSiteDto, UpdateSiteDto } from './dto';
import { SitesService } from './sites.service';

@Controller('web/sites')
@UseGuards(JwtGuard, RolesGuard)
@RequirePermission(Role.ADMIN, Role.SUPERADMIN, Role.MASTER)
export class SitesWebController {
  constructor(private siteService: SitesService) { }

  @Get()
  getAllSites(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.siteService.getAllSites(
      Number(page) || 1,
      Number(limit) || 10,
      branchId,
    );
  }

  @Get(':id')
  getSiteById(@Param('id') id: string) {
    return this.siteService.getSiteById(id);
  }

  @Post()
  createSite(@Body() dto: CreateSiteDto, @GetUser() user: UserRes) {
    return this.siteService.createSite(dto, user.id, user.role);
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
