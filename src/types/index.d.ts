export * from './user';

export interface HealthRes {
  status: 'running';
  availableRoutes: Array<{ [key: string]: string }>;
}

export * from './pagination';