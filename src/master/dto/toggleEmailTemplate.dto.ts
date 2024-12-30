import { IsNotEmpty, IsString } from 'class-validator';

export class ToggleEmailTemplate {
  @IsString()
  @IsNotEmpty()
  id: string;
}
