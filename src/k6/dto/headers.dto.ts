import { IsObject, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class HeadersDto {
  @ApiPropertyOptional({ description: 'Headers as key-value pairs' })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string | number | boolean>;
}
