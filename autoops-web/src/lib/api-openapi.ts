export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'AutoOps Mobile API',
    version: '1.0.0',
    description:
      'RESTful API for the AutoOps mobile client. All endpoints except `/api/v1/auth/login` require a Bearer token in the `Authorization` header.',
  },
  servers: [{ url: '/api/v1', description: 'Current host' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        required: ['error', 'code'],
        properties: {
          error: { type: 'string' },
          code: { type: 'string' },
        },
      },
      Pagination: {
        type: 'object',
        required: ['page', 'pageSize', 'total'],
        properties: {
          page: { type: 'integer', example: 1 },
          pageSize: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 340 },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              token: { type: 'string' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  role: { type: 'string', enum: ['mechanic', 'admin'] },
                },
              },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['mechanic', 'admin'] },
          status: { type: 'string', enum: ['pending', 'active', 'inactive'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Client: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          phone: { type: 'string', nullable: true },
          email: { type: 'string', format: 'email', nullable: true },
          notes: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      ClientInput: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          phone: { type: 'string', nullable: true },
          email: { type: 'string', format: 'email', nullable: true },
          notes: { type: 'string', nullable: true },
        },
      },
      Vehicle: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          clientId: { type: 'string', format: 'uuid' },
          licensePlate: { type: 'string', nullable: true },
          description: { type: 'string', nullable: true },
          make: { type: 'string', nullable: true },
          model: { type: 'string', nullable: true },
          year: { type: 'integer', nullable: true },
          vin: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      VehicleInput: {
        type: 'object',
        description:
          'Either `licensePlate` or `description` must be present. `clientId` defaults to the Unknown client if omitted.',
        properties: {
          licensePlate: { type: 'string', nullable: true },
          description: { type: 'string', nullable: true },
          make: { type: 'string', nullable: true },
          model: { type: 'string', nullable: true },
          year: { type: 'integer', nullable: true },
          vin: { type: 'string', nullable: true },
          clientId: { type: 'string', format: 'uuid', nullable: true },
        },
      },
      CatalogPart: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      OrderPartInput: {
        type: 'object',
        required: ['catalogPartId', 'qty', 'unitPrice'],
        properties: {
          catalogPartId: { type: 'string', format: 'uuid' },
          qty: { type: 'number', minimum: 0, exclusiveMinimum: true },
          unitPrice: { type: 'number', minimum: 0 },
        },
      },
      OrderServiceInput: {
        type: 'object',
        required: ['description', 'costType'],
        properties: {
          description: { type: 'string' },
          costType: { type: 'string', enum: ['hourly', 'fixed'] },
          hours: { type: 'number', minimum: 0, exclusiveMinimum: true, nullable: true },
          rate: { type: 'number', minimum: 0, nullable: true },
          fixedAmount: { type: 'number', minimum: 0, nullable: true },
        },
      },
      OrderPart: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          catalogPartId: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          qty: { type: 'number' },
          unitPrice: { type: 'number' },
          total: { type: 'number' },
        },
      },
      OrderService: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          description: { type: 'string' },
          costType: { type: 'string', enum: ['hourly', 'fixed'] },
          hours: { type: 'number', nullable: true },
          rate: { type: 'number', nullable: true },
          fixedAmount: { type: 'number', nullable: true },
          total: { type: 'number' },
        },
      },
      Totals: {
        type: 'object',
        properties: {
          parts: { type: 'number' },
          services: { type: 'number' },
          grand: { type: 'number' },
        },
      },
      OrderListItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          status: {
            type: 'string',
            enum: ['booked', 'in_progress', 'awaiting', 'payment', 'done'],
          },
          deadline: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          mechanic: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
            },
          },
          client: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
            },
          },
          vehicle: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              licensePlate: { type: 'string', nullable: true },
              description: { type: 'string', nullable: true },
              make: { type: 'string', nullable: true },
              model: { type: 'string', nullable: true },
              year: { type: 'integer', nullable: true },
            },
          },
          totals: { $ref: '#/components/schemas/Totals' },
        },
      },
      OrderDetail: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          status: {
            type: 'string',
            enum: ['booked', 'in_progress', 'awaiting', 'payment', 'done'],
          },
          deadline: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          mechanic: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
            },
          },
          client: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              phone: { type: 'string', nullable: true },
              email: { type: 'string', format: 'email', nullable: true },
            },
          },
          vehicle: { $ref: '#/components/schemas/Vehicle' },
          parts: { type: 'array', items: { $ref: '#/components/schemas/OrderPart' } },
          services: { type: 'array', items: { $ref: '#/components/schemas/OrderService' } },
          totals: { $ref: '#/components/schemas/Totals' },
        },
      },
      OrderCreate: {
        type: 'object',
        required: ['vehicleId', 'clientId', 'deadline'],
        properties: {
          vehicleId: { type: 'string', format: 'uuid' },
          clientId: { type: 'string', format: 'uuid' },
          deadline: { type: 'string', format: 'date-time' },
          parts: { type: 'array', items: { $ref: '#/components/schemas/OrderPartInput' } },
          services: { type: 'array', items: { $ref: '#/components/schemas/OrderServiceInput' } },
        },
      },
      OrderPatch: {
        type: 'object',
        description:
          'All fields optional. Mechanics may only update `status`, `parts`, `services`. Admins may update any field. If `parts` or `services` are present they replace the existing rows entirely.',
        properties: {
          status: {
            type: 'string',
            enum: ['booked', 'in_progress', 'awaiting', 'payment', 'done'],
          },
          deadline: { type: 'string', format: 'date-time' },
          vehicleId: { type: 'string', format: 'uuid' },
          clientId: { type: 'string', format: 'uuid' },
          mechanicId: { type: 'string', format: 'uuid' },
          parts: { type: 'array', items: { $ref: '#/components/schemas/OrderPartInput' } },
          services: { type: 'array', items: { $ref: '#/components/schemas/OrderServiceInput' } },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Missing, invalid, or inactive-account token',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Forbidden: {
        description: 'Authenticated but not permitted',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      NotFound: {
        description: 'Resource not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      BadRequest: {
        description: 'Validation error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/login': {
      post: {
        summary: 'Log in and obtain a JWT',
        security: [],
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: {
          '200': {
            description: 'Login success',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/orders': {
      get: {
        summary: 'List orders (mechanic sees own, admin sees all)',
        tags: ['Orders'],
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['booked', 'in_progress', 'awaiting', 'payment', 'done'],
            },
          },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
        ],
        responses: {
          '200': {
            description: 'Paginated order list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/OrderListItem' } },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        summary: 'Create an order',
        tags: ['Orders'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/OrderCreate' } } },
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { data: { $ref: '#/components/schemas/OrderDetail' } },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/orders/{id}': {
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      get: {
        summary: 'Get order detail',
        tags: ['Orders'],
        responses: {
          '200': {
            description: 'Order detail',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { data: { $ref: '#/components/schemas/OrderDetail' } },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        summary: 'Update an order',
        tags: ['Orders'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/OrderPatch' } } },
        },
        responses: {
          '200': {
            description: 'Updated order',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { data: { $ref: '#/components/schemas/OrderDetail' } },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/users': {
      get: {
        summary: 'List users (admin only)',
        tags: ['Users'],
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['pending', 'active', 'inactive'] },
          },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
        ],
        responses: {
          '200': {
            description: 'Paginated user list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/catalog/clients': {
      get: {
        summary: 'List clients',
        tags: ['Catalog'],
        parameters: [
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string', minLength: 2 },
            description: 'Case-insensitive substring match on name/phone/email (min 2 chars)',
          },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
        ],
        responses: {
          '200': {
            description: 'Paginated clients list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Client' } },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        summary: 'Create a client',
        tags: ['Catalog'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ClientInput' } } },
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { data: { $ref: '#/components/schemas/Client' } },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/catalog/clients/{id}': {
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      get: {
        summary: 'Get a client',
        tags: ['Catalog'],
        responses: {
          '200': {
            description: 'Client',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { data: { $ref: '#/components/schemas/Client' } },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        summary: 'Update a client (admin only)',
        tags: ['Catalog'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ClientInput' } } },
        },
        responses: {
          '200': {
            description: 'Updated client',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { data: { $ref: '#/components/schemas/Client' } },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        summary: 'Delete a client (admin only). Blocked if any vehicles or orders reference it.',
        tags: ['Catalog'],
        responses: {
          '200': {
            description: 'Deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: { id: { type: 'string', format: 'uuid' } },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '409': {
            description: 'Client is in use (has vehicles or orders) or is the protected Unknown client',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/catalog/vehicles': {
      get: {
        summary: 'List vehicles',
        tags: ['Catalog'],
        parameters: [
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string', minLength: 2 },
            description: 'Case-insensitive match on plate/description/make/model/vin (min 2 chars)',
          },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
        ],
        responses: {
          '200': {
            description: 'Paginated vehicles list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Vehicle' } },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        summary: 'Create a vehicle',
        tags: ['Catalog'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/VehicleInput' } } },
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { data: { $ref: '#/components/schemas/Vehicle' } },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/catalog/vehicles/{id}': {
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      get: {
        summary: 'Get a vehicle',
        tags: ['Catalog'],
        responses: {
          '200': {
            description: 'Vehicle',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { data: { $ref: '#/components/schemas/Vehicle' } },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        summary: 'Update a vehicle (admin only)',
        tags: ['Catalog'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/VehicleInput' } } },
        },
        responses: {
          '200': {
            description: 'Updated vehicle',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { data: { $ref: '#/components/schemas/Vehicle' } },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        summary: 'Delete a vehicle (admin only). Blocked if any orders reference it.',
        tags: ['Catalog'],
        responses: {
          '200': {
            description: 'Deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: { id: { type: 'string', format: 'uuid' } },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '409': {
            description: 'Vehicle is referenced by one or more orders',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/catalog/parts': {
      get: {
        summary: 'Search the parts catalog',
        tags: ['Catalog'],
        parameters: [
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string', minLength: 2 },
            description: 'Case-insensitive substring match on name (min 2 chars)',
          },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
        ],
        responses: {
          '200': {
            description: 'Paginated parts list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/CatalogPart' } },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        summary: 'Add a part to the catalog',
        tags: ['Catalog'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: { name: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { data: { $ref: '#/components/schemas/CatalogPart' } },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '409': {
            description: 'Part name already exists',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/catalog/parts/{id}': {
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      get: {
        summary: 'Get a catalog part',
        tags: ['Catalog'],
        responses: {
          '200': {
            description: 'Part',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { data: { $ref: '#/components/schemas/CatalogPart' } },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        summary: 'Rename a catalog part',
        tags: ['Catalog'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { name: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated part',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { data: { $ref: '#/components/schemas/CatalogPart' } },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
          '409': {
            description: 'Part name already exists',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      delete: {
        summary: 'Delete a catalog part (admin only). Blocked if any orders reference it.',
        tags: ['Catalog'],
        responses: {
          '200': {
            description: 'Deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: { id: { type: 'string', format: 'uuid' } },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '409': {
            description: 'Part is referenced by one or more orders',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
  },
} as const;
