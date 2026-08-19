import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateServiceOrderDto } from '../../../application/dto/create-service-order.dto';
import { RegisterDiagnosisDto } from '../../../application/dto/register-diagnosis.dto';
import { CreateServiceOrderUseCase } from '../../../application/use-cases/create-service-order.use-case';
import { DeliverServiceOrderUseCase } from '../../../application/use-cases/deliver-service-order.use-case';
import { FinishServiceOrderUseCase } from '../../../application/use-cases/finish-service-order.use-case';
import { GetServiceOrderUseCase } from '../../../application/use-cases/get-service-order.use-case';
import { RegisterDiagnosisUseCase } from '../../../application/use-cases/register-diagnosis.use-case';
import { SendBudgetForApprovalUseCase } from '../../../application/use-cases/send-budget-for-approval.use-case';
import { StartServiceOrderExecutionUseCase } from '../../../application/use-cases/start-service-order-execution.use-case';
import { AddServiceToServiceOrderDto } from '../../../application/dto/add-service-to-service-order.dto';
import { AddServiceToServiceOrderUseCase } from '../../../application/use-cases/add-service-to-service-order.use-case';
import { AddStockItemToServiceOrderDto } from '../../../application/dto/add-stock-item-to-service-order.dto';
import { AddStockItemToServiceOrderUseCase } from '../../../application/use-cases/add-stock-item-to-service-order.use-case';
import { ApproveBudgetUseCase } from '../../../application/use-cases/approve-budget.use-case';
import { FindServiceOrdersByDocumentUseCase } from '../../../application/use-cases/find-service-orders-by-document.use-case';
import { GetAverageExecutionTimeUseCase } from '../../../application/use-cases/get-average-execution-time.use-case';
import { GetServiceOrderStatusUseCase } from '../../../application/use-cases/get-service-order-status.use-case';
import { HandleBudgetDecisionUseCase } from '../../../application/use-cases/handle-budget-decision.use-case';
import { ListOperationalServiceOrdersUseCase } from '../../../application/use-cases/list-operational-service-orders.use-case';
import { ListServiceOrdersUseCase } from '../../../application/use-cases/list-service-orders.use-case';
import { OpenServiceOrderUseCase } from '../../../application/use-cases/open-service-order.use-case';
import { BudgetDecisionDto } from '../../../application/dto/budget-decision.dto';
import { OpenServiceOrderDto } from '../../../application/dto/open-service-order.dto';
import { ServiceOrderDetailsResponseDto } from '../../../application/dto/service-order-details-response.dto';
import { ServiceOrderMetricsResponseDto } from '../../../application/dto/service-order-metrics-response.dto';
import { ServiceOrderResponseDto } from '../../../application/dto/service-order-response.dto';
import { ServiceOrderStatusResponseDto } from '../../../application/dto/service-order-status-response.dto';
import { JwtAuthGuard } from '../../../../auth/jwt-auth.guard';
import { RolesGuard } from '../../../../auth/roles.guard';
import { Roles } from '../../../../auth/roles.decorator';

