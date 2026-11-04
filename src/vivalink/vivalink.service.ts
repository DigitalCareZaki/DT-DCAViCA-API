import { HttpStatus, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AppError } from 'src/errors';
import { PrismaService } from 'src/prisma/prisma.service';
import type { VLAllPatients } from './types';
import { Role } from 'src/auth/enums/role.enum';
import { UserRes } from '@types';

import { UsersService } from 'src/users/users.service';

@Injectable()
export class VivalinkService {
  constructor(private prisma: PrismaService, private usersService: UsersService) {
    this.loadVlToken();
  }

  private vlCredentails = {
    baseUrl: process.env.VL_BASE_URL ?? 'https://vcloud2.vivalink.com',
    tenantId: process.env.VL_TENANT_ID,
    apiKey: process.env.VL_PROCESS_KEY,
    token: '',
  };

  loadVlToken() {
    (async () => {
      await this.cronFetchToken();
    })();
  }

  // private readToken(): string {
  //   const tokenData = JSON.parse(readFileSync('vlToken.json', 'utf-8'));

  //   return tokenData?.token ?? '';
  // }

  // private updateToken(newToken: string): void {
  //   const tokenData = { token: newToken };

  //   writeFileSync('vlToken.json', JSON.stringify(tokenData, null, 2));
  //   this.vlCredentails.token = newToken;
  // }

  // Cron to fetch token from the API
  // Runs every day at 00:00 UTC - Token expiry time is 72 hours
  @Cron('0 0 * * *', {
    name: 'fetchToken',
    timeZone: 'UTC',
  })
  handleCron() {
    (async () => {
      await this.cronFetchToken();
    })();
  }

