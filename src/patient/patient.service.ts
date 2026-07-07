import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as argon from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';
import { PatientMedicationAlertDTO, UpdateProfileDTO } from './dto';
import { AddPatientDTO } from 'src/organization/dto/addPatient.dto';
import puppeteer from 'puppeteer';
import type { MedicationTaken } from '@prisma/client';
import type { AssignedCareTeam, ProfileProps } from './types';
import { SendgridService } from 'src/sendGrid/sendgrid.service';
import { SendMailPayload } from '@types';
import { SENDGRID_TEMPLATES } from 'src/constant';
import { VivalinkSyncStatus } from '@prisma/client';
import { AddPatientResult, VivalinkSyncResult, TriggerVivalinkSyncResult } from './types';
import { VivalinkWebPortalTokenService } from 'src/vivalink/vivalink-webportal-token.service';

export interface VivalinkPatientAddDTO {
  firstName: string
  lastName: string
  internalId: string
  birthDate: string
  timeZoneName: string
  monitoringProtocol: string
  site: string
  physician: string | null
  gender: 'Male' | 'Female' | 'Other'
  height: number
  weight: number
  isOpenPrescribingPhysician?: boolean
  isRTRPMPatient: boolean
  codes?: string[]
  isRpm?: boolean
}

@Injectable()
export class PatientService {
  constructor(private prisma: PrismaService, private mail: SendgridService, private vlTokenService: VivalinkWebPortalTokenService
  ) { }

  private readonly logger = new Logger(PatientService.name);

  private get vlWebportalUrl(): string {
    return this.vlTokenService.getBaseUrl();
  }

  private get vlWebportalToken(): string {
    return this.vlTokenService.getToken();
  }

  public async addPatient(
    data: AddPatientDTO,
    organization_id: string,
    location_id: string,
  ): Promise<AddPatientResult> {

    try {

      const res = await this.prisma.user.create({
        data: {
          first_name: data.first_name,
          middle_name: data.middle_name,
          last_name: data.last_name,
          phone_number: data.phone_number,
          email: data.email,
          password: await this.encryptPassword(data.password),
          username: data.username,
          dob: data.dob,
          organization_id,
          gender: data.gender,
          title: data.title,
          role: 'PATIENT',
          location_id,
          // fcmToken: data.fcmToken,
          associated_branches: {
            connect: {
              id: data.branch_id,
            },
          },
        },
      });



      const patient = await this.prisma.patient.create({
        data: {
          height: data.height,
          weight: data.weight,
          user_id: res.id,
          site_id: data.site_id,
        },
        select: {
          id: true,
          height: true,
          weight: true,
          user: true,
        },
      });

      if (data.doctor_id) {
        await this.prisma.patient.update({
          where: {
            id: patient.id,
          },
          data: {
            doctors: {
              connect: {
                user_id: data.doctor_id,
              },
            },
          },
        });
      }

      if (data.nurse_id) {
        await this.prisma.patient.update({
          where: {
            id: patient.id,
          },
          data: {
            nurses: {
              connect: {
                user_id: data.nurse_id,
              },
            },
          },
        });
      }

      // const mailPayload = {
      //   to: [patient.user.email],
      //   data: {
      //     subject: 'Welcome to AViCA',
      //     patientName: patient.user.username,
      //     patientEmail: patient.user.email,
      //     patientPassword: data.password,
      //   },
      //   templateId: SENDGRID_TEMPLATES.PATIENT_REGISTRATION,
      // } satisfies SendMailPayload;

      // await this.mail.sendSgMail(mailPayload);
      let vivalinkResult: VivalinkSyncResult = {
        attempted: false,
        success: false,
      };

      // Handle Vivalink Sync Logic
      const cardiacMonitoring = data.cardiac_monitoring || VivalinkSyncStatus.NO;

      // Update patient with initial cardiac monitoring status
      await this.prisma.patient.update({
        where: { id: patient.id },
        data: { cardiac_monitoring: cardiacMonitoring },
      });

      if (cardiacMonitoring === VivalinkSyncStatus.YES) {
        vivalinkResult = await this.syncPatientToVivalink(patient.id);

        if (!vivalinkResult.success) {
          const syncError =
            vivalinkResult.error || 'Failed to sync patient to Vivalink';

          await this.prisma.patient.update({
            where: { id: patient.id },
            data: {
              cardiac_monitoring: VivalinkSyncStatus.NO,
              vivalink_synced: false,
              vivalink_sync_error: syncError,
            },
          });

          return {
            success: false,
            patientId: patient.id,
            cardiacMonitoring: VivalinkSyncStatus.NO,
            vivalinkSync: {
              ...vivalinkResult,
              error: syncError,
            },
          };
        }
      }

      // Return detailed result
      return {
        success: true,
        patientId: patient.id,
        cardiacMonitoring: cardiacMonitoring,
        vivalinkSync: vivalinkResult,
      };
    }
    catch (error) {
      console.error('Error adding patient:', error);
      throw error;
    }
  }



