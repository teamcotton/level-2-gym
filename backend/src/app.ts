import Fastify, { FastifyInstance } from 'fastify';

export function buildApp(): FastifyInstance {
  const fastify = Fastify({
    logger: true,
  });

  // Declare routes
  fastify.get('/', async (_request, _reply) => {
    return { message: 'Level 2 Gym API' };
  });

  fastify.get('/health', async (_request, _reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  return fastify;
}
