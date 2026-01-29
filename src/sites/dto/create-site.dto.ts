import { IsString, IsOptional } from 'class-validator';

export class CreateSiteDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  countryCode: string;

  @IsOptional()
  @IsString()
  address?: string;
}
