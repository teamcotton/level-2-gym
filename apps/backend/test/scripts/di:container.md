classDiagram
direction TB
class node1 {
dirname
join
}
class node14 {
fileURLToPath
}
class node11 {
AuditLog
}
class node13 {
EnvConfig
}
class node6 {
AIController
AIRepository
AppendedChatUseCase
AuditLog
AuthController
EnvConfig
FastifyInstance
FastifyServerOptions
GetAllUsersUseCase
GetChatUseCase
JwtTokenGeneratorService
LoginUserUseCase
PinoLoggerService
PostgresUserRepository
RegisterUserUseCase
ResendService
SaveChatUseCase
UserController
createFastifyApp
dirname
fileURLToPath
join
readFileSync
}
class fastify {
FastifyInstance
}
class node2 {
FastifyServerOptions
}
class node18 {
AIController
}
class node3 {
AuthController
}
class node7 {
createFastifyApp
}
class node15 {
UserController
}
class node16 {
readFileSync
}
class node9 {
AIRepository
}
class node4 {
PostgresUserRepository
}
class node12 {
ResendService
}
class node10 {
JwtTokenGeneratorService
}
class node20 {
PinoLoggerService
}
class node5 {
AppendedChatUseCase
}
class node8 {
GetAllUsersUseCase
}
class node0 {
GetChatUseCase
}
class node19 {
LoginUserUseCase
}
class node22 {
RegisterUserUseCase
}
class node17 {
SaveChatUseCase
}

node1 --> node6
node1 --> node6
node14 --> node6
node11 --> node6
node13 --> node6
fastify --> node6
node2 --> node6
node18 --> node6
node3 --> node6
node7 --> node6
node15 --> node6
node16 --> node6
node9 --> node6
node4 --> node6
node12 --> node6
node10 --> node6
node20 --> node6
node5 --> node6
node8 --> node6
node0 --> node6
node19 --> node6
node22 --> node6
node17 --> node6
