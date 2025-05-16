import { PrismaClient, Role } from '@prisma/client';

import * as argon from 'argon2';

const prisma = new PrismaClient();

async function createCountry() {
  return await prisma.country.create({
    data: {
      name: 'Pakistan',
      code: '+92',
      country_code: 'PK',
    },
  });
}

async function createCity() {
  const country = await prisma.country.findFirstOrThrow();

  return await prisma.city.createMany({
    data: [
      {
        name: 'Karachi',
        country_id: country.id,
      },
    ],
  });
}

async function createLocation() {
  const city = await prisma.city.findFirstOrThrow({
    where: {
      name: 'Karachi',
    },
  });

  return await prisma.location.create({
    data: {
      lat: 24.891975,
      long: 67.072861,
      address: 'Liaquat National Hospital, National Stadium Road, Karachi',
      zipcode: '74800',
      city_id: city.id,
    },
  });
}

async function createOrganization() {
  const location = await prisma.location.create({
    data: {
      address: 'Dalmia National Stadium Road, Karachi, Pakistan',
      city: {
        create: {
          name: 'Karachi',
          country: {
            create: {
              name: 'Pakistan',
              code: '+92',
              country_code: 'PK',
            },
          },
        },
      },
    },
  });

  return await prisma.organization.create({
    data: {
      name: 'Liaquat National Hospital',
      email: 'info@lnh.edu.com',
      phone_number: '(021) 111 456 456',
      website: 'www.lnh.edu.com',
      location_id: location.id,
      uri: 'https://res.cloudinary.com/gdpk/image/upload/v1604129394/lnh_qo9w0e.png',
      userId: 'init', // who created this
    },
  });
}

async function createBranch() {
  const location = await prisma.location.findFirstOrThrow({
    orderBy: {
      created_at: 'desc',
    },
  });

  const organization = await prisma.organization.findFirstOrThrow({
    orderBy: { created_at: 'desc' },
  });

  return await prisma.branch.create({
    data: {
      name: 'Karachi Dalmia Branch',
      location_id: location.id,
      organization_id: organization.id,
      created_by: 'master',
      phone_number: '(+92) 000000000',
      email: 'dalmiakarachi@aghakhan.com',
    },
  });
}

async function addDepartment() {
  const location = await prisma.location.findFirstOrThrow();
  const branch = await prisma.branch.findFirstOrThrow();

  return await prisma.department.create({
    data: {
      title: 'Cardiology',
      description:
        'Department of Cardiology caters to a huge number of heart disease patients with simple to complex conditions on a daily basis. Such patients often have multiple co-morbid conditions and usually require multidisciplinary patient care.',
      location_id: location.id,
      barnch_id: branch.id,
    },
  });
}

async function createMaster() {
  const encPassword = await argon.hash('Avica@123');

  const city = await prisma.city.findFirstOrThrow({
    orderBy: { created_at: 'desc' },
  });

  const location = await prisma.location.create({
    data: {
      lat: 24.865716,
      long: 67.336811,
      address: 'Stadium Road, Karachi 74800. Pakistan, Karachi, Pakistan',
      zipcode: 'K-1800',
      city_id: city.id,
    },
  });

  await prisma.user.create({
    data: {
      password: encPassword,
      email: 'master@avica.com',
      first_name: 'Master',
      last_name: 'Avica',
      dob: new Date(),
      role: 'MASTER',
      gender: 'MALE',
      title: 'MR',
      phone_number: '+923440021312',
      username: 'master',
      location_id: location.id,
    },
  });

  console.log('Master created');
}

