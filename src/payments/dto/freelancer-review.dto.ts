import { IsNumber, IsString, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FreelancerReviewDto {
  @ApiProperty({ description: 'Overall rating (1-5)' })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'Review text' })
  @IsString()
  review: string;

  @ApiProperty({ description: 'Payment rating (1-5)' })
  @IsNumber()
  @Min(1)
  @Max(5)
  payment: number;

  @ApiProperty({ description: 'Communication rating (1-5)' })
  @IsNumber()
  @Min(1)
  @Max(5)
  communication: number;

  @ApiProperty({ description: 'Clarity rating (1-5)' })
  @IsNumber()
  @Min(1)
  @Max(5)
  clarity: number;

  @ApiProperty({ description: 'Fairness rating (1-5)' })
  @IsNumber()
  @Min(1)
  @Max(5)
  fairness: number;

  @ApiProperty({ description: 'Would work with this client again' })
  @IsBoolean()
  wouldWorkAgain: boolean;
}


