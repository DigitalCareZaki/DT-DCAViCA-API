export interface DepartmentProps {
  id: string;
  title: string;
  description: string;
  location: {
    address: string;
    city: {
      name: string;
      country: {
        name: string;
      };
    };
  };
  branch: {
    name: string;
  };
  doctor: {
    id: string;
  }[];
  nurse: {
    id: string;
  }[];
  created_at: Date;
}
