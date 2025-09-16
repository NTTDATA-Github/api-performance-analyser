import { IsString, IsOptional, IsNumber, IsObject, IsEnum, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}

export enum TestType {
  REST = 'REST',
  GRAPHQL = 'GRAPHQL',
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
    enum: TestType,
    description: 'Type of API test (REST or GraphQL)',
    example: TestType.REST,
    default: TestType.REST,
  })
  @IsOptional()
  @IsEnum(TestType)
  testType?: TestType = TestType.REST;

  @ApiPropertyOptional({
    description: 'Headers to send with the request. Content-Type will be auto-detected if not provided.',
    example: { 
      Authorization: 'Bearer xyz123', 
      'X-API-Key': 'your-api-key',
      'Content-Type': 'application/json'
    },
  })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Request body for POST/PUT/PATCH requests. Can be JSON object, GraphQL query, or string',
    examples: {
      restJson: {
        summary: 'REST JSON payload',
        value: '{"name": "John Doe", "email": "john@example.com", "age": 30}'
      },
      graphqlQuery: {
        summary: 'GraphQL Query',
        value: '{"query": "query GetUsers { users { id name email } }"}'
      },
      graphqlMutation: {
        summary: 'GraphQL Mutation',
        value: '{"query": "mutation CreateUser($input: UserInput!) { createUser(input: $input) { id name } }", "variables": {"input": {"name": "Jane", "email": "jane@example.com"}}}'
      },
      plainText: {
        summary: 'Plain text body',
        value: 'Simple text payload'
      }
    }
  })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({
    description: 'Number of virtual users (VUs) to simulate concurrently',
    example: 10,
    minimum: 1,
    maximum: 1000,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(1000)
  vus?: number = 1;

  @ApiPropertyOptional({
    description: 'Duration of the test in k6 format (e.g., "30s", "2m", "1h")',
    example: '30s',
    default: '30s',
  })
  @IsOptional()
  @IsString()
  duration?: string = '30s';

  @ApiPropertyOptional({
    description: 'Enable debug logging during test execution',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  debug?: boolean = false;

  @ApiPropertyOptional({
    description: 'Custom name for the test (used in reports)',
    example: 'User API Load Test',
  })
  @IsOptional()
  @IsString()
  testName?: string;

  @ApiPropertyOptional({
    description: 'Custom thresholds for the test in k6 format',
    example: {
      'http_req_duration': ['p(95)<1000'],
      'http_req_failed': ['rate<0.05'],
      'checks': ['rate>0.99']
    },
  })
  @IsOptional()
  @IsObject()
  thresholds?: Record<string, string[]>;

  @ApiPropertyOptional({
    description: 'Sleep time between iterations in seconds',
    example: 1,
    minimum: 0,
    maximum: 60,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(60)
  sleepDuration?: number;
}

// Additional DTO for GraphQL-specific testing
export class GraphQLTestDto extends CreateTestDto {
  @ApiProperty({
    description: 'GraphQL query string',
    example: 'query GetUsers { users { id name email } }',
  })
  @IsString()
  query: string;

  @ApiPropertyOptional({
    description: 'GraphQL variables as JSON object',
    example: { userId: 123, limit: 10 },
  })
  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'GraphQL operation name',
    example: 'GetUsers',
  })
  @IsOptional()
  @IsString()
  operationName?: string;
}

// DTO for batch testing multiple endpoints
export class BatchTestDto {
  @ApiProperty({
    description: 'Array of test configurations to run sequentially',
    type: [CreateTestDto],
  })
  tests: CreateTestDto[];

  @ApiPropertyOptional({
    description: 'Run tests in parallel instead of sequentially',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  parallel?: boolean = false;

  @ApiPropertyOptional({
    description: 'Global settings that apply to all tests',
    example: {
      baseHeaders: { 'Authorization': 'Bearer xyz123' },
      baseUrl: 'https://api.example.com'
    },
  })
  @IsOptional()
  @IsObject()
  globalSettings?: {
    baseHeaders?: Record<string, string>;
    baseUrl?: string;
    defaultVUs?: number;
    defaultDuration?: string;
  };
}