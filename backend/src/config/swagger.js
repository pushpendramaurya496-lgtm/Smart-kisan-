const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '🌾 Kisan Sathi | Chakki Smart AI - REST API Docs',
      version: '1.0.0',
      description: `
**चक्की स्मार्ट AI (Kisan Sathi) - सम्पूर्ण बैकेंड API दस्तावेज़**

यह API चक्की और आटा मिल के दैनिक कार्यों के लिए डिज़ाइन की गई है:
1. **🔐 प्रमाणीकरण (Authentication)**: मोबाइल लॉगिन, 4-अंकीय OTP, सुरक्षा PIN (MPIN), पिन भूल जाने पर रीसेट और प्रोफाइल फोटो प्रबंधन।
2. **🌾 पिसाई आवक (Milling Entries)**: हाथ से या बोलकर (AI Voice) एंट्री दर्ज करना, ऑटो-टोकन जनरेशन, अनाज वजन व दर गणना।
3. **📦 माल सुपुर्दगी (Pickup / Delivery)**: जब ग्राहक आटा/तेल लेने आए तो 'नाम + गांव' या 'टोकन' से खोजना।
4. **💰 आंशिक व उधारी भुगतान (Partial / Split Payment)**: कुछ पैसे जमा, कुछ बाकी या पूरे उधार का हिसाब।
5. **📖 ग्राहक बही-खाता (Customer Ledger & Passbook)**: डिजिटल खाता डायरी और WhatsApp रसीद।
6. **📊 ग्राहक डैशबोर्ड (Customer Dashboard & History)**: ग्राहक पर टच करते ही पुराना रिकॉर्ड, कितना बाकी है व सम्पूर्ण इतिहास।
7. **🎙️ सर्च बॉक्स वॉइस सर्च (Voice AI Search)**: बोलकर नाम या गाँव से ग्राहक तुरंत खोजना।
      `,
      contact: {
        name: 'Chakki Smart AI Engineering Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'लोकल सर्वर (Local Development Server)',
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: '📱 चक्की मालिक लॉगिन, OTP सत्यापन, PIN और प्रोफाइल व फोटो प्रबंधन',
      },
      {
        name: 'Milling Entries',
        description: '🌾 पिसाई आवक एंट्री, टोकन, ग्राहक सुपुर्दगी (Pickup) व आंशिक भुगतान',
      },
      {
        name: 'Customers & Khata',
        description: '📖 ग्राहक बही-खाता, डिजिटल पासबुक व उधारी भुगतान',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Token दर्ज करें (उदा. Bearer eyJhbGciOi...)',
        },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            statusCode: { type: 'number', example: 200 },
            message: { type: 'string', example: 'सफलतापूर्वक संपन्न हुआ' },
            data: { type: 'object' },
          },
        },
        Customer: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '673d1234...' },
            name: { type: 'string', example: 'रामलाल शर्मा' },
            village: { type: 'string', example: 'रामपुरा' },
            phone: { type: 'string', example: '9829012345' },
            pendingBalance: {
              type: 'number',
              example: 70,
              description: 'बकाया राशि (> 0 उधार, < 0 एडवांस)',
            },
            totalOrdersCount: { type: 'number', example: 5 },
            totalWeightMilledKg: { type: 'number', example: 180 },
            totalBilledAmount: { type: 'number', example: 540 },
            totalPaidAmount: { type: 'number', example: 470 },
          },
        },
        Entry: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '673e5678...' },
            tokenNumber: { type: 'string', example: '24' },
            customerName: { type: 'string', example: 'रामलाल शर्मा' },
            village: { type: 'string', example: 'रामपुरा' },
            itemType: { type: 'string', enum: ['WHEAT', 'OIL', 'MASALA', 'OTHER'], example: 'WHEAT' },
            itemLabel: { type: 'string', example: 'गेहूं पिसाई' },
            weightKg: { type: 'number', example: 40 },
            ratePerKg: { type: 'number', example: 3 },
            totalAmount: { type: 'number', example: 120 },
            amountPaid: { type: 'number', example: 50 },
            pendingAmount: { type: 'number', example: 70 },
            paymentStatus: { type: 'string', enum: ['UNPAID', 'PARTIAL', 'PAID'], example: 'PARTIAL' },
            millingStatus: { type: 'string', enum: ['RECEIVED', 'PROCESSING', 'READY', 'DELIVERED'], example: 'RECEIVED' },
            isDelivered: { type: 'boolean', example: false },
            source: { type: 'string', enum: ['MANUAL', 'VOICE'], example: 'VOICE' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        LedgerItem: {
          type: 'object',
          properties: {
            date: { type: 'string', format: 'date-time' },
            type: { type: 'string', enum: ['BILL', 'PAYMENT', 'ADJUSTMENT'], example: 'BILL' },
            description: { type: 'string', example: '40 kg गेहूं पिसाई (टोकन #24)' },
            billedAmount: { type: 'number', example: 120 },
            paidAmount: { type: 'number', example: 50 },
            balanceAfter: { type: 'number', example: 70 },
            paymentMethod: { type: 'string', example: 'CASH' },
          },
        },
        CustomerDashboard: {
          type: 'object',
          properties: {
            customer: { $ref: '#/components/schemas/Customer' },
            financialSummary: {
              type: 'object',
              properties: {
                pendingBalance: { type: 'number', example: 1250, description: 'कुल बकाया राशि (कितना बाकी है)' },
                status: { type: 'string', example: 'बाकी' },
                totalBilled: { type: 'number', example: 540 },
                totalPaid: { type: 'number', example: 470 },
                totalWeightMilledKg: { type: 'number', example: 75 },
                totalOrdersCount: { type: 'number', example: 3 },
              },
            },
            history: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'h1' },
                  date: { type: 'string', example: '20-11-2026' },
                  tokenNumber: { type: 'string', example: '#24' },
                  itemLabel: { type: 'string', example: 'गेहूं (पिसाई)' },
                  weightKg: { type: 'number', example: 25 },
                  ratePerKg: { type: 'number', example: 4 },
                  totalAmount: { type: 'number', example: 100 },
                  amountPaid: { type: 'number', example: 0 },
                  pendingAmount: { type: 'number', example: 100 },
                  paymentStatus: { type: 'string', example: 'बाकी' },
                  isDelivered: { type: 'boolean', example: true },
                },
              },
            },
          },
        },
        SettingsResponse: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', example: '673d1234...' },
                phone: { type: 'string', example: '9569735570' },
                ownerName: { type: 'string', example: 'पुष्पेन्द्र मौर्य' },
                chakkiName: { type: 'string', example: 'चक्की स्मार्ट AI' },
                village: { type: 'string', example: 'रामपुर' },
              },
            },
            millingRates: {
              type: 'object',
              properties: {
                wheatPisaiPerKg: { type: 'number', example: 3.5 },
                oilExtractionPerKg: { type: 'number', example: 15 },
                masalaGrindingPerKg: { type: 'number', example: 20 },
              },
            },
            voiceAudioSettings: {
              type: 'object',
              properties: {
                voiceAlerts: { type: 'boolean', example: true },
                speechRate: { type: 'number', example: 0.9 },
                language: { type: 'string', example: 'hi' },
              },
            },
            subscriptions: {
              type: 'object',
              properties: {
                chakkiPremium: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'Not active' },
                    plan: { type: 'string', example: 'Free Tier' },
                  },
                },
                smsAlertsPackage: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'Active' },
                    creditsRemaining: { type: 'number', example: 350 },
                  },
                },
              },
            },
            appInfo: {
              type: 'object',
              properties: {
                version: { type: 'string', example: '1.2.0' },
                language: { type: 'string', example: 'English / हिन्दी' },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/modules/**/*.route.js', './src/routes/*.js'],
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

module.exports = {
  swaggerUi,
  swaggerSpec,
};
