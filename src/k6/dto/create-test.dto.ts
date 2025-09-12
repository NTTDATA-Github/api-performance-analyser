import { IsString, IsOptional, IsNumber, IsObject, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}

export class CreateTestDto {
  @ApiProperty({
    description: 'The full URL of the target API to test',
    example: 'https://api.example.com/users',
  })
  @IsString()
  url: string;

  @ApiProperty({
    enum: HttpMethod,
    description: 'HTTP method to use for the request',
    example: HttpMethod.GET,
  })
  @IsEnum(HttpMethod)
  method: HttpMethod;

  @ApiPropertyOptional({
    description: 'Optional headers to send with the request',
    example: { Authorization: 'Bearer xyz', 'Content-Type': 'application/json' },
  })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Optional JSON string body for POST/PUT/PATCH requests',
    example: '{"name": "John", "age": 30}',
  })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({
    description: 'Number of virtual users (VUs) to simulate',
    example: 5,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  vus?: number;

  @ApiPropertyOptional({
    description: 'Duration of the test (k6 format, e.g., 30s, 1m)',
    example: '30s',
    default: '30s',
  })
  @IsOptional()
  @IsString()
  duration?: string;
}
