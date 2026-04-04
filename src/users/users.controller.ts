import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AppError } from '../errors';
import { AuthService } from 'src/auth/auth.service';
import { ResetPasswordDTO } from 'src/auth/dto';
import { MeasurementService } from 'src/measurements/measurement.service';
import { GetUser } from 'src/auth/decorators';
import { UserRes } from '@types';
import { MultiValueMeasurementDTO, SingleValueMeasurementDTO } from 'src/measurements/dto';
import { JwtGuard, RolesGuard } from 'src/auth/guards';
import { RequirePermission } from 'src/auth/decorators/role.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { AdminService } from 'src/admin/admin.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly measurementService: MeasurementService,
    private readonly adminService: AdminService
  ) { }

  @UseGuards(JwtGuard)
  @Get()
  async findAll(@Query('role') role: string, @Query('search') search = "", @GetUser() user: UserRes,) {

    if (!role) throw new AppError('role in query parameter is required', 400);
    const branch = await this.adminService.getBranchId(user.id);
    return this.usersService.findAll(role, search, branch.id);
  }

  @UseGuards(JwtGuard)
  @Get('fetch')
  findAllUsers(@Query('search') search = "", @GetUser() user: UserRes) {
    return this.usersService.findAllUsers(user.role, search);
  }

  @Get('profile/:id')
  public async getProfile(@Param('id') id: string) {
    return this.usersService.getProfile(id);
  }

  @Get('check-username/:username')
  public async checkUsername(@Param('username') username: string) {
    if (!username) throw new AppError('Username is required', 400);
    return this.usersService.checkUsername(username);
  }

  @Post('reset-password')
  public async resetPassword(@Body() dto: { otp: string; email: string; password: string }) {
    if (!dto.otp || !dto.email || !dto.password) throw new AppError('OTP, email, and password are required', 400);
    if (dto.password.length < 8) throw new AppError('Password must be at least 8 characters long', 400);
    if (!dto.email.includes('@') || !dto.email.includes('.')) throw new AppError('Email must be a valid email address', 400);

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

  @UseGuards(JwtGuard, RolesGuard)
  @RequirePermission(Role.DOCTOR, Role.NURSE, Role.PATIENT)
  @Post('/multi-value-measurement/:patientId')
  public async createMultiValueMeasurement(@GetUser() user: UserRes, @Param('patientId') patientId: string, @Body() data: MultiValueMeasurementDTO) {
    return this.measurementService.addMultiValueMeasurement(
      patientId,
      user.id,
      user.role,
      data,
    );
  }

}