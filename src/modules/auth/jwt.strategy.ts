import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  // JWT_SECRET agora e compartilhado com oficina-lambda-auth (ver README):
  // o payload pode vir do login admin/admin deste servico ({sub: number, role})
  // ou do login por CPF emitido pela Lambda ({sub: string (uuid), document}).
  async validate(payload: {
    sub: number | string;
    role?: string;
    document?: string;
  }) {
    return {
      userId: payload.sub,
      role: payload.role,
      document: payload.document,
    };
  }
}
