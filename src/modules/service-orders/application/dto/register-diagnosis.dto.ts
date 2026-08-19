import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RegisterDiagnosisDto {
  @ApiProperty({ example: 'Engine oil leak identified during inspection.' })
  @IsString()
  diagnosis: string;
}
