export interface EmailPayload {
  to: string;
  template: template;
  data: {
    [key: string]: string;
  };
}

export type template =
  | 'template:reset-password-request'
  | 'template:reset-password-success'
  | 'template:onboarding';
