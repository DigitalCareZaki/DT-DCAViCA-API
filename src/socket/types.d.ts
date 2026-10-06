export interface AppointmentProps {
  appointment_id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  uri: string;
  hand: boolean;
  camera: boolean;
  microphone: boolean;
}

export interface AppointmentUpdateProps {
  appointment_id: string;
  action: 'CREATED';
}

export interface MeetingChatProps {
  message: string;
  user_id: string;
  appointment_id: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  created_at: Date;
  media: string;
}
