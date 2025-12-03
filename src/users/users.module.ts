import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from 'src/auth/auth.module';
import { MeasurementModule } from 'src/measurements/measurement.module';
import { AdminService } from 'src/admin/admin.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, AdminService],
  imports: [AuthModule, MeasurementModule],
})
export class UsersModule { }
