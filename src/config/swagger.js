import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EstateHub API',
      version: '1.0.0',
      description:
        'REST API for EstateHub — a real estate listing platform. Covers authentication, property listings, search & filtering, inquiries, and similar-property recommendations.',
      contact: {
        name: 'Ragul Dev',
      },
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:5000/api',
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Ragul Kumar' },
            email: { type: 'string', example: 'ragul@example.com' },
            phone: { type: 'string', example: '9876543210' },
            role: { type: 'string', enum: ['user', 'admin'] },
          },
        },
        Property: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            owner_id: { type: 'string', format: 'uuid' },
            title: { type: 'string', example: 'Spacious 3BHK Apartment in Adyar' },
            description: { type: 'string' },
            property_type: {
              type: 'string',
              enum: ['apartment', 'villa', 'plot', 'commercial'],
            },
            listing_type: { type: 'string', enum: ['sale', 'rent'] },
            price: { type: 'string', example: '35000.00' },
            bedrooms: { type: 'integer', nullable: true, example: 3 },
            bathrooms: { type: 'integer', nullable: true, example: 2 },
            area_sqft: { type: 'string', nullable: true, example: '1450.00' },
            city: { type: 'string', example: 'Chennai' },
            locality: { type: 'string', example: 'Adyar' },
            address: { type: 'string' },
            status: {
              type: 'string',
              enum: ['active', 'sold', 'rented', 'inactive'],
            },
            slug: { type: 'string', example: 'spacious-3bhk-apartment-in-adyar-a1b2c3' },
            primary_image: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Inquiry: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            property_id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Ragul Kumar' },
            email: { type: 'string', example: 'buyer@example.com' },
            phone: { type: 'string', example: '9876543210' },
            message: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            errors: { type: 'object', nullable: true },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/modules/**/*.routes.js'],
};

export const swaggerSpec = swaggerJSDoc(options);