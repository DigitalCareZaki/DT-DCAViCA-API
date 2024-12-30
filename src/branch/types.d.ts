export interface GetBranchesProsp {
  name: string;
  email: string;
  phone_number: string;
  location: {
    address: string;
    city: {
      name: string;
      country: {
        name: string;
      };
    };
  };
  created_by: string;
  created_at: Date;
}
