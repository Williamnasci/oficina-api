import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../../../src/modules/auth/roles.guard';

describe('RolesGuard', () => {
    let reflector: jest.Mocked<Reflector>;
    let guard: RolesGuard;

    const buildContext = (user: unknown): ExecutionContext => ({
        getHandler: () => ({}) as any,
        getClass: () => ({}) as any,
        switchToHttp: () => ({
            getRequest: () => ({ user }),
        }),
    }) as unknown as ExecutionContext;

    beforeEach(() => {
        reflector = { getAllAndOverride: jest.fn() } as unknown as jest.Mocked<Reflector>;
        guard = new RolesGuard(reflector);
    });

    it('should allow when the endpoint has no @Roles requirement', () => {
        reflector.getAllAndOverride.mockReturnValue(undefined);

        expect(guard.canActivate(buildContext(undefined))).toBe(true);
    });

    it('should allow when the token role matches the requirement', () => {
        reflector.getAllAndOverride.mockReturnValue(['admin']);

        expect(guard.canActivate(buildContext({ role: 'admin' }))).toBe(true);
    });

    it('should reject a token without role (e.g. customer JWT from the CPF login Lambda)', () => {
        reflector.getAllAndOverride.mockReturnValue(['admin']);

        expect(() => guard.canActivate(buildContext({ document: '11144477735' }))).toThrow(
            ForbiddenException,
        );
    });

    it('should reject a role that does not match the requirement', () => {
        reflector.getAllAndOverride.mockReturnValue(['admin']);

        expect(() => guard.canActivate(buildContext({ role: 'customer' }))).toThrow(
            ForbiddenException,
        );
    });
});