async function createSuperAdmin() {
  const encPassword = await argon.hash('Superadmin@123');

  const city = await prisma.city.findFirstOrThrow({
    orderBy: { created_at: 'desc' },
  });

  const location = await prisma.location.create({
    data: {
      lat: 24.865716,
      long: 67.336811,
      address: 'Stadium Road, Karachi 74800. Pakistan, Karachi, Pakistan',
      zipcode: 'K-1800',
      city_id: city.id,
    },
  });

  const organization = await prisma.organization.findFirstOrThrow({
    orderBy: { created_at: 'desc' },
  });

  await prisma.user.create({
    data: {
      password: encPassword,
      email: 'kashif@avica.com',
      first_name: 'Kashif',
      last_name: 'Fareed',
      dob: new Date(),
      role: 'SUPERADMIN',
      gender: 'MALE',
      title: 'MR',
      phone_number: '+923332913538',
      username: 'superadmin',
      location_id: location.id,
      organization_id: organization.id,
    },
  });

  console.log('Superadmin created');
}

async function createDoctor() {
  const encPassword = await argon.hash('Doctor@123');

  const location = await prisma.location.findFirstOrThrow({
    orderBy: { created_at: 'desc' },
  });

  const branch = await prisma.branch.findFirstOrThrow({
    orderBy: { created_at: 'desc' },
  });

  const organization = await prisma.organization.findFirstOrThrow({
    orderBy: { created_at: 'desc' },
  });

  const department = await prisma.department.findFirstOrThrow({
    orderBy: { created_at: 'desc' },
  });

  const speciality = await prisma.specialization.create({
    data: {
      title: 'Cardiologist',
      institute_name: 'Dow Medical University',
      graduation_date: new Date(2020, 3, 1),
      working_from: new Date(2021, 1, 1),
    },
  });

  const speciality2 = await prisma.specialization.create({
    data:
    {
      title: 'Gynecologist',
      institute_name: 'Dow Medical University',
      graduation_date: new Date(2020, 3, 1),
      working_from: new Date(2021, 1, 1),
    },
  });

  await prisma.user.create({
    data: {
      password: encPassword,
      email: 'muhammadsaqib@avica.com',
      first_name: 'Muhammad',
      last_name: 'Saqib',
      dob: new Date(),
      role: 'DOCTOR',
      gender: 'MALE',
      title: 'MR',
      phone_number: '+923122190119',
      username: 'drsaqib',
      location_id: location.id,
      doctor: {
        create: {
          npi_number: '152396213',
          pmdc_number: '14648-C',
          employee_id: 'LQ-2',
          departments: {
            connect: {
              id: department.id,
            },
          },
          specialities: {
            connect: {
              id: speciality.id,
            },
          },
        },
      },
      associated_branches: {
        connect: {
          id: branch.id,
        },
      },
      organization_id: organization.id,
    },
  });

  await prisma.user.create({
    data: {
      password: encPassword,
      email: 'muhammadsaqib2@avica.com',
      first_name: 'Muhammad',
      last_name: 'Saqib',
      dob: new Date(),
      role: 'DOCTOR',
      gender: 'MALE',
      title: 'MR',
      phone_number: '+923122190118',
      username: 'saqib',
      location_id: location.id,
      doctor: {
        create: {
          npi_number: '152396214',
          pmdc_number: '14647-A',
          employee_id: 'LQ-3',
          departments: {
            connect: {
              id: department.id,
            },
          },
          specialities: {
            connect: {
              id: speciality2.id,
            },
          },
        },
      },
      associated_branches: {
        connect: {
          id: branch.id,
        },
      },
      organization_id: organization.id,
    },
  });

  console.log('Doctor created');
}

