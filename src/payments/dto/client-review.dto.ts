import { IsNumber, IsString, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ClientReviewDto {
  @ApiProperty({ description: 'Overall rating (1-5)' })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'Review text' })
  @IsString()
  review: string;

  @ApiProperty({ description: 'Quality rating (1-5)' })
  @IsNumber()
  @Min(1)
  @Max(5)
  quality: number;

  @ApiProperty({ description: 'Communication rating (1-5)' })
  @IsNumber()
  @Min(1)
  @Max(5)
  communication: number;

  @ApiProperty({ description: 'Timeliness rating (1-5)' })
  @IsNumber()
  @Min(1)
  @Max(5)
  timeliness: number;

  @ApiProperty({ description: 'Professionalism rating (1-5)' })
  @IsNumber()
  @Min(1)
  @Max(5)
  professionalism: number;

  @ApiProperty({ description: 'Would recommend this freelancer' })
  @IsBoolean()
  wouldRecommend: boolean;
}


