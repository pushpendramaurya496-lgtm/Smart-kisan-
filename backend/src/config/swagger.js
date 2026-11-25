const swaggerUi = require('swagger-ui-express');

/**
 * Complete OpenAPI 3.0 Specification for Kisan Sathi - Chakki Smart AI
 * Matches reference Swagger UI structure (OAS 3.0)
 */
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Kisan Sathi | Chakki Smart AI API',
    version: '1.0.0',
    description: 'API Documentation for the Kisan Sathi Chakki Smart Mill Management application.',
    contact: {
      name: 'Chakki Smart AI Engineering Team',
    },
  },
  servers: [
    {
      url: '/',
      description: 'Development Server',
    },
    {
      url: 'http://localhost:5000',
      description: 'Local Server (port 5000)',
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'Authentication & User Management APIs',
    },
    {
      name: 'Upload',
      description: 'Cloudinary Media & Document Upload APIs',
    },
    {
      name: 'Milling Entries',
      description: 'Grain Milling, Token & Delivery Management APIs',
    },
    {
      name: 'Customers & Khata',
      description: 'Customer Ledger, Passbook & Udhar Management APIs',
    },
    {
      name: 'Dashboard',
      description: 'Milling Statistics, Earnings & Revenue Analytics APIs',
    },
  ],
  paths: {
    // ═════════════════════════════════════════════════════════════════════════
    // 1. AUTHENTICATION MODULE
    // ═════════════════════════════════════════════════════════════════════════
    '/api/v1/auth/send-otp': {
      post: {
        tags: ['Authentication'],
        summary: 'Send 4-digit OTP to mobile number',
        description: 'Sends an OTP to an Indian 10-digit mobile number for login / registration.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['phone'],
                properties: {
                  phone: { type: 'string', example: '9876543210' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'OTP sent successfully' },
          400: { description: 'Invalid phone number' },
        },
      },
    },
    '/api/v1/auth/verify-otp': {
      post: {
        tags: ['Authentication'],
        summary: 'Verify OTP and get JWT authentication token',
        description: 'Verifies the OTP received by the user and returns user info + JWT Bearer token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['phone', 'otp'],
                properties: {
                  phone: { type: 'string', example: '9876543210' },
                  otp: { type: 'string', example: '1234' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'OTP verified successfully' },
          400: { description: 'Invalid or expired OTP' },
        },
      },
    },
    '/api/v1/auth/login-pin': {
      post: {
        tags: ['Authentication'],
        summary: 'Login directly using 4-digit MPIN',
        description: 'Enables quick login for returning chakki owners using their 4-digit security PIN.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['phone', 'mpin'],
                properties: {
                  phone: { type: 'string', example: '9876543210' },
                  mpin: { type: 'string', example: '1234' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'MPIN login successful' },
          401: { description: 'Incorrect MPIN' },
        },
      },
    },
    '/api/v1/auth/complete-profile': {
      post: {
        tags: ['Authentication'],
        summary: 'Complete owner and chakki mill profile',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['ownerName', 'chakkiName', 'village', 'mpin'],
                properties: {
                  ownerName: { type: 'string', example: 'रामलाल शर्मा' },
                  chakkiName: { type: 'string', example: 'श्री गणेश फ्लोर मिल' },
                  village: { type: 'string', example: 'चाकसू, जयपुर' },
                  mpin: { type: 'string', example: '1234' },
                  profileImage: { type: 'string', example: 'https://res.cloudinary.com/...' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Profile completed successfully' },
        },
      },
    },
    '/api/v1/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current logged-in user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'User profile retrieved successfully' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/v1/auth/update-profile': {
      put: {
        tags: ['Authentication'],
        summary: 'Update chakki owner profile and default rates',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  profile: {
                    type: 'object',
                    properties: {
                      ownerName: { type: 'string', example: 'रामलाल शर्मा' },
                      chakkiName: { type: 'string', example: 'श्री गणेश फ्लोर मिल' },
                      village: { type: 'string', example: 'चाकसू' },
                      profileImage: { type: 'string', example: 'https://res.cloudinary.com/...' },
                    },
                  },
                  defaultRates: {
                    type: 'object',
                    properties: {
                      wheatPisaiPerKg: { type: 'number', example: 3.5 },
                      oilExtractionPerKg: { type: 'number', example: 15 },
                      masalaGrindingPerKg: { type: 'number', example: 20 },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Profile updated successfully' },
        },
      },
    },
    '/api/v1/auth/reset-pin': {
      post: {
        tags: ['Authentication'],
        summary: 'Reset 4-digit security MPIN',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['phone', 'otp', 'newMpin'],
                properties: {
                  phone: { type: 'string', example: '9876543210' },
                  otp: { type: 'string', example: '1234' },
                  newMpin: { type: 'string', example: '5678' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'MPIN reset successfully' },
        },
      },
    },
    '/api/v1/auth/settings': {
      get: {
        tags: ['Authentication'],
        summary: 'Get mill default rates and audio preferences',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Settings retrieved successfully' },
        },
      },
      put: {
        tags: ['Authentication'],
        summary: 'Update mill default rates and audio preferences',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SettingsResponse' },
            },
          },
        },
        responses: {
          200: { description: 'Settings updated successfully' },
        },
      },
    },

    // ═════════════════════════════════════════════════════════════════════════
    // 2. UPLOAD MODULE (CLOUDINARY)
    // ═════════════════════════════════════════════════════════════════════════
    '/api/v1/upload/single': {
      post: {
        tags: ['Upload'],
        summary: 'Upload single image or document to Cloudinary',
        description: 'Uploads an image (JPG, PNG, WEBP) or PDF document to Cloudinary and returns CDN URL.',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Image or document file (up to 10MB)',
                  },
                  folder: {
                    type: 'string',
                    example: 'profiles',
                    description: 'Subfolder on Cloudinary (profiles, bills, tokens)',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'File uploaded successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'File uploaded successfully to Cloudinary!' },
                    data: {
                      type: 'object',
                      properties: {
                        url: { type: 'string', example: 'https://res.cloudinary.com/...' },
                        secure_url: { type: 'string', example: 'https://res.cloudinary.com/...' },
                        public_id: { type: 'string', example: 'chakki_smart_ai/profiles/abc123' },
                        format: { type: 'string', example: 'jpg' },
                        bytes: { type: 'number', example: 124500 },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'No file provided or invalid format' },
        },
      },
    },
    '/api/v1/upload/multiple': {
      post: {
        tags: ['Upload'],
        summary: 'Upload multiple files to Cloudinary in parallel',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['files'],
                properties: {
                  files: {
                    type: 'array',
                    items: {
                      type: 'string',
                      format: 'binary',
                    },
                    description: 'Array of files to upload (up to 10 files)',
                  },
                  folder: { type: 'string', example: 'bills' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'All files uploaded successfully' },
        },
      },
    },
    '/api/v1/upload/status': {
      get: {
        tags: ['Upload'],
        summary: 'Check Cloudinary connection status',
        responses: {
          200: {
            description: 'Status retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    configured: { type: 'boolean', example: true },
                    cloud_name: { type: 'string', example: 'cha***' },
                    message: { type: 'string', example: 'Cloudinary is configured and ready to use!' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/upload': {
      delete: {
        tags: ['Upload'],
        summary: 'Delete image/document from Cloudinary by public_id',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['public_id'],
                properties: {
                  public_id: { type: 'string', example: 'chakki_smart_ai/profiles/abc123' },
                  resource_type: { type: 'string', example: 'image' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'File deleted from Cloudinary successfully' },
        },
      },
    },

    // ═════════════════════════════════════════════════════════════════════════
    // 3. MILLING ENTRIES MODULE
    // ═════════════════════════════════════════════════════════════════════════
    '/api/v1/entries': {
      post: {
        tags: ['Milling Entries'],
        summary: 'Add a new milling entry with auto-token generation',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'village', 'weightKg'],
                properties: {
                  name: { type: 'string', example: 'रामलाल शर्मा' },
                  village: { type: 'string', example: 'रामपुरा' },
                  phone: { type: 'string', example: '9829012345' },
                  itemType: { type: 'string', enum: ['WHEAT', 'OIL', 'MASALA', 'DARRA', 'OTHER'], example: 'WHEAT' },
                  itemLabel: { type: 'string', example: 'गेहूं पिसाई' },
                  weightKg: { type: 'number', example: 40 },
                  ratePerKg: { type: 'number', example: 3 },
                  amountPaid: { type: 'number', example: 50 },
                  source: { type: 'string', enum: ['MANUAL', 'VOICE'], example: 'VOICE' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Milling entry created successfully' },
        },
      },
      get: {
        tags: ['Milling Entries'],
        summary: 'Get all milling entries with filters',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'status', schema: { type: 'string' }, description: 'RECEIVED | PROCESSING | READY | DELIVERED' },
          { in: 'query', name: 'todayOnly', schema: { type: 'boolean' }, description: 'Filter today only' },
          { in: 'query', name: 'itemType', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Entries list retrieved successfully' },
        },
      },
    },
    '/api/v1/entries/pickup-search': {
      get: {
        tags: ['Milling Entries'],
        summary: 'Search ready entries for pickup / delivery (by name, village, token or phone)',
        parameters: [
          { in: 'query', name: 'token', schema: { type: 'string' }, description: 'Token number (e.g. 1 or #1)' },
          { in: 'query', name: 'name', schema: { type: 'string' }, description: 'Customer name' },
          { in: 'query', name: 'village', schema: { type: 'string' }, description: 'Customer village' },
          { in: 'query', name: 'phone', schema: { type: 'string' }, description: 'Customer phone number' },
        ],
        responses: {
          200: { description: 'Pickup search results' },
        },
      },
    },
    '/api/v1/entries/pickup': {
      get: {
        tags: ['Milling Entries'],
        summary: 'Search ready entries for pickup / delivery (alias)',
        parameters: [
          { in: 'query', name: 'query', schema: { type: 'string' }, description: 'Token number or customer name or village' },
        ],
        responses: {
          200: { description: 'Pickup search results' },
        },
      },
    },
    '/api/v1/entries/{id}/deliver': {
      post: {
        tags: ['Milling Entries'],
        summary: 'Deliver milled goods and record payment (माल सुपुर्दगी व भुगतान)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  payingAmount: { type: 'number', example: 70 },
                  paymentMethod: { type: 'string', enum: ['CASH', 'UPI', 'CREDIT'], example: 'CASH' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Order delivered and ledger updated successfully' },
        },
      },
    },

    // ═════════════════════════════════════════════════════════════════════════
    // 4. CUSTOMERS & KHATA MODULE
    // ═════════════════════════════════════════════════════════════════════════
    '/api/v1/customers': {
      get: {
        tags: ['Customers & Khata'],
        summary: 'Search customers by name, village or phone number',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'query', schema: { type: 'string' }, description: 'Customer name or phone' },
          { in: 'query', name: 'village', schema: { type: 'string' }, description: 'Village name' },
        ],
        responses: {
          200: { description: 'Customers list retrieved successfully' },
        },
      },
    },
    '/api/v1/customers/voice-search': {
      post: {
        tags: ['Customers & Khata'],
        summary: 'Voice AI search customer (Hindi Devanagari query)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['spokenText'],
                properties: {
                  spokenText: { type: 'string', example: 'रामलाल रामपुर वाले' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Voice search matched customers' },
        },
      },
    },
    '/api/v1/customers/{id}': {
      get: {
        tags: ['Customers & Khata'],
        summary: 'Get customer profile and milling history',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Customer profile retrieved' },
        },
      },
    },
    '/api/v1/customers/{id}/dashboard': {
      get: {
        tags: ['Customers & Khata'],
        summary: 'Get customer khata dashboard with pending balance (बकाया हिसाब)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'Customer khata dashboard data',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CustomerDashboard' },
              },
            },
          },
        },
      },
    },
    '/api/v1/customers/{id}/debt-payment': {
      post: {
        tags: ['Customers & Khata'],
        summary: 'Record debt payment towards pending balance (उधार जमा)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['amountPaid'],
                properties: {
                  amountPaid: { type: 'number', example: 120 },
                  amount: { type: 'number', example: 120 },
                  paymentMethod: { type: 'string', enum: ['CASH', 'UPI'], example: 'CASH' },
                  notes: { type: 'string', example: 'बाकी पुराना हिसाब जमा' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Debt payment successfully recorded and customer balance updated' },
        },
      },
    },
    '/api/v1/customers/{id}/pay-debt': {
      post: {
        tags: ['Customers & Khata'],
        summary: 'पुराने बाकी पैसे जमा करें (Debt Settlement)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['amountPaid'],
                properties: {
                  amountPaid: { type: 'number', example: 120 },
                  paymentMethod: { type: 'string', enum: ['CASH', 'UPI'], example: 'CASH' },
                  notes: { type: 'string', example: 'नकद जमा' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'खाता अपडेट हुआ और भुगतान दर्ज हुआ' },
        },
      },
    },

    // ═════════════════════════════════════════════════════════════════════════
    // 5. DASHBOARD & STATS MODULE
    // ═════════════════════════════════════════════════════════════════════════
    '/api/v1/dashboard/stats': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get overall summary statistics for today (Milling KG, Customers, Debt, Expense)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Summary statistics for home screen stat grid',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        todayPisaiKg: { type: 'number', example: 210 },
                        totalCustomers: { type: 'number', example: 48 },
                        pendingDebt: { type: 'number', example: 1250 },
                        totalExpense: { type: 'number', example: 620 },
                        todayEarnings: { type: 'number', example: 2850 },
                        cashReceived: { type: 'number', example: 2400 },
                        onlineReceived: { type: 'number', example: 450 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/dashboard/earnings': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get earnings breakdown by milling category (Flour, Oil, Haldi, Darra)',
        parameters: [
          { in: 'query', name: 'period', schema: { type: 'string', enum: ['today', 'yesterday', 'week', 'month', 'total'] }, description: 'Filter period' },
          { in: 'query', name: 'date', schema: { type: 'string' }, description: 'Custom date (YYYY-MM-DD)' },
        ],
        responses: {
          200: { description: 'Earnings dashboard breakdown' },
        },
      },
    },
    '/api/v1/dashboard/milling': {
      get: {
        tags: ['Dashboard'],
        summary: "Get today's milling weight and customer breakdown",
        parameters: [
          { in: 'query', name: 'period', schema: { type: 'string', enum: ['today', 'yesterday', 'week', 'month', 'total'] }, description: 'Filter period' },
          { in: 'query', name: 'date', schema: { type: 'string' }, description: 'Custom date (YYYY-MM-DD)' },
        ],
        responses: {
          200: { description: "Today's milling details breakdown" },
        },
      },
    },
    '/api/v1/dashboard/pending': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get pending debt balance breakdown and debtor customers list (बाकी हिसाब स्क्रीन)',
        parameters: [
          { in: 'query', name: 'period', schema: { type: 'string', enum: ['today', 'yesterday', 'week', 'month', 'total'] }, description: 'Filter period' },
          { in: 'query', name: 'date', schema: { type: 'string' }, description: 'Custom date (YYYY-MM-DD)' },
        ],
        responses: {
          200: {
            description: 'Debtor customers list and pending balance stats',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        summary: {
                          type: 'object',
                          properties: {
                            totalPendingDebt: { type: 'number', example: 1250 },
                            todayPending: { type: 'number', example: 100 },
                            debtorCount: { type: 'number', example: 3 },
                          },
                        },
                        customers: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              name: { type: 'string', example: 'रामलाल शर्मा' },
                              village: { type: 'string', example: 'रामपुरा' },
                              phone: { type: 'string', example: '9829012345' },
                              pendingBalance: { type: 'number', example: 450 },
                              lastOrderItem: { type: 'string', example: 'गेहूं (पिसाई)' },
                              lastOrderWeightKg: { type: 'number', example: 40 },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/dashboard/customers': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get total customer breakdown and list (कुल ग्राहक डैशबोर्ड)',
        parameters: [
          { in: 'query', name: 'period', schema: { type: 'string', enum: ['today', 'yesterday', 'week', 'month', 'total'] }, description: 'Filter period' },
          { in: 'query', name: 'date', schema: { type: 'string' }, description: 'Custom date (YYYY-MM-DD)' },
        ],
        responses: {
          200: {
            description: 'Customer list with total milling kg, orders count and balance',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        summary: {
                          type: 'object',
                          properties: {
                            totalCustomers: { type: 'number', example: 12 },
                            activeToday: { type: 'number', example: 2 },
                          },
                        },
                        customers: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              name: { type: 'string', example: 'सुरेश जाट' },
                              village: { type: 'string', example: 'किशनपुरा' },
                              phone: { type: 'string' },
                              pendingBalance: { type: 'number', example: 0 },
                              totalWeightMilledKg: { type: 'number', example: 80 },
                              totalOrdersCount: { type: 'number', example: 2 },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/dashboard/deliveries': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get delivery history records (डिलीवरी हिस्ट्री - सामान ले जा चुके ग्राहक)',
        parameters: [
          { in: 'query', name: 'period', schema: { type: 'string', enum: ['today', 'weekly', 'monthly', 'all'] }, description: 'Filter period' },
          { in: 'query', name: 'search', schema: { type: 'string' }, description: 'Search by customer name or village' },
        ],
        responses: {
          200: {
            description: 'Delivery records list with status, amounts and weights',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        deliveries: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              customerName: { type: 'string', example: 'रामलाल' },
                              village: { type: 'string', example: 'रामपुर' },
                              phone: { type: 'string', example: '9829012345' },
                              itemLabel: { type: 'string', example: 'तेल पिराई' },
                              weightKg: { type: 'number', example: 50 },
                              ratePerKg: { type: 'number', example: 7 },
                              totalAmount: { type: 'number', example: 150 },
                              amountPaid: { type: 'number', example: 150 },
                              pendingAmount: { type: 'number', example: 0 },
                              isPaid: { type: 'boolean', example: true },
                              status: { type: 'string', example: 'ले जा चुके' },
                              deliveryTimeStr: { type: 'string', example: 'आज, 11:30 AM' },
                            },
                          },
                        },
                        totalDeliveries: { type: 'number', example: 28 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT Token from /auth/verify-otp or /auth/login-pin',
      },
    },
    schemas: {
      CustomerDashboard: {
        type: 'object',
        properties: {
          pendingBalance: { type: 'number', example: 1450 },
          totalBilled: { type: 'number', example: 3200 },
          totalPaid: { type: 'number', example: 1750 },
        },
      },
      SettingsResponse: {
        type: 'object',
        properties: {
          millingRates: {
            type: 'object',
            properties: {
              wheatPisaiPerKg: { type: 'number', example: 3.5 },
              oilExtractionPerKg: { type: 'number', example: 15 },
              masalaGrindingPerKg: { type: 'number', example: 20 },
            },
          },
        },
      },
    },
  },
};

module.exports = {
  swaggerUi,
  swaggerDocument,
};
