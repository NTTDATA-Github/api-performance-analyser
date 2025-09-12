import { Injectable, Logger } from '@nestjs/common';
import { TemplateService } from '../template/template.service';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { CreateTestDto } from './dto';

@Injectable()
export class K6Service {
  private readonly logger = new Logger(K6Service.name);

  constructor(private readonly templateService: TemplateService) {}

  // A helper function to safely escape strings for JavaScript
  private escapeJavaScriptString(str: string): string {
    return str
      .replace(/\\/g, '\\\\') // Escapes backslashes
      .replace(/'/g, "\\'")   // Escapes single quotes
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      .replace(/\f/g, '\\f')
      .replace(/\v/g, '\\v')
      .replace(/\0/g, '\\0')
      .replace(/`/g, '\\`'); // Escape backticks
  }

  async runTest(dto: CreateTestDto): Promise<Buffer> {
    // Safely stringify and escape the JSON data to prevent syntax errors in the K6 script.
    const escapedHeaders = this.escapeJavaScriptString(JSON.stringify(dto.headers || {}));
    const escapedPayload = dto.body ? this.escapeJavaScriptString(JSON.stringify(JSON.parse(dto.body))) : 'null';
    this.logger.log('Generating k6 script content...');

    // Reports dir
    const reportsDir = path.join(__dirname, 'reports');
    fs.mkdirSync(reportsDir, { recursive: true });
    const htmlReportPath = path.join(reportsDir, 'result.html');
    this.logger.log(`Reports directory ensured: ${reportsDir}`);

    // Use TemplateService to generate script content
    const scriptContent = this.templateService.compile('k6-template.js.hbs', {
      url: dto.url,
      method: dto.method,
      headers: escapedHeaders,
      payload: escapedPayload,
      vus: dto.vus || 1,
      duration: dto.duration || '30s',
      reportPath: this.escapeJavaScriptString(htmlReportPath), // Pass the absolute report path to the template, ensuring backslashes are escaped
    });
    this.logger.debug(`Generated script content: \n${scriptContent}`);

    // Write temp script
    const tmpScriptPath = path.join(__dirname, `temp-script-${Date.now()}.js`);
    fs.writeFileSync(tmpScriptPath, scriptContent);
    this.logger.log(`Temporary k6 script written to: ${tmpScriptPath}`);

    // Run k6
    this.logger.log(`Executing k6 test from: ${tmpScriptPath}`);
    await new Promise<void>((resolve, reject) => {
      exec(`k6 run ${tmpScriptPath}`, (err, stdout, stderr) => {
        fs.unlinkSync(tmpScriptPath);
        this.logger.log(`Temporary k6 script deleted: ${tmpScriptPath}`);

        if (err) {
          this.logger.error(`k6 execution failed. Error: ${err.message}`);
          this.logger.error(`Generated script content was:\n\n${scriptContent}`);
          this.logger.error(`k6 stderr: ${stderr}`);
          return reject(new Error('k6 execution failed'));
        }
        this.logger.log('k6 test executed successfully.');
        this.logger.debug(`k6 stdout: ${stdout}`);
        this.logger.debug(`k6 stderr: ${stderr}`);
        resolve();
      });
    });

    // Read and return the generated HTML report
    if (fs.existsSync(htmlReportPath)) {
      this.logger.log(`HTML report found at: ${htmlReportPath}`);
      return fs.readFileSync(htmlReportPath);
    } else {
      this.logger.warn(`HTML report not found at: ${htmlReportPath}`);
      return Buffer.from('K6 test ran successfully, but no HTML report was generated.', 'utf-8');
    }
  }
}
