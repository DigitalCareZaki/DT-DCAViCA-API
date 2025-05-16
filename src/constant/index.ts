export * from './roles.constants';

export enum SENDGRID_TEMPLATES {
    PATIENT_REGISTRATION = 'd-615ec8b40a3d4ed18d8090cb02b98aee',
    APPOINTMENT_INVITATION = 'd-6e279931fd6e4845830f5c378d2eec70',
}

export const userSelectFields = {
    first_name: true,
    last_name: true,
    middle_name: true,
    uri: true,
    email: true,
    role: true,
};