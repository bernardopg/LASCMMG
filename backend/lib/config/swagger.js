/**
 * Swagger/OpenAPI Configuration for LASCMMG API
 *
 * This file configures API documentation using OpenAPI 3.0 specification.
 * Documentation is automatically generated from JSDoc comments in route files.
 */

const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LASCMMG Tournament Management API',
      version: '1.0.0',
      description:
        'API para gerenciamento de torneios da Liga Adega - Sinuca Carioca e Mini Mesa Gaúcha',
      contact: {
        name: 'LASCMMG Development Team',
        url: 'https://github.com/bernardopg/lascmmg',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.lascmmg.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /api/login endpoint',
        },
        CsrfToken: {
          type: 'apiKey',
          in: 'header',
          name: 'X-CSRF-Token',
          description: 'CSRF protection token obtained from /api/csrf-token endpoint',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'User ID',
              example: 1,
            },
            username: {
              type: 'string',
              description: 'Username',
              example: 'admin',
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              description: 'User role',
              example: 'admin',
            },
            last_login: {
              type: 'string',
              format: 'date-time',
              description: 'Last login timestamp',
              example: '2025-10-04T20:00:00.000Z',
            },
          },
        },
        Player: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Player ID',
              example: 1,
            },
            name: {
              type: 'string',
              description: 'Player name',
              example: 'João Silva',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Player email',
              example: 'joao@example.com',
              nullable: true,
            },
            gender: {
              type: 'string',
              enum: ['M', 'F', 'Outro'],
              description: 'Player gender',
              example: 'M',
              nullable: true,
            },
            skill_level: {
              type: 'string',
              description: 'Player skill level',
              example: 'Intermediário',
              nullable: true,
            },
            deleted_at: {
              type: 'string',
              format: 'date-time',
              description: 'Soft delete timestamp',
              nullable: true,
            },
          },
          required: ['name'],
        },
        Tournament: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Tournament ID',
              example: 1,
            },
            name: {
              type: 'string',
              description: 'Tournament name',
              example: 'Torneio de Sinuca 2025',
            },
            date: {
              type: 'string',
              format: 'date-time',
              description: 'Tournament date',
              example: '2025-12-01T18:00:00.000Z',
            },
            location: {
              type: 'string',
              description: 'Tournament location',
              example: 'Clube Adega',
            },
            max_players: {
              type: 'integer',
              description: 'Maximum number of players',
              example: 32,
            },
            status: {
              type: 'string',
              enum: ['Pendente', 'Ativo', 'Concluído', 'Cancelado'],
              description: 'Tournament status',
              example: 'Ativo',
            },
            entry_fee: {
              type: 'number',
              format: 'float',
              description: 'Entry fee amount',
              example: 50.0,
            },
            prize_pool: {
              type: 'string',
              description: 'Prize pool description',
              example: 'R$ 1.000,00',
              nullable: true,
            },
            rules: {
              type: 'string',
              description: 'Tournament rules',
              nullable: true,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
            deleted_at: {
              type: 'string',
              format: 'date-time',
              description: 'Soft delete timestamp',
              nullable: true,
            },
          },
          required: ['name', 'date', 'location'],
        },
        Match: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Match ID',
              example: 1,
            },
            tournament_id: {
              type: 'integer',
              description: 'Tournament ID',
              example: 1,
            },
            round: {
              type: 'string',
              description: 'Round name',
              example: 'Quartas de Final',
            },
            match_number: {
              type: 'integer',
              description: 'Match number in round',
              example: 1,
            },
            player1_id: {
              type: 'integer',
              description: 'Player 1 ID',
              example: 5,
              nullable: true,
            },
            player2_id: {
              type: 'integer',
              description: 'Player 2 ID',
              example: 8,
              nullable: true,
            },
            player1_score: {
              type: 'integer',
              description: 'Player 1 score',
              example: 3,
              nullable: true,
            },
            player2_score: {
              type: 'integer',
              description: 'Player 2 score',
              example: 2,
              nullable: true,
            },
            winner_id: {
              type: 'integer',
              description: 'Winner player ID',
              example: 5,
              nullable: true,
            },
            scheduled_time: {
              type: 'string',
              format: 'date-time',
              description: 'Scheduled match time',
              nullable: true,
            },
            completed_at: {
              type: 'string',
              format: 'date-time',
              description: 'Completion timestamp',
              nullable: true,
            },
          },
        },
        HealthStatus: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'degraded', 'unhealthy'],
              description: 'Overall system health status',
              example: 'healthy',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Health check timestamp',
            },
            responseTime: {
              type: 'string',
              description: 'Total response time',
              example: '45ms',
            },
            checks: {
              type: 'object',
              properties: {
                database: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['healthy', 'unhealthy'],
                    },
                    responseTime: {
                      type: 'string',
                    },
                    connection: {
                      type: 'string',
                    },
                    message: {
                      type: 'string',
                    },
                  },
                },
                redis: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['healthy', 'degraded', 'unhealthy'],
                    },
                    mode: {
                      type: 'string',
                      enum: ['redis', 'memory-fallback'],
                    },
                    responseTime: {
                      type: 'string',
                    },
                    message: {
                      type: 'string',
                    },
                  },
                },
                filesystem: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                    },
                    writable: {
                      type: 'boolean',
                    },
                    message: {
                      type: 'string',
                    },
                  },
                },
                system: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                    },
                    memory: {
                      type: 'object',
                    },
                    cpu: {
                      type: 'object',
                    },
                    uptime: {
                      type: 'object',
                    },
                    message: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              description: 'Error message',
              example: 'Erro ao processar requisição',
            },
            error: {
              type: 'string',
              description: 'Detailed error information',
              example: 'Invalid input data',
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Autenticação necessária',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Permissão negada. Apenas administradores podem acessar.',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Recurso não encontrado',
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Dados de entrada inválidos',
                error: 'O campo "name" é obrigatório',
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Authentication and authorization endpoints',
      },
      {
        name: 'Tournaments',
        description: 'Tournament management',
      },
      {
        name: 'Players',
        description: 'Player management',
      },
      {
        name: 'Matches',
        description: 'Match management and scoring',
      },
      {
        name: 'Users',
        description: 'User management',
      },
      {
        name: 'Admin',
        description: 'Administrative functions',
      },
      {
        name: 'Health',
        description: 'System health monitoring',
      },
      {
        name: 'Performance',
        description: 'Performance monitoring and optimization',
      },
    ],
  },
  // Path to the API routes files
  apis: [path.join(__dirname, '../routes/*.js'), path.join(__dirname, '../server.js')],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
