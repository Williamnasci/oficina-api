import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

// Marca um endpoint como exigindo um role especifico (hoje so 'admin' existe).
// O token emitido pela Lambda de CPF (oficina-lambda-auth) nunca tem `role` no
// payload - so o login admin/admin deste servico tem. Sem essa marcacao, um
// endpoint com apenas JwtAuthGuard aceita QUALQUER token valido, inclusive o
// de um cliente, para operacoes administrativas.
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
