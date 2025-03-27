import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';

import { AllExceptionsFilter } from './filters';

// Auth
import { AuthModule } from './auth/auth.module';

// Prisma
import { PrismaModule } from './prisma/prisma.module';

import { DoctorModule } from './doctor/doctor.module';
import { NurseModule } from './nurse/nurse.module';
import { PatientModule } from './patient/patient.module';
import { AdminModule } from './admin/admin.module';
import { SuperadminModule } from './superadmin/superadmin.module';
import { MasterModule } from './master/master.module';

import { HelpersModule } from './helpers/helpers.module';

import { EducationModule } from './education/education.module';
import { ArticleModule } from './article/article.module';

import { TelemedModule } from './telemed/telemed.module';

import { OrganizationModule } from './organization/organization.module';
import { BranchModule } from './branch/branch.module';
import { DepartmentsModule } from './departments/departments.module';

import { LocationModule } from './location/location.module';

import { UploaderModule } from './uploader/uploader.module';

import { VivalinkModule } from './vivalink/vivalink.module';

import { SocketGateway } from './socket/socket.gateway';
import { SocketModule } from './socket/socket.module';
import { ChatModule } from './chat/chat.module';

import { MessageModule } from './message/message.module';
import { EmailsModule } from './emails/emails.module';

import { ElectronicmedicalreportModule } from './electronicmedicalreport/electronicmedicalreport.module';

import { LogsModule } from './logs/logs.module';
import { LogsMiddleware } from './middlewares/logs.middleware';
import { LoggerMiddleware } from './middlewares/logger.middleware';

import { NotificationsModule } from './notifications/notifications.module';

import { MeasurementModule } from './measurements/measurement.module';
import { ReadingRangeModule } from './measurementReadingRange/readingRange.module';
import { RagModule } from './rag/rag.module';

import { MedicationModule } from './medications/medication.module';
import { ComplianceModule } from './compliance/compliance.module';

import { DeviceModule } from './devices/device.module';
import { VideosModule } from './videos/videos.module';

import { TabletModule } from './tablets/tablet.module';

import { SupportModule } from './technicalSupport/support.module';

import { SendgridModule } from './sendGrid/sendgrid.module';

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    SocketGateway,
  ],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    PrismaModule,
    DoctorModule,
    NurseModule,
    PatientModule,
    AdminModule,
    SuperadminModule,
    MasterModule,
    HelpersModule,
    EducationModule,
    ArticleModule,
    TelemedModule,
    OrganizationModule,
    BranchModule,
    DepartmentsModule,
    LocationModule,
    UploaderModule,
    VivalinkModule,
    SocketModule,
    ChatModule,
    MessageModule,
    EmailsModule,
    ElectronicmedicalreportModule,
    LogsModule,
    NotificationsModule,
    MeasurementModule,
    ReadingRangeModule, // Patient Alert
    RagModule,
    MedicationModule,
    ComplianceModule,
    DeviceModule,

    // For Measurement and Medication
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 10,
      ignoreErrors: false,
    }),
    // For VL
    ScheduleModule.forRoot(),
    VideosModule,
    TabletModule,
    SupportModule,

    SendgridModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware, LogsMiddleware).forRoutes('*');
  }
}