@ApiTags('service-orders')
@Controller('service-orders')
export class ServiceOrdersController {
  constructor(
    private readonly createServiceOrderUseCase: CreateServiceOrderUseCase,
    private readonly getServiceOrderUseCase: GetServiceOrderUseCase,
    private readonly registerDiagnosisUseCase: RegisterDiagnosisUseCase,
    private readonly sendBudgetForApprovalUseCase: SendBudgetForApprovalUseCase,
    private readonly startServiceOrderExecutionUseCase: StartServiceOrderExecutionUseCase,
    private readonly finishServiceOrderUseCase: FinishServiceOrderUseCase,
    private readonly deliverServiceOrderUseCase: DeliverServiceOrderUseCase,
    private readonly addServiceToServiceOrderUseCase: AddServiceToServiceOrderUseCase,
    private readonly addStockItemToServiceOrderUseCase: AddStockItemToServiceOrderUseCase,
    private readonly approveBudgetUseCase: ApproveBudgetUseCase,
    private readonly findServiceOrdersByDocumentUseCase: FindServiceOrdersByDocumentUseCase,
    private readonly getAverageExecutionTimeUseCase: GetAverageExecutionTimeUseCase,
    private readonly getServiceOrderStatusUseCase: GetServiceOrderStatusUseCase,
    private readonly handleBudgetDecisionUseCase: HandleBudgetDecisionUseCase,
    private readonly listOperationalServiceOrdersUseCase: ListOperationalServiceOrdersUseCase,
    private readonly listServiceOrdersUseCase: ListServiceOrdersUseCase,
    private readonly openServiceOrderUseCase: OpenServiceOrderUseCase,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar ordem de serviço' })
  @ApiBody({ type: CreateServiceOrderDto })
  @ApiResponse({
    status: 201,
    description: 'Service order created successfully.',
  })
  async create(@Body() body: CreateServiceOrderDto): Promise<{ id: string }> {
    return this.createServiceOrderUseCase.execute(body);
  }

  @Post('opening')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Abrir ordem de servico com cliente, veiculo, servicos e pecas',
  })
  @ApiBody({ type: OpenServiceOrderDto })
  @ApiResponse({
    status: 201,
    description: 'Service order opened successfully.',
  })
  async open(@Body() body: OpenServiceOrderDto): Promise<{ id: string }> {
    return this.openServiceOrderUseCase.execute(body);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({
    summary: 'Buscar ordens de serviço por documento do cliente (CPF/CNPJ)',
  })
  @ApiQuery({
    name: 'document',
    required: false,
    description: 'Customer CPF or CNPJ',
    example: '52998224725',
  })
  @ApiResponse({
    status: 200,
    description: 'Service orders retrieved successfully.',
    type: [ServiceOrderResponseDto],
  })
  async findAll(
    @Query('document') document?: string,
  ): Promise<ServiceOrderResponseDto[] | ServiceOrderDetailsResponseDto[]> {
    if (!document) {
      return this.listServiceOrdersUseCase.execute();
    }

    return this.findServiceOrdersByDocumentUseCase.execute(document);
  }

  @Get('operational-queue')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({
    summary: 'Listar ordens de servico operacionais por prioridade',
  })
  @ApiResponse({
    status: 200,
    description: 'Operational service orders retrieved successfully.',
    type: [ServiceOrderResponseDto],
  })
  async listOperationalQueue(): Promise<ServiceOrderResponseDto[]> {
    return this.listOperationalServiceOrdersUseCase.execute();
  }

  @Get('metrics/average-execution-time')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({
    summary: 'Consultar tempo médio de execução das ordens de serviço',
  })
  @ApiResponse({
    status: 200,
    description: 'Average execution time retrieved successfully.',
    type: ServiceOrderMetricsResponseDto,
  })
  async getAverageExecutionTime(): Promise<ServiceOrderMetricsResponseDto> {
    return this.getAverageExecutionTimeUseCase.execute();
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Buscar ordem de serviço por id com itens' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Service order id (UUID)',
    example: 'e3b5c409-81d7-48df-8caf-627c467b8711',
  })
  @ApiResponse({
    status: 200,
    description: 'Service order retrieved successfully.',
    type: ServiceOrderDetailsResponseDto,
  })
  async findById(
    @Param('id') id: string,
  ): Promise<ServiceOrderDetailsResponseDto> {
    return this.getServiceOrderUseCase.execute(id);
  }

  @Get(':id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  // Sem @Roles('admin') de proposito: e a consulta de status que o PDF
  // descreve como acessivel ao cliente com o JWT emitido pela Lambda
  // (login por CPF), nao so pelo admin do back-office.
  @ApiOperation({ summary: 'Consultar status da ordem de servico' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Service order id (UUID)',
    example: 'e3b5c409-81d7-48df-8caf-627c467b8711',
  })
  @ApiResponse({
    status: 200,
    description: 'Service order status retrieved successfully.',
    type: ServiceOrderStatusResponseDto,
  })
  async getStatus(
    @Param('id') id: string,
  ): Promise<ServiceOrderStatusResponseDto> {
    return this.getServiceOrderStatusUseCase.execute(id);
  }

  @Patch(':id/diagnosis')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Registrar diagnóstico' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Service order id (UUID)',
    example: 'e3b5c409-81d7-48df-8caf-627c467b8711',
  })
  @ApiBody({ type: RegisterDiagnosisDto })
  @ApiResponse({
    status: 204,
    description: 'Diagnosis registered successfully.',
  })
  async registerDiagnosis(
    @Param('id') id: string,
    @Body() body: RegisterDiagnosisDto,
  ): Promise<void> {
    await this.registerDiagnosisUseCase.execute(id, body);
  }

  @Post(':id/services')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Adicionar serviço' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Service order id (UUID)',
    example: 'e3b5c409-81d7-48df-8caf-627c467b8711',
  })
  @ApiBody({ type: AddServiceToServiceOrderDto })
  @ApiResponse({
    status: 204,
    description: 'Service added to service order successfully.',
  })
  async addService(
    @Param('id') id: string,
    @Body() body: AddServiceToServiceOrderDto,
  ): Promise<void> {
    await this.addServiceToServiceOrderUseCase.execute(id, body);
  }

  @Post(':id/stock-items')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Adicionar peça' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Service order id (UUID)',
    example: 'e3b5c409-81d7-48df-8caf-627c467b8711',
  })
  @ApiBody({ type: AddStockItemToServiceOrderDto })
  @ApiResponse({
    status: 204,
    description: 'Stock item added to service order successfully.',
  })
  async addStockItem(
    @Param('id') id: string,
    @Body() body: AddStockItemToServiceOrderDto,
  ): Promise<void> {
    await this.addStockItemToServiceOrderUseCase.execute(id, body);
  }

  @Patch(':id/send-budget')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Enviar orçamento' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Service order id (UUID)',
    example: 'e3b5c409-81d7-48df-8caf-627c467b8711',
  })
  @ApiResponse({
    status: 204,
    description: 'Budget sent for approval successfully.',
  })
  async sendBudget(@Param('id') id: string): Promise<void> {
    await this.sendBudgetForApprovalUseCase.execute(id);
  }

  @Patch(':id/approve-budget')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Aprovar orçamento' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Service order id (UUID)',
    example: 'e3b5c409-81d7-48df-8caf-627c467b8711',
  })
  @ApiResponse({ status: 204, description: 'Budget approved successfully.' })
  async approveBudget(@Param('id') id: string): Promise<void> {
    await this.approveBudgetUseCase.execute(id);
  }

  @Post(':id/budget-decision')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Receber decisao externa de orcamento' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Service order id (UUID)',
    example: 'e3b5c409-81d7-48df-8caf-627c467b8711',
  })
  @ApiBody({ type: BudgetDecisionDto })
  @ApiResponse({
    status: 204,
    description: 'Budget decision processed successfully.',
  })
  async handleBudgetDecision(
    @Param('id') id: string,
    @Body() body: BudgetDecisionDto,
  ): Promise<void> {
    await this.handleBudgetDecisionUseCase.execute(id, body);
  }

  @Patch(':id/finish')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Finalizar serviço' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Service order id (UUID)',
    example: 'e3b5c409-81d7-48df-8caf-627c467b8711',
  })
  @ApiResponse({
    status: 204,
    description: 'Service order finished successfully.',
  })
  async finish(@Param('id') id: string): Promise<void> {
    await this.finishServiceOrderUseCase.execute(id);
  }

  @Patch(':id/deliver')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Entregar veículo' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Service order id (UUID)',
    example: 'e3b5c409-81d7-48df-8caf-627c467b8711',
  })
  @ApiResponse({
    status: 204,
    description: 'Service order delivered successfully.',
  })
  async deliver(@Param('id') id: string): Promise<void> {
    await this.deliverServiceOrderUseCase.execute(id);
  }

  @Patch(':id/start-execution')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Iniciar execução da ordem de serviço' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Service order id (UUID)',
    example: 'e3b5c409-81d7-48df-8caf-627c467b8711',
  })
  @ApiResponse({
    status: 204,
    description: 'Service order execution started successfully.',
  })
  async startExecution(@Param('id') id: string): Promise<void> {
    await this.startServiceOrderExecutionUseCase.execute(id);
  }
}