async function createPatient() {
  const encPassword = await argon.hash('Patient@123');

  const city = await prisma.city.findFirstOrThrow({
    where: {
      name: 'Karachi',
    },
  });

  const location = await prisma.location.create({
    data: {
      lat: 21.92497540429571,
      long: 62.12799064034601,
      address: 'Johar Mor, Gulistan-e-Johar, Block-19 Karachi, Pakistan',
      zipcode: 'K-127',
      city_id: city.id,
    },
  });

  const branch = await prisma.branch.findFirstOrThrow();

  const organization = await prisma.organization.findFirstOrThrow({
    orderBy: { created_at: 'desc' },
  });

  const user = await prisma.user.create({
    data: {
      password: encPassword,
      email: 'haris@avica.com',
      first_name: 'Haris',
      last_name: 'Iqbal',
      dob: new Date(),
      role: 'PATIENT',
      gender: 'MALE',
      title: 'MR',
      phone_number: '+92312211312',
      username: 'harisiqbal',
      location_id: location.id,
      associated_branches: {
        connect: {
          id: branch.id,
        },
      },
      organization_id: organization.id,
      user_meta_data: {
        create: {
          ip_address: '202.47.40.8',
          device_info: 'Lenovo L340 Gaming Laptop',
          os: 'Linux (POPOS)',
        },
      },
    },
  });

  await prisma.patient.create({
    data: {
      user_id: user.id,
    },
  });

  console.log('Patient created');
}

async function connectPatientToDoctors() {
  const patient = await prisma.patient.findFirstOrThrow({
    orderBy: { created_at: 'desc' },
  });

  const doctor = await prisma.doctor.findFirstOrThrow({
    orderBy: { created_at: 'desc' },
  });

  await prisma.patient.update({
    where: {
      user_id: patient.user_id,
    },
    data: {
      doctors: {
        connect: {
          user_id: doctor.user_id,
        },
      },
    },
  });
}

async function createPatientContacts() {
  const patient = await prisma.patient.findFirstOrThrow({
    orderBy: { created_at: 'desc' },
  });

  await prisma.contacts.createMany({
    data: [
      {
        name: 'Ali Iqbal',
        user_id: patient.user_id, // will use user_id instead of id
        number: '+923448112277',
        relationship: 'Brother',
      },
      {
        name: 'Maaz Ali',
        user_id: patient.user_id, // will use user_id instead of id
        number: '+923448133277',
        relationship: 'Friend',
      },
    ],
  });
}

async function createNurse() {
  const encPassword = await argon.hash('Nurse@123');

  const city = await prisma.city.findFirstOrThrow({
    where: {
      name: 'Karachi',
    },
  });

  const location = await prisma.location.create({
    data: {
      lat: 21.92497540429571,
      long: 62.12799064034601,
      address: 'Gulshan e Iqbal, Karachi, Pakistan',
      zipcode: 'K-1100',
      city_id: city.id,
    },
  });

  const branch = await prisma.branch.findFirstOrThrow();

  const organization = await prisma.organization.findFirstOrThrow({
    orderBy: { created_at: 'desc' },
  });

  const user = await prisma.user.create({
    data: {
      password: encPassword,
      email: 'mahnoor@avica.com',
      first_name: 'Mahnoor',
      last_name: 'Asif',
      dob: new Date(),
      role: 'NURSE',
      gender: 'FEMALE',
      title: 'MISS',
      phone_number: '+92311410312',
      username: 'mahnoorasif',
      location_id: location.id,
      associated_branches: {
        connect: {
          id: branch.id,
        },
      },
      organization_id: organization.id,
      user_meta_data: {
        create: {
          ip_address: '21.22.41.8',
          device_info: 'Dell Laptop',
          os: 'Windows10',
        },
      },
    },
  });

  const department = await prisma.department.findFirstOrThrow({
    orderBy: { created_at: 'desc' },
  });

  await prisma.nurse.create({
    data: {
      user_id: user.id,
      npi_number: 'AGH-3159',
      employee_id: 'AGH-311',
      department_id: department.id,
    },
  });

  console.log('Nurse created');
}

async function connectPatientToNurse() {
  const patient = await prisma.patient.findFirstOrThrow({
    orderBy: { created_at: 'desc' },
  });

  const nurse = await prisma.nurse.findFirstOrThrow({
    orderBy: { created_at: 'desc' },
  });

  await prisma.patient.update({
    where: {
      user_id: patient.user_id,
    },
    data: {
      nurses: {
        connect: {
          user_id: nurse.user_id,
        },
      },
    },
  });
}

