export interface ValidateRoomProps {
  id: string;
  users: User[];
}

interface User {
  first_name: string;
  last_name: string;
  middle_name: string;
  id: string;
  uri: string;
  email: string;
  role: string;
}

export interface CreateRoomProps {
  id: string;
  users: User[];
}

export interface SearchUsersProps {
  first_name: string;
  last_name: string;
  middle_name: string;
  id: string;
  uri: string;
  email: string;
  role: string;
}

export interface GetRoomsProps {
  id: string;
  users: User[];
  unread_count?: number;
  last_message_at?: Date | null;
}
