# OpenAPI & Spectral Setup Complete ✅

## What's Been Added

### 1. OpenAPI Specification (`openapi.yaml`)

- **Version**: OpenAPI 3.1.0
- **Endpoints**: Root, health check, user registration, get user by ID
- **Schemas**: RegisterUserRequest, RegisterUserResponse, User, Error
- **Documentation**: Full descriptions, examples, and validation rules

### 2. Spectral API Linting (`.spectral.yaml`)

- **Rulesets**: Extended from `spectral:oas` and `spectral:asyncapi`
- **Custom Rules**:
  - Operations must have success responses (2xx)
  - No HTTP verbs in paths
  - Error responses must have schemas
  - POST/PUT/PATCH require request body validation
  - Security requirements for non-GET operations
  - Schema descriptions required
  - Parameter descriptions required

### 3. Fastify Integration

- **@fastify/swagger**: Loads OpenAPI spec
- **@fastify/swagger-ui**: Interactive documentation at `/docs`
- **YAML Parser**: Parses `openapi.yaml` at startup

### 4. NPM Scripts

```bash
pnpm run api:lint       # Validate OpenAPI spec
pnpm run api:lint:json  # JSON output for CI/CD
pnpm run api:docs       # Show docs URL
```

### 5. Documentation

- **API_FIRST_WORKFLOW.md**: Complete guide to API-first development
- **Backend README**: Updated with OpenAPI info
- **Hexagonal Architecture**: Integration guide with DDD layers

## Usage

### 1. Start Development Server

```bash
cd backend
pnpm dev
```

Server starts on: https://localhost:3000 (or http if HTTPS disabled)  
API Docs available at: https://localhost:3000/docs

### 2. Validate API Design

```bash
pnpm run api:lint
```

Current validation: ✅ Passing (1 warning about security on public endpoint)

### 3. View Interactive Documentation

Open browser to: `https://localhost:3000/docs`

Features:

- Browse all endpoints
- Try API calls interactively
- View request/response schemas
- Test authentication
- Copy curl commands

### 4. API-First Workflow

**Design → Validate → Document → Implement**

1. **Edit `openapi.yaml`** to design new endpoints
2. **Run `pnpm run api:lint`** to validate spec
3. **Review at `/docs`** in browser
4. **Implement** in hexagonal layers:
   - Domain → Application → Adapters → Infrastructure

## Example: Adding New Endpoint

### 1. Add to `openapi.yaml`

```yaml
paths:
  /workouts:
    post:
      summary: Create workout
      operationId: createWorkout
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateWorkoutRequest'
      responses:
        '201':
          description: Workout created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Workout'
```

### 2. Validate

```bash
pnpm run api:lint
```

### 3. Implement Following Hexagonal Architecture

**Domain** (`src/domain/entities/workout.ts`):

```typescript
export class Workout {
  constructor(
    public readonly id: string,
    public readonly duration: number,
    public readonly intensity: 'low' | 'medium' | 'high'
  ) {}
}
```

**Application** (`src/application/dtos/create-workout.dto.ts`):

```typescript
export class CreateWorkoutDto {
  constructor(
    public readonly duration: number,
    public readonly intensity: 'low' | 'medium' | 'high'
  ) {}
}
```

**Adapter** (`src/adapters/primary/http/workout.controller.ts`):

```typescript
app.post('/workouts', async (request, reply) => {
  const dto = CreateWorkoutDto.validate(request.body)
  const result = await createWorkoutUseCase.execute(dto)
  reply.code(201).send(result)
})
```

## Benefits Achieved

✅ **Contract-First**: API design before implementation  
✅ **Auto Documentation**: Always up-to-date via `/docs`  
✅ **Validation**: Spectral catches API design issues early  
✅ **Team Collaboration**: Frontend can start work immediately  
✅ **Type Safety**: OpenAPI schemas → TypeScript types (optional)  
✅ **Testing**: Contract testing against spec

## CI/CD Integration

Add to `.github/workflows/ci-cd.yml`:

```yaml
- name: Validate API Specification
  run: cd backend && pnpm run api:lint
```

## Next Steps

1. **Add more endpoints** to `openapi.yaml`
2. **Enable authentication** in Swagger UI (JWT bearer tokens)
3. **Generate TypeScript types** from OpenAPI (optional):
   ```bash
   pnpm add -D openapi-typescript
   openapi-typescript openapi.yaml -o src/types/api.ts
   ```
4. **Implement endpoints** following hexagonal architecture
5. **Add contract tests** using OpenAPI spec

## Resources

- OpenAPI Spec: `backend/openapi.yaml`
- Spectral Config: `backend/.spectral.yaml`
- Workflow Guide: `backend/API_FIRST_WORKFLOW.md`
- Architecture: `backend/src/HEXAGONAL_ARCHITECTURE.txt`
- Interactive Docs: `https://localhost:3000/docs` (when running)
