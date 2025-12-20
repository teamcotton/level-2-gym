# API-First Development Workflow

This document describes the API-first development approach for the Level 2 Gym backend.

## Overview

API-first development means designing and documenting your API specification before implementing the code. This approach ensures:

- ✅ Consistent API design across the application
- ✅ Better collaboration between frontend and backend teams
- ✅ Automatic API documentation
- ✅ Contract testing and validation
- ✅ Early detection of API design issues

## Tools

### OpenAPI (Swagger)

- **Specification**: `openapi.json` - The single source of truth for the API
- **Interactive Docs**: Available at `http://localhost:3000/docs` when server is running
- **Standard**: OpenAPI 3.1.0 specification

### Spectral

- **Purpose**: API linting and validation
- **Config**: `.spectral.yaml` - Custom rules for API quality
- **Ruleset**: Extends `spectral:oas` with custom rules for best practices

## Workflow

### 1. Design API Specification First

Before writing any code, define your API in `openapi.json`:

```yaml
paths:
  /workouts:
    post:
      summary: Create a new workout
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

### 2. Validate API Specification

Run Spectral to validate your API design:

```bash
pnpm run api:lint
```

This checks for:

- Missing descriptions
- Invalid response codes
- Security issues
- Best practice violations
- Schema validation

### 3. Review Interactive Documentation

Start the dev server and visit the Swagger UI:

```bash
pnpm run dev
# Open http://localhost:3000/docs
```

Use the interactive UI to:

- Review API endpoints
- Test request/response formats
- Validate schemas
- Share with frontend team

### 4. Implement the Code

Now implement the endpoints following the hexagonal architecture:

```
1. Domain Layer - Define entities and business logic
2. Application Layer - Create use cases and DTOs matching OpenAPI schemas
3. Adapters Layer - Implement HTTP controllers following OpenAPI paths
4. Infrastructure Layer - Wire everything together
```

### 5. Keep Spec in Sync

As you implement:

- Update `openapi.json` if the design needs to change
- Run `pnpm run api:lint` before commits
- Regenerate types if using OpenAPI code generation

## NPM Scripts

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "api:lint": "spectral lint openapi.json",
    "api:lint:fix": "spectral lint openapi.json --format=stylish",
    "api:docs": "echo 'Visit http://localhost:3000/docs when server is running'",
    "dev": "tsx watch src/index.ts"
  }
}
```

## Best Practices

### 1. Schema Reusability

Define reusable schemas in `components/schemas`:

```yaml
components:
  schemas:
    User:
      type: object
      required:
        - id
        - email
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
```

Reference them using `$ref`:

```yaml
responses:
  '200':
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/User'
```

### 2. Consistent Error Responses

Define a standard error schema:

```yaml
components:
  schemas:
    Error:
      type: object
      required:
        - success
        - error
      properties:
        success:
          type: boolean
        error:
          type: string
        code:
          type: string
```

Use it for all error responses.

### 3. Use Operation IDs

Always define `operationId` for each endpoint:

```yaml
paths:
  /users/{id}:
    get:
      operationId: getUserById # ← Important for code generation
```

### 4. Document Everything

- Add descriptions to all operations
- Document all parameters
- Include examples in schemas
- Add tags for grouping endpoints

### 5. Version Your API

Include version in the URL or headers:

```yaml
servers:
  - url: http://localhost:3000/v1
    description: Version 1 API
```

## Integration with Hexagonal Architecture

The OpenAPI spec maps to hexagonal layers:

```
openapi.json (Contract)
    ↓
adapters/primary/http/     # HTTP Controllers
    ↓
application/use-cases/     # Business logic orchestration
    ↓
domain/                    # Core business entities
```

### Example Mapping

**OpenAPI**:

```yaml
/users/register:
  post:
    requestBody:
      schema:
        $ref: '#/components/schemas/RegisterUserRequest'
```

**Application Layer** (`application/dtos/`):

```typescript
export class RegisterUserDto {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly name: string
  ) {}
}
```

**Primary Adapter** (`adapters/primary/http/`):

```typescript
app.post('/users/register', async (request, reply) => {
  const dto = RegisterUserDto.validate(request.body)
  const result = await registerUserUseCase.execute(dto)
  reply.code(201).send(result)
})
```

## CI/CD Integration

Add to GitHub Actions workflow:

```yaml
- name: Validate API Specification
  run: pnpm run api:lint

- name: Check API changes
  run: |
    if git diff --name-only origin/main | grep -q openapi.json; then
      echo "API spec changed - review required"
    fi
```

## Tools and Extensions

### VS Code Extensions

- **Swagger Viewer**: Preview OpenAPI specs
- **OpenAPI (Swagger) Editor**: Syntax highlighting and validation
- **Spectral**: Inline linting

### CLI Tools

```bash
# Validate spec
spectral lint openapi.json

# Generate types (optional)
openapi-typescript openapi.json -o src/types/api.ts

# Convert YAML to JSON
yq eval -o=json openapi.json > openapi.json
```

## Resources

- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
- [Spectral Documentation](https://stoplight.io/open-source/spectral)
- [Fastify Swagger Plugin](https://github.com/fastify/fastify-swagger)
- [API Design Best Practices](https://swagger.io/resources/articles/best-practices-in-api-design/)
