import { IsNotEmpty, MinLength, MaxLength, IsNumber, Min, ArrayNotEmpty, IsString, IsUrl, ValidateNested, ArrayUnique, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCoffeeDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(200)
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsUrl()
  imageUrl: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @ArrayUnique()
  tagIds: string[];

}
