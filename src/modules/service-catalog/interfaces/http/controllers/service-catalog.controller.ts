import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    Delete,
    UseGuards
} from '@nestjs/common';
import {
    ApiBody,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
    ApiBearerAuth
} from '@nestjs/swagger';
import { CreateServiceCatalogDto } from '../../../application/dto/create-service-catalog.dto';
import { ServiceCatalogResponseDto } from '../../../application/dto/service-catalog-response.dto';
import { UpdateServiceCatalogDto } from '../../../application/dto/update-service-catalog.dto';
import { CreateServiceCatalogUseCase } from '../../../application/use-cases/create-service-catalog.use-case';
import { GetServiceCatalogUseCase } from '../../../application/use-cases/get-service-catalog.use-case';
import { ListServiceCatalogUseCase } from '../../../application/use-cases/list-service-catalog.use-case';
import { UpdateServiceCatalogUseCase } from '../../../application/use-cases/update-service-catalog.use-case';
import { DeleteServiceCatalogUseCase } from '../../../application/use-cases/delete-service-catalog.use-case';
import { JwtAuthGuard } from '../../../../auth/jwt-auth.guard';
import { RolesGuard } from '../../../../auth/roles.guard';
import { Roles } from '../../../../auth/roles.decorator';

@ApiTags('service-catalog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('service-catalog')
export class ServiceCatalogController {
    constructor(
        private readonly createServiceCatalogUseCase: CreateServiceCatalogUseCase,
        private readonly getServiceCatalogUseCase: GetServiceCatalogUseCase,
        private readonly listServiceCatalogUseCase: ListServiceCatalogUseCase,
        private readonly updateServiceCatalogUseCase: UpdateServiceCatalogUseCase,
        private readonly deleteServiceCatalogUseCase: DeleteServiceCatalogUseCase,
    ) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Criar serviço' })
    @ApiBody({ type: CreateServiceCatalogDto })
    @ApiResponse({ status: 201, description: 'Service created successfully.' })
    async create(@Body() body: CreateServiceCatalogDto): Promise<{ id: string }> {
        return this.createServiceCatalogUseCase.execute(body);
    }

    @Get()
    @ApiOperation({ summary: 'Listar serviços' })
    @ApiResponse({
        status: 200,
        description: 'Services retrieved successfully.',
        type: [ServiceCatalogResponseDto],
    })
    async findAll(): Promise<ServiceCatalogResponseDto[]> {
        return this.listServiceCatalogUseCase.execute();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Buscar serviço por id' })
    @ApiParam({
        name: 'id',
        required: true,
        description: 'Service id (UUID)',
    })
    @ApiResponse({
        status: 200,
        description: 'Service retrieved successfully.',
        type: ServiceCatalogResponseDto,
    })
    async findById(@Param('id') id: string): Promise<ServiceCatalogResponseDto> {
        return this.getServiceCatalogUseCase.execute(id);
    }

    @Patch(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Atualizar serviço' })
    @ApiParam({
        name: 'id',
        required: true,
        description: 'Service id (UUID)',
    })
    @ApiBody({ type: UpdateServiceCatalogDto })
    @ApiResponse({ status: 204, description: 'Service updated successfully.' })
    async update(@Param('id') id: string, @Body() body: UpdateServiceCatalogDto): Promise<void> {
        await this.updateServiceCatalogUseCase.execute(id, body);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Excluir (desativar) serviço' })
    @ApiParam({
        name: 'id',
        required: true,
        description: 'Service id (UUID)',
    })
    @ApiResponse({ status: 204, description: 'Service deleted successfully.' })
    async delete(@Param('id') id: string): Promise<void> {
        await this.deleteServiceCatalogUseCase.execute(id);
    }
}