  /**
   * Sync a patient to Vivalink portal
   * @param patientId AViCA Patient ID
   */
  async syncPatientToVivalink(patientId: string): Promise<VivalinkSyncResult> {
    try {
      const patientData = await this.prisma.patient.findUnique({
        where: { id: patientId },
        include: {
          user: true,
          site: true,
          doctors: {
            include: {
              user: true,
              site: true,
            },
          },
        },
      });

      if (!patientData) {
        return {
          attempted: true,
          success: false,
          error: 'Patient not found',
        };
      }

      const primaryDoctor = patientData.doctors && patientData.doctors.length > 0 ? patientData.doctors?.[0] : null;
      if (!primaryDoctor || !primaryDoctor.vivalinkId) {
        const errorMsg = 'Assigned Doctor does not exist on vivalink portal';
        await this.prisma.patient.update({
          where: { id: patientId },
          data: {
            cardiac_monitoring: VivalinkSyncStatus.NO,
            vivalink_synced: false,
            vivalink_sync_error: errorMsg,
          },
        });

        return {
          attempted: true,
          success: false,
          error: errorMsg,
        };
      }
      const vivalinkSiteId = patientData?.site?.vivalinkSiteId ?? null;
      const assignedPhysicianVivalinkId = primaryDoctor?.vivalinkId ?? null;

      const vivalinkPayload = {
        firstName: patientData.user.first_name,
        lastName: patientData.user.last_name,
        internalId: patientData.user.username,
        birthDate: patientData.user.dob ? new Date(patientData.user.dob).toISOString().split('T')[0] : null,
        timeZoneName: 'Asia/Karachi',
        gender: this.CapitalizeFirstLetter(patientData.user.gender || 'Other') as 'Male' | 'Female' | 'Other',
        height: patientData.height,
        weight: patientData.weight,
        site: vivalinkSiteId,
        monitoringProtocol: "6865f38fa347336ebcc57ecb",
        assignedPhysician: assignedPhysicianVivalinkId,
        physician: assignedPhysicianVivalinkId,
        reportForThirdParty: false,
        isRTRPMPatient: false,
      };

      console.log('Syncing patient to Vivalink with payload:', vivalinkPayload);

      const vivalinkResponse = await this.addPatientToVlWebportal(vivalinkPayload);

      console.log('Vivalink response:', vivalinkResponse);

      const patientVl = await this.getVivalinkPatientDetails(vivalinkPayload.internalId);

      const syncSuccess = vivalinkResponse && vivalinkResponse.code === 0;

      if (syncSuccess && patientVl) {
        await this.prisma.patient.update({
          where: { id: patientId },
          data: {
            vivalink_synced: true,
            vivalink_synced_at: new Date(),
            vivalink_sync_error: null,
            cardiac_monitoring: VivalinkSyncStatus.YES,
            vivalinkId: patientVl._id,
          },
        });

        return {
          attempted: true,
          success: true,
          syncedAt: new Date(),
        };
      } else {
        const errorMsg = 'Failed to add patient in Vivalink portal';
        await this.prisma.patient.update({
          where: { id: patientId },
          data: {
            cardiac_monitoring: VivalinkSyncStatus.NO,
            vivalink_synced: false,
            vivalink_sync_error: errorMsg,
          },
        });

        return {
          attempted: true,
          success: false,
          error: errorMsg,
        };
      }
    } catch (error) {
      console.error('Vivalink sync error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';

      await this.prisma.patient.update({
        where: { id: patientId },
        data: {
          cardiac_monitoring: VivalinkSyncStatus.NO,
          vivalink_synced: false,
          vivalink_sync_error: errorMessage,
        },
      });

      return {
        attempted: true,
        success: false,
        error: errorMessage,
      };
    }
  }

  async triggerVivalinkSync(patientId: string): Promise<TriggerVivalinkSyncResult> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: { cardiac_monitoring: true, vivalink_synced: true }
    });

    if (!patient) {
      return { success: false, error: 'Patient not found' };
    }

    const syncResult = await this.syncPatientToVivalink(patientId);

    return {
      success: syncResult.success,
      error: syncResult.error,
      syncedAt: syncResult.syncedAt
    };
  }


  public async profile(id: string): Promise<ProfileProps> {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
      // select: {
      //   first_name: true,
      //   middle_name: true,
      //   last_name: true,
      //   dob: true,
      //   uri: true,
      //   gender: true,
      //   title: true,
      //   email: true,
      //   phone_number: true,
      //   username: true,
      //   created_at: true,
      //   updated_at: true,
      //   patient: {
      //     select: {
      //       emr: true,
      //       weight: true,
      //       height: true,
      //     },
      //   },
      // },
      select: {
        id: true,
        first_name: true,
        middle_name: true,
        last_name: true,
        dob: true,
        uri: true,
        role: true,
        gender: true,
        title: true,
        email: true,
        phone_number: true,
        username: true,
        pincode: true,
        patient: {
          select: {
            emr: true,
            weight: true,
            height: true,
            site: {
              select: {
                id: true,
                name: true,
                description: true,
                address: true,
                countryCode: true,
              },
            },
          },
        },
        location: {
          include: {
            city: {
              include: {
                country: true,
              },
            },
          },
        },
        created_at: true,
        updated_at: true,
        active: true,
      },
    });
  }

  public async getAssignedCareTeam(userId: string): Promise<AssignedCareTeam> {
    const patient = await this.prisma.patient.findUnique({
      where: {
        user_id: userId,
      },
      select: {
        doctors: {
          take: 1,
          orderBy: {
            created_at: 'asc',
          },
          select: {
            user: {
              select: {
                id: true,
                first_name: true,
                middle_name: true,
                last_name: true,
                title: true,
                role: true,
                uri: true,
              },
            },
          },
        },
        nurses: {
          take: 1,
          orderBy: {
            created_at: 'asc',
          },
          select: {
            user: {
              select: {
                id: true,
                first_name: true,
                middle_name: true,
                last_name: true,
                title: true,
                role: true,
                uri: true,
              },
            },
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient profile not found');
    }

    const doctor = patient.doctors[0];
    const nurse = patient.nurses[0];

    return {
      primary_doctor: doctor?.user ?? null,
      primary_nurse: nurse?.user ?? null,
    };
  }

  public async updateProfle(userId: string, data: UpdateProfileDTO) {
    return await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        first_name: data.first_name,
        middle_name: data.middle_name,
        last_name: data.last_name,
        uri: data.uri,
        phone_number: data.phone_number,
        gender: data.gender,
        title: data.title,
        patient: {
          update: {
            weight: Number(data?.weight) ?? null,
            height: Number(data?.height) ?? null,
          },
        },
      },
    });
  }

  public async getAllPatientMedicationAlertsForToday(userId: string, page: number, limit: number) {
    console.log('Fetching medication alerts for user:', userId, 'Page:', page, 'Limit:', limit);
    const skip = (page - 1) * limit;
    const take = limit;
    // const now = new Date();
    // const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // const endOfDay = new Date(startOfDay);
    // endOfDay.setDate(endOfDay.getDate() + 1);

    // console.log('Local startOfDay:', startOfDay);
    // console.log('Local endOfDay:', endOfDay);

    // const [data, totalItems] = await this.prisma.$transaction([
    //   this.prisma.medication.findMany({
    //     skip,
    //     take,
    //     where: {
    //       patient: { user_id: userId },
    //       end_date: { gte: startOfDay },
    //       patient_medication_alerts: {
    //         some: {
    //           alert_time: {
    //             gte: startOfDay,
    //             lt: endOfDay,
    //           },
    //         },
    //       },
    //     },
    //     select: {
    //       id: true,
    //       name: true,
    //       patient_medication_alerts: {
    //         where: {
    //           alert_time: {
    //             gte: startOfDay,
    //             lt: endOfDay,
    //           },
    //         },
    //       },
    //     },
    //   }),
    //   this.prisma.medication.count({
    //     where: {
    //       patient: { user_id: userId },
    //       end_date: { gte: startOfDay },
    //       patient_medication_alerts: {
    //         some: {
    //           alert_time: {
    //             gte: startOfDay,
    //             lt: endOfDay,
    //           },
    //         },
    //       },
    //     },
    //   }),
    // ]);
    const date = new Date();
    const today = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const [data, totalItems] = await this.prisma.$transaction([
      this.prisma.medication.findMany({
        skip,
        take,
        where: {
          patient: { user_id: userId },
          end_date: { gte: today },
          patient_medication_alerts: {
            some: {
              alert_time: { gte: today, lte: tomorrow },
            },
          },
        },
        select: {
          id: true,
          name: true,
          start_date: true,
          end_date: true,
          time: true,
          dosage: true,
          frequency: true,
          unit: true,
          created_at: true,
          updated_at: true,
          patient_medication_alerts: {
            where: {
              alert_time: {
                gte: today,
                lte: tomorrow,
              },
            },
            select: {
              id: true,
              alert_time: true,
              taken: true,
            },
          },
        },
      }),
      this.prisma.medication.count({
        where: {
          patient: { user_id: userId },
          end_date: { gte: today },
          patient_medication_alerts: {
            some: {
              alert_time: {
                gte: today,
                lte: tomorrow,
              },
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      data,
      pagination: {
        totalItems,
        perPage: limit,
        currentPage: page,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
      },
    };
  }

  public async updatePatientMedicationAlertTakenStatus(
    patientMedicationId: string,
    patientId: string,
    data: PatientMedicationAlertDTO,
  ) {
    return await this.prisma.patientMedicationAlerts.update({
      data: {
        taken: data.taken as MedicationTaken,
      },
      where: {
        medication: {
          patient: {
            user_id: patientId,
          },
        },
        id: patientMedicationId,
      },
      select: {
        id: true,
        medication: {
          select: {
            id: true,
          },
        },
      },
    });
  }

  private async encryptPassword(value): Promise<string> {
    return await argon.hash(value);
  }

  public async fetchContacts(userId: string) {
    return await this.prisma.contacts.findMany({
      where: {
        user_id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        number: true,
        relationship: true,
        created_at: true,
      },
    });
  }
  public async fetchAssignedDoctors(userId: string, id: string) {
    const pt = await this.prisma.patient.findUniqueOrThrow({
      where: {
        user_id: id,
      },
    });
    if (!pt) {
      throw new Error('Patient not found');
    }
    const patient: any = await this.prisma.patient.findMany({
      where: {
        id: pt.id,
      },
      select: {
        doctors: {
          select: {
            id: true,


          }
        }
      }
    })
    if (!patient || patient.length === 0 || !patient[0].doctors || patient[0].doctors.length === 0) {
      throw new Error('No assigned doctors found for this patient');
    }
    const doctor_id = patient[0].doctors[0].id;
    return await this.prisma.doctor.findUniqueOrThrow({
      where: {
        id: doctor_id,

      },
      select: {
        user_id: true,

      },
    });

  }

  public async fetchAllAssignedDoctors(id: string) {
    const patient = await this.prisma.patient.findUniqueOrThrow({
      where: { user_id: id },
      select: {
        id: true,
        doctors: {
          select: {
            id: true,
            user_id: true,
            vivalinkId: true,
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                uri: true,
              },
            },
          },
        },
      },
    });

    if (!patient || !patient.doctors || patient.doctors.length === 0) {
      throw new Error('No assigned doctors found for this patient');
    }

    return patient.doctors;
  }

  public async addPatientToVlWebportal(data: VivalinkPatientAddDTO) {
    const url = `${this.vlWebportalUrl}/patients`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.vlWebportalToken}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result;
  }

  public async getVivalinkPatientDetails(internalId: string) {
    // https://webportal.vivalink.com/api/backend/patients?$skip=0&$limit=10&queryValue=hk-patient-dev-01&isManage=true
    const url = `${this.vlWebportalUrl}/patients?$skip=0&$limit=10&queryValue=${internalId}&isManage=true`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.vlWebportalToken}`,
      },
    });

    const result = await response.json();

    const patient = result.data.find((p: any) => p.internalId === internalId);
    return patient;
  }

  private CapitalizeFirstLetter(str: string): string {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
}
