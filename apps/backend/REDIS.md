# Step-by-Step Guide: Integrating Redis with the Backend

## Overview

This guide explains how to integrate Redis as a caching and session management solution into the existing backend architecture, following the Hexagonal Architecture (Ports & Adapters) pattern already established in the project.

## Prerequisites

- Docker installed (for running Redis locally)
- Understanding of the backend's Hexagonal Architecture structure
- Familiarity with the existing ports and adapters pattern

---

## Step 1: Install and Run Redis

### Option A: Using Docker (Recommended for Development)

1. **Add Redis to `docker-compose.yml`** in `apps/backend/`:
   - Add a Redis service alongside the existing services
   - Expose port 6379 (default Redis port)
   - Configure volume for data persistence
   - Set a password for security

2. **Start Redis container**:
   - Run `docker-compose up -d redis`
   - Verify it's running: `docker ps`

### Option B: Using Homebrew (macOS)

1. Install: `brew install redis`
2. Start service: `brew services start redis`
3. Verify: `redis-cli ping` (should return "PONG")

---

## Step 2: Install Redis Client Libraries

1. **Add dependencies to `apps/backend/package.json`**:
   - `redis` - Official Node.js Redis client (v4+ includes TypeScript type definitions; no separate `@types/redis` package is needed)
2. **Run installation**:
   - Execute `pnpm install` from `apps/backend/`

---

## Step 3: Define the Cache Port (Application/Ports)

Following the ports and adapters pattern, create an abstraction for caching:

1. **Create `src/application/ports/cache.port.ts`**:
   - Define interface with methods: `get()`, `set()`, `delete()`, `exists()`, `clear()`
   - Add optional TTL (Time To Live) parameter
   - Include type generics for type-safe caching
   - Keep it framework-agnostic (no Redis-specific details)

2. **Key methods to include**:
   - `get<T>(key: string): Promise<T | null>`
   - `set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>`
   - `delete(key: string): Promise<void>`
   - `exists(key: string): Promise<boolean>`
   - `clear(pattern?: string): Promise<void>`

---

## Step 4: Implement Redis Adapter (Secondary Adapter)

Create the concrete implementation that fulfills the cache port:

1. **Create `src/infrastructure/cache/redis.cache.adapter.ts`**:
   - Import the Redis client library
   - Implement the `CachePort` interface
   - Handle Redis connection logic
   - Add error handling and logging
   - Implement serialization/deserialization for complex objects

2. **Connection management**:
   - Create singleton pattern for Redis client
   - Handle connection errors gracefully
   - Implement reconnection logic
   - Add health check method

3. **Serialization strategy**:
   - Use `JSON.stringify()` for storing objects
   - Use `JSON.parse()` for retrieving objects
   - Handle primitive types appropriately
   - Consider edge cases (undefined, null, Date objects)

---

## Step 5: Configure Redis Connection

1. **Add environment variables to `apps/backend/.env`**:
   - `REDIS_HOST` - Host address (localhost for dev)
   - `REDIS_PORT` - Port number (6379 by default)
   - `REDIS_PASSWORD` - Password (if authentication enabled)
   - `REDIS_DB` - Database number (0-15, default 0)
   - `REDIS_TTL` - Default TTL in seconds

2. **Add to `.env.example`** for documentation

3. **Create configuration file `src/infrastructure/config/redis.config.ts`**:
   - Load environment variables
   - Provide defaults for development
   - Validate required configuration
   - Export typed configuration object

---

## Step 6: Update Dependency Injection

Modify the application's dependency injection setup:

1. **In `src/infrastructure/di/container.ts` (or equivalent)**:
   - Instantiate Redis cache adapter
   - Register it as a singleton
   - Make it available for injection into use cases

2. **Update use case constructors**:
   - Add `CachePort` parameter where caching is needed
   - Inject the Redis adapter implementation
   - Keep use cases agnostic to Redis implementation

---

## Step 7: Implement Caching in Use Cases

Apply caching to appropriate use cases:

