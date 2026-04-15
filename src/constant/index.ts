export * from './roles.constants';

export enum SENDGRID_TEMPLATES {
    ONBOARDING = 'd-615ec8b40a3d4ed18d8090cb02b98aee',
    APPOINTMENT_INVITATION = 'd-6e279931fd6e4845830f5c378d2eec70',
    OTP = 'd-d12adb1f032d4a1baecc66642ba4786f',
    APPOINTMENT_REMINDER = 'd-0517266346334ace8116a54ae42a1a81',
    APPOINTMENT_STATUS_UPDATE = 'd-12a24653bd9d41f5899187d7ef2b6b83',
}

export const userSelectFields = {
    first_name: true,
    last_name: true,
    middle_name: true,
    uri: true,
    email: true,
    role: true,
};