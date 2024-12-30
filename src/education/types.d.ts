export { Post } from 'prisma/prisma-client';

export type PostRes = {
  id: string;
  uri: string;
  title: string;
  content: string;
  author: {
    first_name: string;
    last_name: string;
  };
  likes_count: number;
  views_count: number;
  created_at: Date;
};
