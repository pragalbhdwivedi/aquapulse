import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { FarmingGuard } from "./farming.guard";
import { FarmingService } from "./farming.service";

type FarmRequest = { farmActor: string };
@Controller("farming")
@UseGuards(FarmingGuard)
export class FarmingController {
  constructor(
    @Inject(FarmingService) private readonly farming: FarmingService,
  ) {}
  @Get("workspace") async workspace(@Req() request: FarmRequest) {
    return { ok: true, data: await this.farming.view(request.farmActor) };
  }
  @Get("photos/:id") async photo(
    @Req() request: FarmRequest,
    @Param("id") id: string,
  ) {
    return { ok: true, data: await this.farming.photo(request.farmActor, id) };
  }
  @Post("legal-entities/:id/configure") async configure(
    @Req() request: FarmRequest,
    @Param("id") id: string,
    @Body() input: unknown,
  ) {
    return {
      ok: true,
      data: await this.farming.configureErpCompany(
        request.farmActor,
        id,
        input,
      ),
    };
  }
  @Post("cycles/:id/close") async close(
    @Req() request: FarmRequest,
    @Param("id") id: string,
    @Body() input: unknown,
  ) {
    return {
      ok: true,
      data: await this.farming.closeCycle(request.farmActor, id, input),
    };
  }
  @Post("erp-jobs/:id/dispatch") async dispatch(
    @Req() request: FarmRequest,
    @Param("id") id: string,
  ) {
    return {
      ok: true,
      data: await this.farming.dispatchErp(request.farmActor, id),
    };
  }
  @Post(":resource/:id/decision") async decide(
    @Req() request: FarmRequest,
    @Param("resource") resource: string,
    @Param("id") id: string,
    @Body() input: unknown,
  ) {
    return {
      ok: true,
      data: await this.farming.decide(request.farmActor, resource, id, input),
    };
  }
  @Post(":resource") async create(
    @Req() request: FarmRequest,
    @Param("resource") resource: string,
    @Body() input: unknown,
  ) {
    return {
      ok: true,
      data: await this.farming.create(request.farmActor, resource, input),
    };
  }
}
