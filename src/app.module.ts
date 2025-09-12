import { Module } from '@nestjs/common';
import { K6Module } from './k6/k6.module';
import { TemplateModule } from './template/template.module';

@Module({
  imports: [K6Module, TemplateModule]
})
export class AppModule {}