1. **GetAllUsersUseCase** (good candidate for caching):
   - Check cache before querying database
   - Generate cache key from pagination params
   - Store results in cache with TTL
   - Invalidate cache on user modifications

2. **Cache key naming convention**:
   - Use namespaced keys: `users:all:limit:10:offset:0`
   - Include version numbers: `v1:users:all`
   - Be consistent across the application

3. **TTL strategy**:
   - Short TTL for frequently changing data (1-5 minutes)
   - Longer TTL for stable data (15-60 minutes)
   - Infinite TTL for static data with manual invalidation

---

## Step 8: Implement Cache Invalidation

Create a strategy for keeping cache fresh:

1. **Write-through invalidation**:
   - Clear relevant cache entries on CREATE operations
   - Clear relevant cache entries on UPDATE operations
   - Clear relevant cache entries on DELETE operations

2. **For RegisterUserUseCase, LoginUserUseCase, etc.**:
   - Inject `CachePort`
   - Clear user-related caches after modifications
   - Use pattern matching for bulk invalidation

3. **Cache warming** (optional):
   - Pre-populate cache with frequently accessed data
   - Implement background job for cache warming
   - Schedule during low-traffic periods

---

## Step 9: Add Health Checks

Ensure Redis availability is monitored:

1. **Create health check endpoint**:
   - Add `/health/redis` route in Fastify
   - Check Redis connection status
   - Return appropriate HTTP status codes

2. **Integration with existing health checks**:
   - Add Redis status to main `/health` endpoint
   - Include connection details (host, port)
   - Include error information if connection fails

---

## Step 10: Implement Session Management (Optional)

Use Redis for session storage:

1. **Session store adapter**:
   - Create `src/infrastructure/session/redis-session.adapter.ts`
   - Implement session creation, retrieval, deletion
   - Use appropriate TTL for session expiry

2. **Integration with authentication**:
   - Store JWT tokens or session IDs in Redis
   - Implement token blacklisting for logout
   - Support session refresh logic

3. **Session key structure**:
   - `session:{userId}:{sessionId}`
   - Store session metadata (IP, user agent, login time)

---

## Step 11: Testing Strategy

Create comprehensive tests for Redis integration:

1. **Unit tests for Redis adapter**:
   - Mock Redis client in tests
   - Test all CachePort methods
   - Test error handling scenarios
   - Test serialization/deserialization

2. **Integration tests**:
   - Use testcontainers to spin up real Redis instance
   - Test cache hit/miss scenarios
   - Test TTL expiration behavior
   - Test concurrent access patterns

3. **Test location**:
   - Unit tests: `test/infrastructure/cache/redis.cache.adapter.test.ts`
   - Integration tests: `test/integration/cache.integration.test.ts`

---

## Step 12: Performance Optimization

Optimize Redis usage for production:

1. **Connection pooling**:
   - Configure connection pool size
   - Reuse connections efficiently
   - Monitor connection metrics

2. **Pipeline operations**:
   - Batch multiple Redis commands
   - Reduce network round trips
   - Use for bulk cache warming

3. **Monitoring and metrics**:
   - Track cache hit/miss ratios
   - Monitor Redis memory usage
   - Set up alerts for connection failures

---

## Step 13: Error Handling and Fallbacks

Ensure application resilience:

1. **Graceful degradation**:
   - If Redis fails, fall back to direct database queries
   - Log Redis errors but don't crash the application
   - Return cached data even if stale during outages

2. **Circuit breaker pattern** (optional):
   - Stop trying Redis after consecutive failures
   - Automatically recover when Redis is back
   - Prevent cascading failures

---

## Step 14: Documentation

Document the Redis integration:

1. **Update DEVELOPMENT.md**:
   - Add Redis setup instructions
   - Document cache key patterns
   - Explain TTL strategies

2. **Add code comments**:
   - Document why specific data is cached
   - Explain cache invalidation logic
   - Note any Redis-specific optimizations

3. **Create Redis best practices doc**:
   - Similar to existing `POSTGRES_BEST_PRACTICES.md`
   - Include common pitfalls
   - Provide examples of cache patterns

---

## Common Use Cases in the Backend

