import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AppError } from '../errors';
import { AuthService } from 'src/auth/auth.service';
import { ResetPasswordDTO } from 'src/auth/dto';
import { MeasurementService } from 'src/measurements/measurement.service';
import { GetUser } from 'src/auth/decorators';
import { UserRes } from '@types';
import { SingleValueMeasurementDTO } from 'src/measurements/dto';
import { JwtGuard, RolesGuard } from 'src/auth/guards';
import { RequirePermission } from 'src/auth/decorators/role.decorator';
import { Role } from 'src/auth/enums/role.enum';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly measurementService: MeasurementService
  ) { }

  @Get()
  findAll(@Query('role') role: string, @Query('search') search = "") {
    if (!role) throw new AppError('role in query parameter is required', 400);

    return this.usersService.findAll(role, search);
  }

  @Get('profile/:id')
  public async getProfile(@Param('id') id: string) {
    return this.usersService.getProfile(id);
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  public async resetPassword(@Body() dto: ResetPasswordDTO) {
    return this.authService.resetPassword(dto);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @RequirePermission(Role.DOCTOR, Role.NURSE, Role.PATIENT)
  @Post('/single-value-measurement/:patientId')
  public async createMeasurement(@GetUser() user: UserRes, @Param('patientId') patientId: string, @Body() data: SingleValueMeasurementDTO) {
    return this.measurementService.addSingleValueMeasurement(
      patientId,
      user.id,
      user.role,
      data,
    );
  }

}