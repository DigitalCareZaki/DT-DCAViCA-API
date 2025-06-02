import { PrismaClient, Role } from '@prisma/client';

import * as argon from 'argon2';
import { promises as fs } from 'fs';

import path from 'path';
const prisma = new PrismaClient();

async function createCountry() {
  const filePath = './countries.json';// adjust if your file path is different
  const jsonData = await fs.readFile(filePath, 'utf-8');
  const countries = JSON.parse(jsonData);

  for (const country of countries) {
    const createdCountry = await prisma.country.create({
      data: {
        name: country.country,
        code: country.code || null,
        country_code: country.countryCode || null,
      },
    });

    const cityData = (country.cities || []).map((city: string) => ({
      name: city,
      country_id: createdCountry.id,
    }));

    if (cityData.length > 0) {
      await prisma.city.createMany({
        data: cityData,
        skipDuplicates: true,
      });
    }
  }

  console.log('✅ Seeding complete.');
}

// async function createCountry() {
//   return await prisma.country.create({
//     data: {
//       name: 'Pakistan',
//       code: '+92',
//       country_code: 'PK',
//     },
//   });
// }

// async function createCity() {
//   const country = await prisma.country.findFirstOrThrow();

//   return await prisma.city.create({
//     data: {
//       name: 'Karachi',
//       country_id: country.id,
//     },
//   });
// }

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
  const city = await prisma.city.findFirstOrThrow();

  const location = await prisma.location.create({
    data: {
      address: 'Dalmia National Stadium Road, Karachi, Pakistan',
      city_id: city.id
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
      uri: 'http://res.cloudinary.com/dnymwfrn3/image/upload/v1747411638/avica/dnfbgtkkv4kxuz6qeloh.jpg',
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
      uri: 'http://res.cloudinary.com/dnymwfrn3/image/upload/v1747411638/avica/dnfbgtkkv4kxuz6qeloh.jpg',
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
      uri: 'http://res.cloudinary.com/dnymwfrn3/image/upload/v1747411638/avica/dnfbgtkkv4kxuz6qeloh.jpg',
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
      uri: 'http://res.cloudinary.com/dnymwfrn3/image/upload/v1747411638/avica/dnfbgtkkv4kxuz6qeloh.jpg',
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
      uri: 'http://res.cloudinary.com/dnymwfrn3/image/upload/v1747411638/avica/dnfbgtkkv4kxuz6qeloh.jpg',
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

  const patient = await prisma.patient.create({
    data: {
      user_id: user.id,
      height: 1.82, // in meters
      weight: 75, // in kg
    },
  });

  console.log('Patient created');


  const doctor = await prisma.user.findFirstOrThrow({ where: { role: 'DOCTOR' } });


  await prisma.patient.update({
    where: {
      user_id: patient.user_id,
    },
    data: {
      doctors: {
        connect: {
          user_id: doctor.id,
        },
      },
    },
  });

  console.log('Patient connected to doctor');

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
      uri: 'http://res.cloudinary.com/dnymwfrn3/image/upload/v1747411638/avica/dnfbgtkkv4kxuz6qeloh.jpg',
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
      // temperature readings
      {
        patient_id: patient.id,
        doctor_id: doctor.id,
        values: [104],
        mode: 'METRIC',
        type: 'TEMPERATURE',
        status: 'HIGH',
        title: 'Temperature Reading 2',
        unit: 'FAHRENHEIT',
        reading_source: 'MANUAL'
      },
      {
        patient_id: patient.id,
        doctor_id: doctor.id,
        values: [98.4],
        mode: 'METRIC',
        type: 'TEMPERATURE',
        status: 'NORMAL',
        title: 'Temperature Reading 1',
        unit: 'FAHRENHEIT',
        reading_source: 'MANUAL'
      },

      // blood pressure readings
      {
        patient_id: patient.id,
        doctor_id: doctor.id,
        values: [90, 120],
        mode: 'METRIC',
        type: 'BLOODPRESSURE',
        status: 'NORMAL',
        title: 'Blood Pressure Reading 1',
        unit: 'MMHG',
        reading_source: 'MANUAL'
      },
      {
        patient_id: patient.id,
        doctor_id: doctor.id,
        values: [120, 160],
        mode: 'METRIC',
        type: 'BLOODPRESSURE',
        status: 'HIGH',
        title: 'Blood Pressure Reading 2',
        unit: 'MMHG',
        reading_source: 'MANUAL'
      },

      // glucose readings
      {
        patient_id: patient.id,
        doctor_id: doctor.id,
        values: [90],
        mode: 'METRIC',
        type: 'BLOODGLUCOSE',
        status: 'NORMAL',
        title: 'Blood Glucose Reading 1',
        unit: 'MGDL',
        reading_source: 'MANUAL'
      },
      {
        patient_id: patient.id,
        doctor_id: doctor.id,
        values: [180],
        mode: 'METRIC',
        type: 'BLOODGLUCOSE',
        status: 'HIGH',
        title: 'Blood Glucose Reading 2',
        unit: 'MGDL',
        reading_source: 'MANUAL'
      },

      // oxygen saturation readings SPO2
      {
        patient_id: patient.id,
        doctor_id: doctor.id,
        values: [98],
        mode: 'METRIC',
        type: 'SPO2',
        status: 'HIGH',
        title: 'Oxygen Saturation Reading 1',
        unit: 'PERCENTAGE',
        reading_source: 'MANUAL'
      },
      {
        patient_id: patient.id,
        doctor_id: doctor.id,
        values: [85],
        mode: 'METRIC',
        type: 'SPO2',
        status: 'LOW',
        title: 'Oxygen Saturation Reading 2',
        unit: 'PERCENTAGE',
        reading_source: 'MANUAL'
      },

      // ECG readings
      {
        patient_id: patient.id,
        doctor_id: doctor.id,
        values: [90],
        mode: 'METRIC',
        type: 'ECG',
        status: 'HIGH',
        title: 'ECG Reading',
        unit: 'VOLTAGE',
        reading_source: 'MANUAL'
      },
      {
        patient_id: patient.id,
        doctor_id: doctor.id,
        values: [75],
        mode: 'METRIC',
        type: 'ECG',
        status: 'LOW',
        title: 'ECG Reading 2',
        unit: 'VOLTAGE',
        reading_source: 'MANUAL'
      }

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

  await prisma.medication.createMany({
    data: [
      {
        name: 'Aspirin',
        start_date,
        end_date,
        time: now,
        dosage: '10mg',
        frequency: 2,
        unit: 'TABLET',
        patient_id: patient.id,
        doctor_id: doctor.id,
      },
      {
        name: 'Paracetamol',
        start_date,
        end_date,
        time: now,
        dosage: '500mg',
        frequency: 3,
        unit: 'TABLET',
        patient_id: patient.id,
        doctor_id: doctor.id,
      },
      {
        name: 'Ibuprofen',
        start_date,
        end_date,
        time: now,
        dosage: '200mg',
        frequency: 1,
        unit: 'TABLET',
        patient_id: patient.id,
        doctor_id: doctor.id,
      },
      {
        name: 'Amoxicillin',
        start_date,
        end_date,
        time: now,
        dosage: '250mg',
        frequency: 2,
        unit: 'CAPSULE',
        patient_id: patient.id,
        doctor_id: doctor.id,
      },
      {
        name: 'Metformin',
        start_date,
        end_date,
        time: now,
        dosage: '500mg',
        frequency: 2,
        unit: 'TABLET',
        patient_id: patient.id,
        doctor_id: doctor.id,
      },
    ]
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

async function createPosts() {
  const doctor = await prisma.user.findFirstOrThrow({
    where: {
      role: Role.DOCTOR,
    },
    orderBy: { created_at: 'desc' },
  });

  const superadmin = await prisma.user.findFirstOrThrow({
    where: { role: Role.SUPERADMIN },
    orderBy: { created_at: 'desc' },
  });

  await prisma.post.createMany({
    data: [
      {
        title: 'Understanding Heart Health: Tips for a Healthy Cardiovascular System',
        content: 'Maintaining good heart health is crucial for overall well-being. Regular exercise, a balanced diet rich in fruits and vegetables, avoiding smoking, and managing stress are key factors. It\'s important to monitor your blood pressure regularly and maintain a healthy weight. Remember, small lifestyle changes can make a big difference in your heart health.',
        uri: 'https://res.cloudinary.com/dnymwfrn3/image/upload/v1747468621/avica/aqlmdtvcjqdmecrea6d8.png',
        additional_uri: [
          'https://res.cloudinary.com/dnymwfrn3/image/upload/v1747468621/avica/aqlmdtvcjqdmecrea6d8.png',
          'https://res.cloudinary.com/dnymwfrn3/image/upload/v1747468621/avica/aqlmdtvcjqdmecrea6d8.png'
        ],
        refrence: [
          'American Heart Association',
          'Mayo Clinic - Heart Health Guidelines'
        ],
        author_id: doctor.id,
        likes_count: 15,
        comments_count: 8,
        views_count: 142,
      },
      {
        title: 'Managing Diabetes: A Comprehensive Guide for Patients',
        content: 'Diabetes management involves monitoring blood sugar levels, taking medications as prescribed, maintaining a healthy diet, and staying physically active. Regular check-ups with your healthcare provider are essential. Understanding carbohydrate counting and recognizing symptoms of high or low blood sugar can help you better manage your condition.',
        uri: 'https://res.cloudinary.com/dnymwfrn3/image/upload/v1747468621/avica/aqlmdtvcjqdmecrea6d8.png',
        additional_uri: [
          'https://res.cloudinary.com/dnymwfrn3/image/upload/v1747468621/avica/aqlmdtvcjqdmecrea6d8.png'
        ],
        refrence: [
          'American Diabetes Association',
          'CDC Diabetes Guidelines'
        ],
        author_id: doctor.id,
        likes_count: 23,
        comments_count: 12,
        views_count: 198,
      },
      {
        title: 'The Importance of Regular Health Screenings',
        content: 'Regular health screenings can help detect potential health issues early when they are most treatable. Depending on your age and risk factors, screenings may include blood pressure checks, cholesterol tests, cancer screenings, and bone density tests. Talk to your healthcare provider about which screenings are right for you.',
        uri: 'https://res.cloudinary.com/dnymwfrn3/image/upload/v1747468621/avica/aqlmdtvcjqdmecrea6d8.png',
        additional_uri: [],
        refrence: [
          'U.S. Preventive Services Task Force',
          'World Health Organization'
        ],
        author_id: superadmin.id,
        likes_count: 31,
        comments_count: 6,
        views_count: 267,
      },
      {
        title: 'Mental Health Awareness: Breaking the Stigma',
        content: 'Mental health is just as important as physical health. It\'s okay to seek help when you\'re struggling with anxiety, depression, or other mental health concerns. Professional support, therapy, medication when appropriate, and self-care practices can all contribute to better mental health. Remember, seeking help is a sign of strength, not weakness.',
        uri: 'https://res.cloudinary.com/dnymwfrn3/image/upload/v1747468621/avica/aqlmdtvcjqdmecrea6d8.png',
        additional_uri: [
          'https://res.cloudinary.com/dnymwfrn3/image/upload/v1747468621/avica/aqlmdtvcjqdmecrea6d8.png',
          'https://res.cloudinary.com/dnymwfrn3/image/upload/v1747468621/avica/aqlmdtvcjqdmecrea6d8.png'
        ],
        refrence: [
          'National Institute of Mental Health',
          'Mental Health America'
        ],
        author_id: superadmin.id,
        likes_count: 45,
        comments_count: 18,
        views_count: 356,
      },
      {
        title: 'Nutrition Tips for Healthy Aging',
        content: 'As we age, our nutritional needs change. Focus on nutrient-dense foods like leafy greens, lean proteins, whole grains, and colorful fruits and vegetables. Stay hydrated, limit processed foods, and consider supplements if recommended by your healthcare provider. Good nutrition supports immune function, bone health, and cognitive function as we age.',
        uri: 'https://res.cloudinary.com/dnymwfrn3/image/upload/v1747468621/avica/aqlmdtvcjqdmecrea6d8.png',
        additional_uri: [
          'https://res.cloudinary.com/dnymwfrn3/image/upload/v1747468621/avica/aqlmdtvcjqdmecrea6d8.png'
        ],
        refrence: [
          'National Institute on Aging',
          'Academy of Nutrition and Dietetics'
        ],
        author_id: doctor.id,
        likes_count: 19,
        comments_count: 9,
        views_count: 189,
      },
      {
        title: 'Understanding Your Medication: Tips for Safe Use',
        content: 'Taking medications safely is crucial for effective treatment. Always follow your doctor\'s instructions, take medications at the prescribed times, and never skip doses. Keep an updated list of all your medications, including over-the-counter drugs and supplements. If you experience side effects, contact your healthcare provider immediately.',
        uri: 'https://res.cloudinary.com/dnymwfrn3/image/upload/v1747468621/avica/aqlmdtvcjqdmecrea6d8.png',
        additional_uri: [],
        refrence: [
          'FDA Medication Safety Guidelines',
          'Institute for Safe Medication Practices'
        ],
        author_id: superadmin.id,
        likes_count: 12,
        comments_count: 4,
        views_count: 134,
        active: true,
      }
    ],
  });

  console.log('Posts created successfully');
}

async function main() {
  await createCountry();
  // await createCity();
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
  await createPosts(); // Add this line

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

  // await prisma.emailTemplate.create({
  //   data: {
  //     subject: "Welcome to Avica! We're Glad to Have You Onboard",
  //     key: 'template:onboarding',
  //     active: true,
  //     html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
  //   <html xmlns="http://www.w3.org/1999/xhtml">
  //     <head>
  //       <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  //       <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  //       <title>Welcome to Avica</title>
  //     </head>
  //     <body
  //       style="
  //         font-family: Helvetica, Arial, sans-serif;
  //         margin: 0px;
  //         padding: 0px;
  //         background-color: #ffffff;
  //       "
  //     >
  //       <table
  //         role="presentation"
  //         style="
  //           width: 100%;
  //           border-collapse: collapse;
  //           border: 0px;
  //           border-spacing: 0px;
  //           font-family: Arial, Helvetica, sans-serif;
  //           background-color: rgb(239, 239, 239);
  //         "
  //       >
  //         <tbody>
  //           <tr>
  //             <td
  //               align="center"
  //               style="padding: 1rem 2rem; vertical-align: top; width: 100%"
  //             >
  //               <table
  //                 role="presentation"
  //                 style="
  //                   max-width: 600px;
  //                   border-collapse: collapse;
  //                   border: 0px;
  //                   border-spacing: 0px;
  //                   text-align: left;
  //                 "
  //               >
  //                 <tbody>
  //                   <tr>
  //                     <td style="padding: 40px 0px 0px">
  //                       <div style="text-align: left">
  //                         <div style="padding-bottom: 20px">
  //                           <img
  //                             src="https://firebasestorage.googleapis.com/v0/b/vstyling-bfbb1.appspot.com/o/Avica%20logo%20blue.png?alt=media&amp;amp;amp;token=0a3532b5-4ac9-4869-9a21-1f68a01fbc5d"
  //                             alt="Company"
  //                             style="width: 135px"
  //                           />
  //                         </div>
  //                       </div>
  //                       <div
  //                         style="
  //                           padding: 20px;
  //                           background-color: rgb(255, 255, 255);
  //                         "
  //                       >
  //                         <div style="color: rgb(0, 0, 0); text-align: left">
  //                           <p style="padding-bottom: 16px">Hi USERNAME,</p>
  //                           <p style="padding-bottom: 16px">
  //                             Thank you for signing up with Avica! 🎉 We're excited
  //                             to have you as part of our community.
  //                           </p>
  //                           <p style="padding-bottom: 16px">
  //                             At Avica, we are committed to delivering the best
  //                             medical facility. Your journey with us starts now, and
  //                             we’re here to ensure you get the most out of your
  //                             experience.
  //                           </p>
  //                           <p style="padding-bottom: 16px">
  //                             Best regards,<br />Dr. Zakiuddin Ahmed<br />CEO and
  //                             Founder
  //                           </p>
  //                         </div>
  //                       </div>
  //                       <div
  //                         style="
  //                           padding-top: 20px;
  //                           color: rgb(153, 153, 153);
  //                           text-align: center;
  //                         "
  //                       ></div>
  //                     </td>
  //                   </tr>
  //                 </tbody>
  //               </table>
  //             </td>
  //           </tr>
  //         </tbody>
  //       </table>
  //     </body>
  //   </html>
  //   `,
  //   },
  // });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