async function patientMeasurements() {
  const patient = await prisma.patient.findFirstOrThrow();

  const doctor = await prisma.doctor.findFirstOrThrow();

  await prisma.measurement.createMany({
    data: [
      {
        patient_id: patient.id,
        doctor_id: doctor.id,
        values: [104],
        mode: 'METRIC',
        type: 'TEMPERATURE',
        status: 'HIGH',
        title: 'Temperature',
        unit: 'FAHRENHEIT',
      },
      {
        patient_id: patient.id,
        doctor_id: doctor.id,
        values: [98],
        mode: 'METRIC',
        type: 'TEMPERATURE',
        status: 'NORMAL',
        title: 'Temperature',
        unit: 'FAHRENHEIT',
      },
    ],
  });
}

async function createOrganizationMedications() {
  const organization = await prisma.organization.findFirstOrThrow();

  await prisma.organizationMedication.create({
    data: {
      name: 'Panadol',
      organization_id: organization.id,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  await prisma.organizationMedication.create({
    data: {
      name: 'Paracetamol',
      organization_id: organization.id,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  await prisma.organizationMedication.create({
    data: {
      name: 'Ibuprofen',
      organization_id: organization.id,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
}

async function createMedication() {
  const now = new Date();
  const millisecondsToAdd = 7 * 24 * 60 * 60 * 1000; // 7 days

  const patient = await prisma.patient.findFirstOrThrow();
  const doctor = await prisma.doctor.findFirstOrThrow();

  const start_date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end_date = new Date(start_date.getTime() + millisecondsToAdd);

  await prisma.medication.create({
    data: {
      name: 'Panadol',
      start_date,
      end_date,
      time: now,
      dosage: '10mg',
      frequency: 2,
      unit: 'TABLET',
      patient_id: patient.id,
      doctor_id: doctor.id,
    },
  });
}

async function createNotifications() {

  const patient = await prisma.patient.findFirstOrThrow({
    orderBy: { created_at: 'desc' },
  });

  const doctor = await prisma.doctor.findFirstOrThrow({
    orderBy: { created_at: 'desc' },
  });

  await prisma.notification.createMany({
    data: [
      {
        title: 'Test Notification',
        description: 'This is a test notification',
        sender_id: doctor.user_id,
        reciever_id: patient.user_id,
      },
      {
        title: 'Test Notification 2',
        description: 'This is a test notification 2',
        sender_id: doctor.user_id,
        reciever_id: patient.user_id,
      },
      {
        title: 'Test Notification 3',
        description: 'This is a test notification 3',
        sender_id: doctor.user_id,
        reciever_id: patient.user_id,
      }
    ],
  });

  console.log('Notifications created');
}

async function sendSMS() {
  const patient = await prisma.user.findFirstOrThrow({
    where: {
      role: Role.PATIENT,
    },
    orderBy: { created_at: 'desc' },
  });

  const doctor = await prisma.user.findFirstOrThrow({
    where: {
      role: Role.DOCTOR,
    },
    orderBy: { created_at: 'desc' },
  });

  await prisma.sms.createMany({
    data: [
      {
        to: patient.phone_number,
        body: 'This is a test SMS',
        sender_id: doctor.id,
        receiver_id: patient.id,
      },
      {
        to: patient.phone_number,
        body: 'This is a test SMS 2',
        sender_id: doctor.id,
        receiver_id: patient.id,
      },
      {
        to: patient.phone_number,
        body: 'This is a test SMS 3',
        sender_id: doctor.id,
        receiver_id: patient.id,
      }
    ]
  });

  console.log('SMS created');
}

async function main() {
  await createCountry();
  await createCity();
  await createLocation();
  await createOrganization();
  await createBranch();
  await addDepartment();
  await createSuperAdmin();
  await createDoctor();
  await createPatient();
  await connectPatientToDoctors();
  await createPatientContacts();
  await createNurse();
  await connectPatientToNurse();
  await patientMeasurements();
  await createOrganizationMedications();
  await createMedication();
  await createMaster();
  await createNotifications();
  await sendSMS();

  // const res = await prisma.post.update({
  //   where: {
  //     id: 'c16dab1e-2f1b-4aeb-afc2-65867b6610d7',
  //   },
  //   data: {
  //     uri: 'https://mobility-health-backend-production.up.railway.app/uploads/1719772760096-GettyImages-1215709172.webp',
  //   },
  // });
  // const res = await prisma.post.findMany();
  // const res = await prisma.user.findUnique({
  //   where: {
  //     email: 'ali@avica.com',
  //   },
  // });
  // const doctor = await prisma.user.findUnique({
  //   where: {
  //     email: 'saad@avica.com',
  //   },
  // });
  // await prisma.patient.update({
  //   where: {
  //     user_id: res?.id,
  //   },
  //   data: {
  //     doctors: {
  //       connect: {
  //         user_id: doctor?.id,
  //       },
  //     },
  //   },
  // });

  // await prisma.emailTemplate.create({
  //   data: {
  //     subject: 'Welcome to avica | Avica',
  //     html: ``,
  //     key: 'template:onboarding',
  //   },
  // });

  await prisma.emailTemplate.create({
    data: {
      subject: "Welcome to Avica! We're Glad to Have You Onboard",
      key: 'template:onboarding',
      active: false,
      html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Welcome to Avica</title>
      </head>
      <body
        style="
          font-family: Helvetica, Arial, sans-serif;
          margin: 0px;
          padding: 0px;
          background-color: #ffffff;
        "
      >
        <table
          role="presentation"
          style="
            width: 100%;
            border-collapse: collapse;
            border: 0px;
            border-spacing: 0px;
            font-family: Arial, Helvetica, sans-serif;
            background-color: rgb(239, 239, 239);
          "
        >
          <tbody>
            <tr>
              <td
                align="center"
                style="padding: 1rem 2rem; vertical-align: top; width: 100%"
              >
                <table
                  role="presentation"
                  style="
                    max-width: 600px;
                    border-collapse: collapse;
                    border: 0px;
                    border-spacing: 0px;
                    text-align: left;
                  "
                >
                  <tbody>
                    <tr>
                      <td style="padding: 40px 0px 0px">
                        <div style="text-align: left">
                          <div style="padding-bottom: 20px">
                            <img
                              src="https://firebasestorage.googleapis.com/v0/b/vstyling-bfbb1.appspot.com/o/Avica%20logo%20blue.png?alt=media&amp;amp;amp;token=0a3532b5-4ac9-4869-9a21-1f68a01fbc5d"
                              alt="Company"
                              style="width: 135px"
                            />
                          </div>
                        </div>
                        <div
                          style="
                            padding: 20px;
                            background-color: rgb(255, 255, 255);
                          "
                        >
                          <div style="color: rgb(0, 0, 0); text-align: left">
                            <p style="padding-bottom: 16px">Hi USERNAME,</p>
                            <p style="padding-bottom: 16px">
                              Thank you for signing up with Avica! 🎉 We're excited
                              to have you as part of our community.
                            </p>
                            <p style="padding-bottom: 16px">
                              At Avica, we are committed to delivering the best
                              medical facility. Your journey with us starts now, and
                              we’re here to ensure you get the most out of your
                              experience.
                            </p>
                            <p style="padding-bottom: 16px">
                              Best regards,<br />Dr. Zakiuddin Ahmed<br />CEO and
                              Founder
                            </p>
                          </div>
                        </div>
                        <div
                          style="
                            padding-top: 20px;
                            color: rgb(153, 153, 153);
                            text-align: center;
                          "
                        ></div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
    `,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
