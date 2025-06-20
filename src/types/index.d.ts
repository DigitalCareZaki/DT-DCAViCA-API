export * from './user';

export interface HealthRes {
  status: 'running';
  availableRoutes: Array<{ [key: string]: string }>;
}

export * from './pagination';

export interface SendMailPayload {
  to: string | string[];
  data: any;
  templateId: string;
};