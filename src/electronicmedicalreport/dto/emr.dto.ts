import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class EMRDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  uri: string;

  @IsString()
  @IsOptional()
  family_history: string;
}
