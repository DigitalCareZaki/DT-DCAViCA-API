import { Injectable } from '@nestjs/common';

import * as argon from 'argon2';

import { PrismaService } from 'src/prisma/prisma.service';

import { PatientMedicationAlertDTO } from './dto';
import { AddPatientDTO } from 'src/organization/dto/addPatient.dto';
import puppeteer from 'puppeteer';

import type { MedicationTaken } from '@prisma/client';
import type { ProfileProps } from './types';
import { SendgridService } from 'src/sendGrid/sendgrid.service';
import { SendMailPayload } from '@types';
import { SENDGRID_TEMPLATES } from 'src/constant';

@Injectable()
export class PatientService {
  constructor(private prisma: PrismaService, private mail: SendgridService) { }

  public async addPatient(
    data: AddPatientDTO,
    organization_id: string,
    location_id: string,
  ): Promise<boolean> {

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
      if (patient) await this.vivalinkAuth(patient);
      return true;
    }
    catch (error) {
      console.error('Error adding patient:', error);
      throw error;
    }
  }



  async vivalinkAuth(pt: any) {

    // const doctor = await this.prisma.doctor.findFirst({
    //   where: {
    //     user_id: pt.doctor.id,
    //   },
    //   select:{
    //     id:true,
    //     user_id:true,
    //     user:{
    //       select:{
    //         id:true,
    //         email:true,
    //         first_name:true,
    //         last_name:true,
    //         dob:true,
    //         gender:true,
    //       },
    //     }
    //   }
    // });
    console.log(pt, '=======> pt');
    const patient = {
      height: pt.height,
      weight: pt.weight,
      firstName: pt.user.first_name,
      lastName: pt.user.last_name,
      subjectId: pt.user.first_name,
      birthDate: pt.user.dob ? pt.user.dob.toISOString().split('T')[0] : null,
      gender: pt.user.gender,
      site: 'Pakistan',
      monitoringProtocol: 'Default Monitoring Protocol',
      assignedPhysician: 'Hooria Choudry',
      reportForThirdParty: false,
      isRTRPMPatient: false,

    }
    // VVE-14 VVE-14
    const page = await this.vlLogin();

    const result = await this.vlAddPatient(page, patient);
    console.log('result========================>>>Final', result);
    if (result) {
      return 'Patient added successfully';
    } else {
      return 'Failed to add patient';
    }
  }


  async vlLogin() {
    try {
      const browser = await puppeteer.launch({
        headless: true, // Run in headless mode
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: null, // Use default viewport size
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });

      // Navigate the page to a URL.
      await page.goto("https://webportal.vivalink.com/sign-in");
      await page.waitForSelector('input[name="email"]');
      await page.type('input[name="email"]', "vivalink4VVE-14@outlook.com");
      await page.waitForSelector('input[name="password"]');
      await page.type('input[name="password"]', "Uc7%!D0)U9");

      await page.click('button[type="submit"]');
      await page.waitForNavigation();

      console.log("Logged in successfully");
      return page;
    } catch (err) {
      console.log("ERROR OCCURRED!!!", err);
    }
  }

  async vlAddPatient(page: any, patient: any) {


    try {
      // Navigate to patient add page
      // await page.goto("https://webportal.vivalink.com/patient-management/add");
      await page.goto("https://webportal.vivalink.com/patient-management/add", {
        waitUntil: "domcontentloaded",
        timeout: 60000
      });
      await page.waitForSelector('#patient-form', { timeout: 30000 });
      console.log("Navigated to patient add page====>>>");
      // Fill in patient information
      // Required fields
      await page.type('#firstName', patient.firstName);
      await page.type('#lastName', patient.lastName || '');
      await page.type('#internalId', patient.subjectId);

      // Select date of birth using the date picker
      if (patient.birthDate) {
        await page.click('#birthDate');
        await page.waitForSelector('.ant-picker-dropdown', { timeout: 5000 }).catch(() => {
          console.log('Date picker dropdown not found, continuing anyway');
        });
        await page.type('#birthDate', patient.birthDate);
        await page.keyboard.press('Enter');
      }

      // Select monitoring protocol (required)
      if (patient.monitoringProtocol) {
        await page.click('#monitoringProtocol');
        await page.waitForSelector('.ant-select-dropdown');

        // Get monitoring protocol dropdown options
        const protocolOptions = await page.$$('.ant-select-item-option');

        // Find and click the correct monitoring protocol option
        for (const option of protocolOptions) {
          const optionText = await page.evaluate(el => el.textContent.trim(), option);
          if (optionText.toLowerCase() === patient.monitoringProtocol.toLowerCase()) {
            await option.click();
            break;
          }
        }
      }

      // Select site if provided
      if (patient.site) {
        await page.click('#site');
        await page.waitForSelector('.ant-select-dropdown');

        // Get site dropdown options
        const siteOptions = await page.$$('.ant-select-item-option');

        // Find and click the correct site option
        for (const option of siteOptions) {
          const optionText = await page.evaluate(el => el.textContent.trim(), option);
          if (optionText.toLowerCase() === patient.site.toLowerCase()) {
            await option.click();
            break;
          }
        }
      }

      if (patient.assignedPhysician) {
        // Click to open dropdown
        await page.click('#physician');
        await page.waitForSelector('.ant-select-dropdown');

        // Type the name into the dropdown input
        await page.type('#physician', patient.assignedPhysician);

        // Wait for dropdown to populate
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Select matching option from visible dropdown
        const dropdownOptions = await page.$$('.ant-select-dropdown .ant-select-item-option');

        let found = false;
        for (const option of dropdownOptions) {
          const text = await page.evaluate(el => el.textContent?.trim(), option);
          console.log('Dropdown option:', text);
          if (text?.toLowerCase() === patient.assignedPhysician.toLowerCase()) {
            await option.click();
            found = true;
            break;
          }
        }

        if (!found) {
          console.log('Assigned physician not found in dropdown.');
        }
      }

      // if (patient.assignedPhysician) {
      //   // Click on the physician dropdown
      //   await page.click('#physician');
      //   await page.waitForSelector('.ant-select-dropdown');
      //   await page.type('#physician', patient.assignedPhysician);
      //   await page.keyboard.press('Enter');
      // }

      // Select gender if provided
      if (patient.gender) {
        await page.click('#gender');
        await page.waitForSelector('.ant-select-dropdown');

        // Get gender dropdown options
        const genderOptions = await page.$$('.ant-select-item-option');

        // Find and click the correct gender option
        for (const option of genderOptions) {
          const optionText = await page.evaluate(el => el.textContent.trim(), option);
          if (optionText.toLowerCase() === patient.gender.toLowerCase()) {
            await option.click();
            break;
          }
        }
      }

      // Enter height if provided
      if (patient.height) {
        await page.click('#height');
        await page.type('#height', patient.height.toString());
      }

      // Enter weight if provided
      if (patient.weight) {
        await page.click('#weight');
        await page.type('#weight', patient.weight.toString());
      }

      // Select "Report for Third Party" radio button (required)
      // Default is "No"
      // if (patient.reportForThirdParty === true) {
      //   await page.click('input[type="radio"][value="true"]#isOpenPrescribingPhysician');
      // } else {
      //   await page.click('input[type="radio"][value="false"]#isOpenPrescribingPhysician');
      // }

      // // Select "RT-RPM Patient" radio button (required)
      // // Default is "No"
      // if (patient.isRTRPMPatient === true) {
      //   await page.click('input[type="radio"][value="true"]#isRTRPMPatient');
      // } else {
      //   await page.click('input[type="radio"][value="false"]#isRTRPMPatient');
      // }

      // Submit the form
      // await page.click('button[type="submit"]');

      // Try multiple strategies to click the submit button
      // First attempt - direct click on button
      await page.evaluate(() => {
        console.log('Trying to submit the form in 1st attempt');
        const submitButton = Array.from(document.querySelectorAll('button')).find(
          button => button.textContent && button.textContent.includes('Save')
        );
        if (submitButton) (submitButton as HTMLButtonElement).click();
      });
      console.log('Trying to submit the form in 2nd attempt');
      // Second attempt - click by more specific selector
      await page.evaluate(() => {
        console.log('Trying to submit the form in 2nd attempt');
        const form = document.querySelector('#patient-form');
        if (form) {
          const submitButton = form.querySelector('button[type="submit"]');
          if (submitButton) (submitButton as HTMLButtonElement).click();
        }
      });

      const result = await Promise.race([
        page.waitForNavigation({ timeout: 30000 }).then(() => 'navigation'),
        page.waitForSelector('.success-message', { timeout: 30000 }).then(() => 'success'),
        new Promise(resolve => setTimeout(() => resolve('timeout'), 30000))
      ]);

      if (!result || result === 'timeout' || (result !== 'success' && result !== 'navigation')) {
        console.log('Timeout or unexpected result:', result);
        return false;
        // Continue anyway, as the form might have been submitted successfully despite the timeout
      }

      return true;
    } catch (err) {
      console.log("Error submitting the form:", err);
      return false;
    }
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
          }
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

  public async updateProfle(userId: string, data: any) {
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
    const skip = (page - 1) * limit;
    const take = limit;
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
}
