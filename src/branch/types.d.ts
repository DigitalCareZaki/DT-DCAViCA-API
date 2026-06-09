export interface GetBranchesProsp {
  id: string;
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

export interface GetBranchDetailsProps extends GetBranchesProsp {
  organization_id: string;
  location: GetBranchesProsp['location'] & {
    id: string;
    city: GetBranchesProsp['location']['city'] & {
      id: string;
      country: GetBranchesProsp['location']['city']['country'] & {
        id: string;
      };
    };
  };
  updated_at: Date;
}