  private async cronFetchToken() {
    try {
      const res = await fetch(this.vlCredentails.baseUrl + '/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: this.vlCredentails.tenantId,
          key: this.vlCredentails.apiKey,
        }),
      });

      const result = await res.json();
      this.vlCredentails.token = result?.data?.token;
      return result?.data?.token;
    } catch (err) {
      console.log('cronFetchToken -> Error fetching token', err);
    }
  }



  // this method is used for only sync device by qaiser
  // public async getPatients(user: UserRes): Promise<VLAllPatients> {
  //   try {
  //     const request = new Request(
  //       this.vlCredentails.baseUrl + `/tenants/${this.vlCredentails.tenantId}`,
  //       {
  //         headers: {
  //           Authorization: this.vlCredentails.token,
  //           Accept: '*/*',
  //           'Content-Type': 'application/json',
  //         },
  //       },
  //     );

  //     const res = await fetch(request);
  //     console.log('getPatients from VL -> result >>>>>>>> ', res);

  //     if (res.status !== 200) {
  //       throw new AppError('API Error', HttpStatus.SERVICE_UNAVAILABLE);
  //     }

  //     const result = await res.json();

  //     console.log('getPatients from VL -> result >>>>>>>> ', result);

  //     // VL sends a response of 200 even on bad response
  //     // Need to check inside result for code
  //     if (result?.code !== 200) {
  //       throw new AppError('API Error', HttpStatus.SERVICE_UNAVAILABLE);
  //     }
  //     // 1. Extract emails from result keys

  //     const doctor = await this.prisma.doctor.findUnique({
  //       where: {
  //         user_id: user.id,
  //       },
  //       select: {
  //         id: true,
  //       },
  //     });
  //     console.log('doctor >>>>>>>> ', doctor);

  //     if (!doctor) {
  //       throw new AppError('Doctor not found for this user', HttpStatus.BAD_REQUEST);
  //     }

  //     console.log('user >>>>>>>> ', user);
  //     const emailList = Object.keys(result?.data?.mappings ?? {});
  //     console.log('emailList >>>>>>>> ', emailList);
  //     const patients = await this.prisma.user.findMany({
  //       where: {
  //         role: Role.PATIENT,
  //         username: {
  //           in: emailList,
  //         },
  //         patient: {
  //           doctors: {
  //             some: {
  //               id: doctor.id, // Make sure to pass loggedInDoctorId as a parameter to getPatients()
  //             },
  //           },
  //         },
  //       },
  //       select: {
  //         id: true,
  //         first_name: true,
  //         username: true,
  //         patient: {
  //           select: {
  //             id: true,
  //             user_id: true,
  //             doctors: {
  //               select: {
  //                 id: true,
  //               },
  //             },
  //           },
  //         },
  //       },
  //     });
  //     console.log('patients >>>>>>>> ', patients);

  //     // 3. Attach matching result data to each patient
  //     const patientsWithData = patients.map(patient => ({
  //       ...patient,
  //       mappings: result.data.mappings[patient.username] ?? [], // gets the array from result
  //     }));

  //     const formatted = patientsWithData.reduce((acc, patient) => {
  //       acc[patient.username] = patient.mappings;
  //       return acc;
  //     }, {});
  //     console.log(formatted, '=====>>patientsWithData');
  //     const usernames = Object.keys(formatted);

  //     const users = await this.prisma.user.findMany({
  //       where: {
  //         role: Role.PATIENT,
  //         username: {
  //           in: usernames,
  //         },
  //       },
  //       select: {
  //         username: true,
  //         patient: {
  //           select: {
  //             devices: {
  //               select: {
  //                 device: {
  //                   select: {
  //                     serial_number: true,
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //         },
  //       },
  //     });

  //     const dt = {};

  //     users.forEach((user) => {

  //       // Assigned device serial numbers from DB
  //       const assignedDevices =
  //         user.patient?.devices.map(
  //           (d) => d.device.serial_number
  //         ) || [];

  //       // Devices from vl object
  //       const vlDevices = formatted[user.username] || [];

  //       // Match devices
  //       const matchedDevices = vlDevices.filter(
  //         (device) => assignedDevices.includes(device)
  //       );

  //       // Dynamic object key
  //       dt[user.username] = matchedDevices;
  //     });

  //     return dt ?? {};


  //   } catch (err) {
  //     console.error('getPatients -> Error fetching patients', err);
  //     throw err; // ⬅️ IMPORTANT
  //   }
  // }
  public async getPatients(user: UserRes): Promise<VLAllPatients> {
    try {
      const request = new Request(
        this.vlCredentails.baseUrl + `/tenants/${this.vlCredentails.tenantId}`,
        {
          headers: {
            Authorization: this.vlCredentails.token,
            Accept: '*/*',
            'Content-Type': 'application/json',
          },
        },
      );

      const res = await fetch(request);
      console.log('getPatients from VL -> result >>>>>>>> ', res);

      if (res.status !== 200) {
        throw new AppError('API Error', HttpStatus.SERVICE_UNAVAILABLE);
      }

      const result = await res.json();

      console.log('getPatients from VL -> result >>>>>>>> ', result);

      // VL sends a response of 200 even on bad response
      // Need to check inside result for code
      if (result?.code !== 200) {
        throw new AppError('API Error', HttpStatus.SERVICE_UNAVAILABLE);
      }
      // 1. Extract emails from result keys

      const doctor = await this.prisma.doctor.findUnique({
        where: {
          user_id: user.id,
        },
        select: {
          id: true,
        },
      });
      console.log('doctor >>>>>>>> ', doctor);

      if (!doctor) {
        throw new AppError('Doctor not found for this user', HttpStatus.BAD_REQUEST);
      }

      console.log('user >>>>>>>> ', user);
      const emailList = Object.keys(result?.data?.mappings ?? {});
      console.log('emailList >>>>>>>> ', emailList);
      const patients = await this.prisma.user.findMany({
        where: {
          role: Role.PATIENT,
          username: {
            in: emailList,
          },
          patient: {
            doctors: {
              some: {
                id: doctor.id, // Make sure to pass loggedInDoctorId as a parameter to getPatients()
              },
            },
          },
        },
        select: {
          id: true,
          first_name: true,
          username: true,
          patient: {
            select: {
              id: true,
              user_id: true,
              doctors: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      });
      console.log('patients >>>>>>>> ', patients);

      // 3. Attach matching result data to each patient
      const patientsWithData = patients.map(patient => ({
        ...patient,
        mappings: result.data.mappings[patient.username] ?? [], // gets the array from result
      }));

      const formatted = patientsWithData.reduce((acc, patient) => {
        acc[patient.username] = patient.mappings;
        return acc;
      }, {});
      console.log(formatted, '=====>>patientsWithData');

      return formatted ?? {};
    } catch (err) {
      console.error('getPatients -> Error fetching patients', err);
      throw err; // ⬅️ IMPORTANT
    }
  }

  public async getVlPatients(doctorId: string): Promise<VLAllPatients> {
    try {
      const request = new Request(
        this.vlCredentails.baseUrl + `/tenants/${this.vlCredentails.tenantId}`,
        {
          headers: {
            Authorization: this.vlCredentails.token,
            Accept: '*/*',
            'Content-Type': 'application/json',
          },
        },
      );

      const res = await fetch(request);
      console.log('getPatients from VL -> result >>>>>>>> ', res);

      if (res.status !== 200) {
        throw new AppError('API Error', HttpStatus.SERVICE_UNAVAILABLE);
      }

      const result = await res.json();

      console.log('getPatients from VL -> result >>>>>>>> ', result);

      // VL sends a response of 200 even on bad response
      // Need to check inside result for code
      if (result?.code !== 200) {
        throw new AppError('API Error', HttpStatus.SERVICE_UNAVAILABLE);
      }
      // 1. Extract emails from result keys

      const doctor = await this.prisma.doctor.findUnique({
        where: {
          user_id: doctorId,
        },
        select: {
          id: true,
        },
      });
      console.log('doctor >>>>>>>> ', doctor);

      if (!doctor) {
        throw new AppError('Doctor not found for this user', HttpStatus.BAD_REQUEST);
      }


      const emailList = Object.keys(result?.data?.mappings ?? {});
      console.log('emailList >>>>>>>> ', emailList);
      const patients = await this.prisma.user.findMany({
        where: {
          role: Role.PATIENT,
          username: {
            in: emailList,
          },
          patient: {
            doctors: {
              some: {
                id: doctor.id, // Make sure to pass loggedInDoctorId as a parameter to getPatients()
              },
            },
          },
        },
        select: {
          id: true,
          first_name: true,
          username: true,
          patient: {
            select: {
              id: true,
              user_id: true,
              doctors: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      });
      console.log('patients >>>>>>>> ', patients);

      // 3. Attach matching result data to each patient
      const patientsWithData = patients.map(patient => ({
        ...patient,
        mappings: result.data.mappings[patient.username] ?? [], // gets the array from result
      }));

      const formatted = patientsWithData.reduce((acc, patient) => {
        acc[patient.username] = patient.mappings;
        return acc;
      }, {});
      console.log(formatted, '=====>>patientsWithData');

      return formatted ?? {};
    } catch (err) {
      console.error('getPatients -> Error fetching patients', err);
      throw err; // ⬅️ IMPORTANT
    }
  }
  public async getAppPatients(): Promise<VLAllPatients> {
    const request = new Request(
      this.vlCredentails.baseUrl + `/tenants/${this.vlCredentails.tenantId}`,
      {
        headers: {
          Authorization: this.vlCredentails.token,
          Accept: '*/*',
          'Content-Type': 'application/json',
        },
      },
    );

    const res = await fetch(request);

    if (res.status !== 200) {
      throw new AppError('API Error', HttpStatus.SERVICE_UNAVAILABLE);
    }

    const result = await res.json();

    console.log('getPatients from VL -> result >>>>>>>> ', result);

    // VL sends a response of 200 even on bad response
    // Need to check inside result for code
    if (result?.code !== 200) {
      throw new AppError('API Error', HttpStatus.SERVICE_UNAVAILABLE);
    }
    const responseData = {
      data: Object.entries(result?.data?.mappings).flatMap(([name, records]) =>
        (records as any[]).map((record) => ({
          name,
          Record: record.replace(/\//g, '%2F'),
        })),
      ),
    };
    console.log(responseData, '>>>> app patiens>>>>');
    return responseData;
    // return result?.data?.mappings ?? {};
  }



  public async getPatientDataBySubjectId(subId: string, duration: string) {
    console.log('duration >>>>>>>> ')
    console.log('subjectId >>>>>>>> ', subId);

    const durationInMinutes = parseInt(duration.split(' ')[0]);
    const durationInMs = durationInMinutes * 60 * 1000 - 1000; // 1000 ms is subtracted to avoid fetching data from the next minute

    const mainRes = await fetch(
      this.vlCredentails.baseUrl +
      `/tenants/${this.vlCredentails.tenantId}/data?subjectId=${subId}&type=EcgRaw&topOne=true&order=descending`,
      {
        headers: {
          Authorization: this.vlCredentails.token
          // 'Access-Control-Allow-Origin': '*',
        },
      },
    );

    if (mainRes.status !== 200) {
      throw new AppError('API Error', HttpStatus.SERVICE_UNAVAILABLE);
    }
    const mainResult = await mainRes.json();
    console.log('mainResult >>>>>>>> ', mainResult);
    const res = await fetch(
      this.vlCredentails.baseUrl +
      `/tenants/${this.vlCredentails.tenantId}/data?subjectId=${subId}&type=EcgRaw&startTime=${mainResult.data.start - durationInMs}&endTime=${mainResult.data.start}&denoise=true`,
      {
        headers: {
          Authorization: this.vlCredentails.token,
          'Access-Control-Allow-Origin': '*',
        },
      },
    );

    console.log('res >>>>>>>> ', res);
    if (res.status !== 200) {
      throw new AppError('API Error', HttpStatus.SERVICE_UNAVAILABLE);
    }
    const result = await res.json();

    console.log('result >>>>>>>> ', result);

    // old code
    const ecgData = result?.data?.list.map((v) => v.vitals.ecg);

    const magnification = result?.data?.list[0]?.vitals?.magnification || 1000;
    const samplingFrequency = result?.data?.list[0]?.vitals?.sf || 128;
    const timePerPoint = 1000 / samplingFrequency; // 7.8125 ms
    // For a 1-second recording with 128 points, the time values would be:
    // Point 0: 0 * 7.8125 = 0 ms
    // Point 1: 1 * 7.8125 = 7.8125 ms
    // Point 2: 2 * 7.8125 = 15.625 ms
    // ...
    // Point 127: 127 * 7.8125 = 992.1875 ms
    const processedEcg = ecgData.map((value, index) => {
      return value.map((v2, i2) => ({
        time: (i2 * timePerPoint) / 1000 + index,
        mv: v2 / magnification,
      }));
    });

    return {
      ecg: processedEcg,
      samplingFrequency,
      timePerPoint,
      otherAttributes: result?.data?.list[0]
    };
  }

  // public async getPatientData(patchSn: string, duration: string) {
  //   console.log('duration >>>>>>>> ', duration);
  //   console.log('patchSn >>>>>>>> ', patchSn);
  //   const durationInMinutes = parseInt(duration.split(' ')[0]);
  //   const durationInMs = durationInMinutes * 60 * 1000 - 1000; // 1000 ms is subtracted to avoid fetching data from the next minute

  //   const mainRes = await fetch(
  //     this.vlCredentails.baseUrl +
  //     `/tenants/${this.vlCredentails.tenantId}/data?patchSn=${patchSn}&topOne=true&order=descending`,
  //     {
  //       headers: {
  //         Authorization: this.vlCredentails.token,
  //         'Access-Control-Allow-Origin': '*',
  //       },
  //     },
  //   );


  //   if (mainRes.status !== 200) {
  //     throw new AppError('API Error', HttpStatus.SERVICE_UNAVAILABLE);
  //   }
  //   const mainResult = await mainRes.json();
  //   console.log('mainResult >>>>>>>> ', mainResult);
  //   const res = await fetch(
  //     this.vlCredentails.baseUrl +
  //     `/tenants/${this.vlCredentails.tenantId}/data?patchSn=${patchSn}&startTime=${mainResult.data.start - durationInMs}&endTime=${mainResult.data.start}&denoise=true`,
  //     {
  //       headers: {
  //         Authorization: this.vlCredentails.token,
  //         'Access-Control-Allow-Origin': '*',
  //       },
  //     },
  //   );
  //   console.log('res >>>>>>>> ', res);
  //   if (res.status !== 200) {
  //     throw new AppError('API Error', HttpStatus.SERVICE_UNAVAILABLE);
  //   }
  //   const result = await res.json();

  //   console.log('result >>>>>>>> ', result);

  //   // old code
  //   const ecgData = result?.data?.list.map((v) => v.vitals.ecg);

  //   const magnification = result?.data?.list[0]?.vitals?.magnification || 1000;
  //   const samplingFrequency = result?.data?.list[0]?.vitals?.sf || 128;
  //   const timePerPoint = 1000 / samplingFrequency; // 7.8125 ms
  //   // For a 1-second recording with 128 points, the time values would be:
  //   // Point 0: 0 * 7.8125 = 0 ms
  //   // Point 1: 1 * 7.8125 = 7.8125 ms
  //   // Point 2: 2 * 7.8125 = 15.625 ms
  //   // ...
  //   // Point 127: 127 * 7.8125 = 992.1875 ms
  //   const processedEcg = ecgData.map((value, index) => {
  //     return value.map((v2, i2) => ({
  //       time: (i2 * timePerPoint) / 1000 + index,
  //       mv: v2 / magnification,
  //     }));
  //   });

  //   return {
  //     ecg: processedEcg,
  //     samplingFrequency,
  //     timePerPoint,
  //     otherAttributes: result?.data?.list[0]
  //   };
  // }
}


