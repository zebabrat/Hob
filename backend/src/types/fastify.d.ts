import type { UserDto } from '@hob/shared';

declare module 'fastify' {
  interface FastifyRequest {
    /** Set by the requireSession preHandler; absent on public routes. */
    currentUser?: UserDto;
  }
}
