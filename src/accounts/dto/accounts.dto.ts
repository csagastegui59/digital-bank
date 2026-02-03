import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Currency } from '../../entities/account/account.entity';

export class CreateAccountDto {
  @ApiProperty({
    description: 'Account currency',
    enum: Currency,
    example: Currency.PEN,
  })
  @IsEnum(Currency)
  @IsNotEmpty()
  currency: Currency;
}
