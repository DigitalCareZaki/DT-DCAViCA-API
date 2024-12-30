import { IsString, IsOptional, IsNotEmpty, IsUrl } from 'class-validator';

export class AddVideosDTO {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsUrl()
  @IsNotEmpty()
  uri: string;

  @IsUrl()
  @IsOptional()
  thumbnail: string;
}