### 1. **Caching Database Queries**

- GetAllUsersUseCase - Cache paginated user lists
- GetUserByIdUseCase - Cache individual user lookups
- Complex aggregations or reports

### 2. **Rate Limiting**

- Track API request counts per user
- Implement sliding window rate limiting
- Store rate limit violations

### 3. **Session Management**

- Store active user sessions
- Implement "remember me" functionality
- Track concurrent sessions per user

### 4. **Distributed Locks**

- Prevent duplicate processing
- Coordinate background jobs
- Implement idempotency keys

### 5. **Pub/Sub for Real-Time Features**

- Broadcast notifications
- Coordinate microservices
- Implement real-time updates

---

## Architecture Considerations

### Following Hexagonal Architecture (Ports & Adapters):

1. **Domain**: No Redis knowledge (pure business logic, center of hexagon)
2. **Application Ports**: Define `CachePort` interface (secondary/driven port)
3. **Secondary Adapter**: Implement Redis adapter (concrete implementation of CachePort)
4. **Primary Adapters**: HTTP controllers use application use cases that internally leverage cache through ports

### Benefits of This Approach:

- Easy to swap Redis for Memcached or another cache provider (replace adapter, keep port)
- Testable without actual Redis instance (mock the port interface)
- Clear separation of concerns following dependency rule (dependencies point inward: Adapters → Application → Domain)
- Adapters can be replaced without changing core logic

---

## Security Considerations

1. **Authentication**:
   - Always use password for production Redis
   - Consider TLS encryption for Redis connections

2. **Network Security**:
   - Don't expose Redis port publicly
   - Use Docker network isolation in development
   - Use VPC/private network in production

3. **Data Sensitivity**:
   - Don't cache sensitive data without encryption
   - Consider data residency requirements
   - Implement proper key expiration

---

## Monitoring and Maintenance

1. **Redis CLI commands for debugging**:
   - `redis-cli MONITOR` - Watch all commands in real-time
   - `redis-cli INFO` - Get Redis server statistics
   - `redis-cli KEYS pattern` - Find keys (avoid in production!)
   - `redis-cli TTL key` - Check time-to-live for a key

2. **Production monitoring**:
   - Use Redis built-in stats
   - Integrate with APM tools (New Relic, DataDog)
   - Set up alerts for memory usage, evictions

3. **Maintenance tasks**:
   - Regularly review cache hit ratios
   - Adjust TTLs based on usage patterns
   - Clean up stale key patterns

---

## Rollout Strategy

1. **Phase 1**: Add Redis infrastructure (no code changes)
2. **Phase 2**: Implement CachePort and Redis adapter
3. **Phase 3**: Add caching to one use case (proof of concept)
4. **Phase 4**: Gradually add caching to other use cases
5. **Phase 5**: Implement session management
6. **Phase 6**: Add advanced features (rate limiting, pub/sub)

This incremental approach minimizes risk and allows for learning and adjustment at each phase.

---

## Example Implementation Snippets

### CachePort Interface Example

```typescript
export interface CachePort {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>
  delete(key: string): Promise<void>
  exists(key: string): Promise<boolean>
  clear(pattern?: string): Promise<void>
  disconnect(): Promise<void>
}
```

### Redis Adapter Example Structure

```typescript
export class RedisCacheAdapter implements CachePort {
  private client: RedisClient

  constructor(config: RedisConfig, logger: LoggerPort) {
    // Initialize Redis client
  }

  async get<T>(key: string): Promise<T | null> {
    // Implementation with error handling
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    // Implementation with serialization
  }

  // ... other methods
}
```

### Use Case with Caching Example

