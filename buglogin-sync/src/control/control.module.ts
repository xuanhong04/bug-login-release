import { Module } from "@nestjs/common";
import { ControlAuthGuard } from "./control-auth.guard.js";
import { ControlController } from "./control.controller.js";
import { ControlService } from "./control.service.js";

@Module({
  controllers: [ControlController],
  providers: [ControlService, ControlAuthGuard],
})
export class ControlModule {}
