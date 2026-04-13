import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Patch,
  Search,
  Query,
} from '@nestjs/common';

import { TabletController } from './tablet.controller';
import { TabletService } from './tablet.service';

import { GetUser } from 'src/auth/decorators';

import { TabletDTO, ManageTabletDTO } from './dto';

import type { UserRes } from '@types';
import type { Tablet } from './types';
import { AccessoriesDTO } from './dto/accessories.dto';
import { AdminService } from 'src/admin/admin.service';
import { Role } from '@prisma/client';

@Controller('web/tablets')
export class TabletWebController extends TabletController {
  constructor(tabletService: TabletService, private readonly adminService: AdminService) {
    super(tabletService);
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  public async getAllTablets(@Query('page') page = 1, @Query('limit') limit = 10, @GetUser() user: UserRes, @Query('search') search: string) {
    let branchId: any;
    if (user.role === Role.ADMIN || user.role === Role.DOCTOR || user.role === Role.NURSE) {
      branchId = await this.adminService.getBranchId(user.id);
    }
    const targetId =
      user.role === Role.SUPERADMIN ? user.organization_id : branchId.id;
    console.log('targetId', targetId);
    return this.getTabletService().getAllTablets(
      targetId,
      user.role,
      search,
      +page,
      +limit
    );
  }

  // get single tablet
  @HttpCode(HttpStatus.OK)
  @Get('/:tabletId')
  public async getSingleTablet(
    @GetUser() user: UserRes,
    @Param('tabletId') tabletId: string,
  ): Promise<Tablet> {
    return this.getTabletService().getSingleTablet(
      tabletId,
      user.id,
      user.organization_id,
      user.role,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get('/patients/:id') // :id -> patient -> user_id
  public async getAllTabletsPerPatient(
    @GetUser() user: UserRes,
    @Param('id') id: string,
  ): Promise<Tablet[]> {
    return this.getTabletService().getAllTabletsForPatient(
      id,
      user.id,
      user.organization_id,
      user.role,
    );
  }

  @HttpCode(HttpStatus.CREATED)
  @Post()
  public async createTablet(
    @GetUser() user: UserRes,
    @Body() data: TabletDTO,
  ) {

    const branchId = await this.adminService.getBranchId(user.id);
    console.log(branchId.id);
    return this.getTabletService().createTablet(
      user.id,
      user.organization_id,
      data,
      branchId.id,
    );
  }
  @HttpCode(HttpStatus.CREATED)
  @Post('/accessories-superadmin')
  public async createSuperAdminTablet(
    @GetUser() user: UserRes,
    @Body() data: AccessoriesDTO,
  ) {
    return this.getTabletService().createSuperAdminTablet(
      user.id,
      user.organization_id,
      data,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Patch('/:tabletId') // :tabletId -> tablet -> id
  public async updateTablet(
    @GetUser() user: UserRes,
    @Param('tabletId') tabletId: string,
    @Body() data: TabletDTO,
  ): Promise<Tablet> {
    return this.getTabletService().updateTablet(
      tabletId,
      user.organization_id,
      data,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('/manage')
  public async manageTablet(
    @GetUser() user: UserRes,
    @Body() data: ManageTabletDTO,
  ): Promise<any> {
    return this.getTabletService().manageTablet(
      user.id,
      user.organization_id,
      user.role,
      data,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Delete('/:tabletId')
  public async deleteTablet(
    @GetUser() user: UserRes,
    @Param('tabletId') tabletId: string,
  ): Promise<any> {
    return await this.getTabletService().deleteTablet(
      user.id,
      user.organization_id,
      user.role,
      tabletId,
    );
  }
}