```typescript
/**
 * Use case for retrieving all users with pagination support and caching
 *
 * This use case handles the business logic for fetching users from the repository,
 * checking the cache first for performance optimization, transforming domain entities
 * into DTOs, and returning paginated results.
 *
 * @class GetAllUsersUseCase
 * @example
 * ```typescript
 * const useCase = new GetAllUsersUseCase(userRepository, cache, logger)
 * const result = await useCase.execute({ limit: 10, offset: 0 })
 * ```
 */
export class GetAllUsersUseCase {
  /**
   * Creates an instance of GetAllUsersUseCase
   * @param {UserRepositoryPort} userRepository - Repository for accessing user data
   * @param {CachePort} cache - Cache port for storing and retrieving cached data
   * @param {LoggerPort} logger - Logger for tracking operations
   */
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly cache: CachePort,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Executes the get all users use case with caching
   *
   * Retrieves all users from cache if available, otherwise from the repository
   * with optional pagination parameters, transforms them into DTOs, caches the
   * result, and returns a paginated response.
   *
   * @param {PaginationParams} [params] - Optional pagination parameters (limit, offset)
   * @returns {Promise<PaginatedUsersDto>} Paginated list of users with metadata
   * @throws {Error} If the repository or cache operation fails
   * @example
   * ```typescript
   * // Get first 20 users
   * const result = await useCase.execute({ limit: 20, offset: 0 })
   *
   * // Get all users (default pagination)
   * const allUsers = await useCase.execute()
   * ```
   */
  async execute(params?: PaginationParams): Promise<PaginatedUsersDto> {
    this.logger.info('Fetching all users', { params })

    const cacheKey = `users:all:limit:${params?.limit || 10}:offset:${params?.offset || 0}`

    try {
      // Try cache first
      const cached = await this.cache.get<PaginatedUsersDto>(cacheKey)
      if (cached) {
        this.logger.info('Users loaded from cache', { cacheKey })
        return cached
      }

      // Cache miss - load from database
      this.logger.info('Cache miss - fetching from database', { cacheKey })
      const result = await this.userRepository.findAll(params)

      // Transform to DTOs
      const userDtos = result.data.map((user) => {
        if (!user.id) {
          throw new InternalErrorException('User ID is missing', {
            email: user.getEmail(),
          })
        }
        return {
          userId: user.id,
          email: user.getEmail(),
          name: user.getName(),
          role: user.getRole(),
          createdAt: user.getCreatedAt(),
        }
      })

      const response = {
        data: userDtos,
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      }

      // Store in cache with 5 minute TTL
      await this.cache.set(cacheKey, response, 300)

      this.logger.info('Successfully fetched and cached users', {
        count: userDtos.length,
        total: result.total,
        cacheKey,
      })

      return response
    } catch (error) {
      this.logger.error('Failed to fetch all users', error as Error)
      throw error
    }
  }
}
```

---

## Docker Compose Example

```yaml
services:
  redis:
    image: redis:7-alpine
    container_name: norberts-spark-redis
    ports:
      - '6379:6379'
    volumes:
      - redis-data:/data
    command: redis-server --requirepass yourpassword
    networks:
      - app-network
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 3s
      retries: 3

volumes:
  redis-data:

networks:
  app-network:
    driver: bridge
```

---

## Additional Resources

- [Redis Official Documentation](https://redis.io/documentation)
- [Node Redis Client Documentation](https://github.com/redis/node-redis)
- [Redis Best Practices](https://redis.io/docs/management/optimization/)
- [Caching Strategies](https://redis.io/docs/manual/patterns/)

---

## Troubleshooting

### Common Issues and Solutions

1. **Connection refused**:
   - Verify Redis is running: `docker ps` or `brew services list`
   - Check port availability: `lsof -i :6379`
   - Verify network configuration in Docker

2. **Authentication failed**:
   - Ensure password matches in `.env` and Redis config
   - Check Redis AUTH configuration

3. **Out of memory**:
   - Review Redis maxmemory configuration
   - Implement eviction policies
   - Adjust TTLs to reduce memory usage

4. **Slow performance**:
   - Check for large keys (use `redis-cli --bigkeys`)
   - Monitor slow queries (use `SLOWLOG`)
   - Consider connection pooling

---

## Next Steps

After completing this guide, you should:

1. Review and adjust cache TTLs based on actual usage patterns
2. Implement monitoring and alerting
3. Document cache invalidation strategies for your team
4. Consider advanced Redis features (Pub/Sub, Streams, etc.)
5. Plan for production deployment with high availability
