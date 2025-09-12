import { Controller, Post, Body, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { K6Service } from './k6.service';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { CreateTestDto } from './dto';

@ApiTags('k6-tests')
@Controller('k6')
export class K6Controller {
  constructor(private readonly k6Service: K6Service) {}

  @Post('run')
  @ApiOperation({
    summary: 'Run a dynamic k6 load test',
    description:
      'This endpoint generates a k6 script dynamically from the provided parameters, executes the load test, and returns the HTML report as a downloadable file.',
  })
  @ApiBody({
    description: 'Load test configuration',
    type: CreateTestDto,
  })
  @ApiResponse({
    status: 200,
    description: 'HTML report generated successfully',
    content: {
      'text/html': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to run k6 test',
  })
  async runTest(@Body() dto: CreateTestDto, @Res() res: Response) {
    try {
      const htmlReport = await this.k6Service.runTest(dto);

      res.set({
        'Content-Type': 'text/html',
        'Content-Disposition': 'attachment; filename="k6-report.html"',
      });
      res.send(htmlReport);
    } catch (error) {
      console.error(error);
      throw new HttpException(
        'Failed to execute k6 test. See server logs for details.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
