import { Module } from "@nestjs/common";
import { K6Service } from "./k6.service";
import { K6Controller } from "./k6.controller";
import { TemplateModule } from "src/template/template.module";

@Module({
    imports:[TemplateModule],
    providers:[K6Service],
    controllers:[K6Controller],
})
export class K6Module{}