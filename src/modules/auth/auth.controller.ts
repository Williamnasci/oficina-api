import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  @Post('login')
  @ApiOperation({ summary: 'Fazer login como administrador' })
  async login(@Body() loginDto: LoginDto) {
    const demoUsername = this.configService.get<string>('AUTH_DEMO_USERNAME', 'admin');
    // Sem fallback: um AUTH_DEMO_PASSWORD ausente deve falhar alto, nao aceitar
    // silenciosamente uma senha fraca conhecida ("admin") como valida.
    const demoPassword = this.configService.getOrThrow<string>('AUTH_DEMO_PASSWORD');

    if (loginDto.username === demoUsername && loginDto.password === demoPassword) {
      const payload = { sub: 1, role: 'admin' };
      return {
        access_token: this.jwtService.sign(payload),
      };
    }
    throw new UnauthorizedException('Invalid credentials');
  }
}
