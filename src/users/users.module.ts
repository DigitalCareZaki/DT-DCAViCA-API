import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from 'src/auth/auth.module';
import { MeasurementModule } from 'src/measurements/measurement.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [AuthModule, MeasurementModule],
})
export class UsersModule {}
