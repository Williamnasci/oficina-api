import {
  Body,
  Controller,
  Delete,
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
import { CreateCustomerDto } from '../../../application/dto/create-customer.dto';
import { UpdateCustomerDto } from '../../../application/dto/update-customer.dto';
import { CustomerResponseDto } from '../../../application/dto/customer-response.dto';
import { CreateCustomerUseCase } from '../../../application/use-cases/create-customer.use-case';
import { GetCustomerUseCase } from '../../../application/use-cases/get-customer.use-case';
import { ListCustomersUseCase } from '../../../application/use-cases/list-customers.use-case';
import { FindCustomerByDocumentUseCase } from '../../../application/use-cases/find-customer-by-document.use-case';
import { UpdateCustomerUseCase } from '../../../application/use-cases/update-customer.use-case';
import { DeleteCustomerUseCase } from '../../../application/use-cases/delete-customer.use-case';
import { JwtAuthGuard } from '../../../../auth/jwt-auth.guard';
import { RolesGuard } from '../../../../auth/roles.guard';
import { Roles } from '../../../../auth/roles.decorator';

@ApiTags('customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('customers')
export class CustomersController {
  constructor(
    private readonly createCustomerUseCase: CreateCustomerUseCase,
    private readonly getCustomerUseCase: GetCustomerUseCase,
    private readonly listCustomersUseCase: ListCustomersUseCase,
    private readonly findCustomerByDocumentUseCase: FindCustomerByDocumentUseCase,
    private readonly updateCustomerUseCase: UpdateCustomerUseCase,
    private readonly deleteCustomerUseCase: DeleteCustomerUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar cliente' })
  @ApiBody({ type: CreateCustomerDto })
  @ApiResponse({ status: 201, description: 'Customer created successfully.' })
  async create(@Body() body: CreateCustomerDto): Promise<{ id: string }> {
    return this.createCustomerUseCase.execute(body);
  }

  @Get()
  @ApiOperation({ summary: 'Listar clientes ou buscar por documento' })
  @ApiQuery({
    name: 'document',
    required: false,
    description: 'CPF or CNPJ to search for a specific customer',
    example: '52998224725',
  })
  @ApiResponse({
    status: 200,
    description: 'Customers retrieved successfully.',
    type: [CustomerResponseDto],
  })
  async findAll(
    @Query('document') document?: string,
  ): Promise<CustomerResponseDto | CustomerResponseDto[]> {
    if (document) {
      return this.findCustomerByDocumentUseCase.execute(document);
    }

    return this.listCustomersUseCase.execute();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar cliente por id' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Customer id (UUID)',
  })
  @ApiResponse({
    status: 200,
    description: 'Customer retrieved successfully.',
    type: CustomerResponseDto,
  })
  async findById(@Param('id') id: string): Promise<CustomerResponseDto> {
    return this.getCustomerUseCase.execute(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Atualizar cliente' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Customer id (UUID)',
  })
  @ApiBody({ type: UpdateCustomerDto })
  @ApiResponse({ status: 204, description: 'Customer updated successfully.' })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateCustomerDto,
  ): Promise<void> {
    await this.updateCustomerUseCase.execute(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir (desativar) cliente' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Customer id (UUID)',
  })
  @ApiResponse({ status: 204, description: 'Customer deleted successfully.' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteCustomerUseCase.execute(id);
  }
}
