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
    UseGuards,
} from '@nestjs/common';
import {
    ApiBody,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateVehicleDto } from '../../../application/dto/create-vehicle.dto';
import { UpdateVehicleDto } from '../../../application/dto/update-vehicle.dto';
import { VehicleResponseDto } from '../../../application/dto/vehicle-response.dto';
import { CreateVehicleUseCase } from '../../../application/use-cases/create-vehicle.use-case';
import { GetVehicleUseCase } from '../../../application/use-cases/get-vehicle.use-case';
import { ListVehiclesUseCase } from '../../../application/use-cases/list-vehicles.use-case';
import { UpdateVehicleUseCase } from '../../../application/use-cases/update-vehicle.use-case';
import { DeleteVehicleUseCase } from '../../../application/use-cases/delete-vehicle.use-case';
import { JwtAuthGuard } from '../../../../auth/jwt-auth.guard';
import { RolesGuard } from '../../../../auth/roles.guard';
import { Roles } from '../../../../auth/roles.decorator';

@ApiTags('vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('vehicles')
export class VehiclesController {
    constructor(
        private readonly createVehicleUseCase: CreateVehicleUseCase,
        private readonly getVehicleUseCase: GetVehicleUseCase,
        private readonly listVehiclesUseCase: ListVehiclesUseCase,
        private readonly updateVehicleUseCase: UpdateVehicleUseCase,
        private readonly deleteVehicleUseCase: DeleteVehicleUseCase,
    ) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Criar veículo' })
    @ApiBody({ type: CreateVehicleDto })
    @ApiResponse({ status: 201, description: 'Vehicle created successfully.' })
    async create(@Body() body: CreateVehicleDto): Promise<{ id: string }> {
        return this.createVehicleUseCase.execute(body);
    }

    @Get()
    @ApiOperation({ summary: 'Listar veículos' })
    @ApiResponse({
        status: 200,
        description: 'Vehicles retrieved successfully.',
        type: [VehicleResponseDto],
    })
    async findAll(): Promise<VehicleResponseDto[]> {
        return this.listVehiclesUseCase.execute();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Buscar veículo por id' })
    @ApiParam({
        name: 'id',
        required: true,
        description: 'Vehicle id (UUID)',
    })
    @ApiResponse({
        status: 200,
        description: 'Vehicle retrieved successfully.',
        type: VehicleResponseDto,
    })
    async findById(@Param('id') id: string): Promise<VehicleResponseDto> {
        return this.getVehicleUseCase.execute(id);
    }

    @Patch(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Atualizar veículo' })
    @ApiParam({
        name: 'id',
        required: true,
        description: 'Vehicle id (UUID)',
    })
    @ApiBody({ type: UpdateVehicleDto })
    @ApiResponse({ status: 204, description: 'Vehicle updated successfully.' })
    async update(@Param('id') id: string, @Body() body: UpdateVehicleDto): Promise<void> {
        await this.updateVehicleUseCase.execute(id, body);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Excluir (desativar) veículo' })
    @ApiParam({
        name: 'id',
        required: true,
        description: 'Vehicle id (UUID)',
    })
    @ApiResponse({ status: 204, description: 'Vehicle deleted successfully.' })
    async delete(@Param('id') id: string): Promise<void> {
        await this.deleteVehicleUseCase.execute(id);
    }
}
