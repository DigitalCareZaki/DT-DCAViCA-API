import { UserRole } from '@types';

export type { Appointment } from 'prisma/prisma-client';

export type GetAppointmentsType = {
  id: string;
  title: string;
  description: string;
  type: string;
  about: string;
  start_date: Date;
  end_date: Date;
  participants: {
    user: {
      first_name: string;
      last_name: string;
      middle_name: string;
      role: UserRole;
      uri: string;
    };
    status: string;
  }[];
  created_at: Date;
};

export type AppointmentStatus =
  | 'ACTIVE'
  | 'CANCELLED'
  | 'ONGOING'
  | 'HOLD'
  | 'COMPLETED';
export type AppointmentType = 'ONLINE' | 'OFFLINE';

export interface SearchResProps {
  email: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  id: string;
}

export interface RequestedAppointmentProps {
  status: string;
  id: string;
  appointment: {
    id: string;
    about: string;
    type: string;
    title: string;
    start_date: Date;
    end_date: Date;
    description: string;
    organizer: {
      id: string;
      first_name: string;
      last_name: string;
      middle_name: string;
      uri: string;
      role: string;
    };
    participants: Array<{ id: string }>;

    created_at: Date;
  };
}

export interface TelemedActionProps {
  updated: boolean;
}

export interface TelemedViewProps {
  participants: {
    status: string;
    user: {
      first_name: string;
      last_name: string;
      middle_name: string;
      email: string;
      role: string;
    };
  }[];
  id: string;
  start_date: Date;
  end_date: Date;
  created_at: Date;
  title: string;
  description: string;
  about: string;
  type: string;
  notes: string[];
  status: string;
  organizer_id: string;
  organizer: {
    first_name: string;
    last_name: string;
    middle_name: string;
  };
}

export interface MeetingMetadataProps {
  title: string;
  description: string;
  participants: {
    id: string;
  }[];
}

export interface JoinedMeetingProps {
  created: boolean;
}

export interface GetMeetingParticipants {
  user: {
    first_name: 'Muhammad';
    last_name: 'Saqib';
    middle_name: null;
    uri: null;
    id: 'e399b95d-6503-4b88-a377-fbc1ad9070c9';
  };
}

export interface LeftMeetingProps {
  updated: boolean;
}

export interface GetMeetingParticipantsProps {
  user: {
    first_name: string;
    last_name: string;
    middle_name: string;
    uri: string;
    id: string;
    role: string;
  };
  left: boolean;
}

export interface GetMeetingChatsProps {
  chats: {
    id: string;
    media: string;
    created_at: Date;
    read: boolean;
    message: string;
    auhor: {
      first_name: string;
      last_name: string;
      middle_name: string;
      uri: string;
      role: UserRole;
      id: string;
    };
  }[];
}
