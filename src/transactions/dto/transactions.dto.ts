import { IsNotEmpty, IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransferDto {
  @ApiProperty({
    description: 'Source account ID',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsNotEmpty()
  @IsString()
  fromAccountId: string;

  @ApiProperty({
    description: 'Destination account number (16 digits)',
    example: '1234567890123456',
  })
  @IsNotEmpty()
  @IsString()
  toAccountNumber: string;

  @ApiProperty({
    description: 'Transfer amount (minimum 0.01)',
    example: 100.50,
    minimum: 0.01,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({
    description: 'Transfer description',
    example: 'Payment for services',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
