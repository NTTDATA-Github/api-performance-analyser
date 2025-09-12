import { Injectable } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TemplateService {
  private readonly templatesDir = path.join(__dirname, 'templates');

  /**
   * Compile a Handlebars template with the given name and context.
   */
  compile(templateName: string, context: Record<string, any>): string {
    const templatePath = path.join(this.templatesDir, templateName);
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }

    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    const template = Handlebars.compile(templateContent);

    return template(context);
  }
}
