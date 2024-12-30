import type { Message } from '@prisma/client';

export { Message };

export interface InboxRes {
  id: string;
  subject: string;
  sender: {
    first_name: string;
    last_name: string;
    middle_name: string;
    uri: string;
  };
  attachments: string[];
  created_at: Date;
  deleted: boolean;
  starred: boolean;
}

export interface SearchUserRes {
  email: string;
  uri: string | null;
  role: string;
  first_name: string;
  last_name: string;
  middle_name: string;
}
