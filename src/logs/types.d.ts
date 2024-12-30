export interface GetLogsProps {
  id: string;
  method: string;
  endpoint: string;
  module: string;
  platform: string;
  user: {
    middle_name: string | null;
    first_name: string;
    last_name: string;
    role: string;
    email: string;
    uri: string;
  };
  created_at: Date;
}
