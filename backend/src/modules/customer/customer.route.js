const express = require('express');
const router = express.Router();
const {
  searchCustomers,
  voiceSearchCustomers,
  getCustomerDetail,
  getCustomerDashboard,
  recordDebtPayment,
} = require('./customer.controller');
const { optionalProtect } = require('../auth/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Customers & Khata
 *   description: ग्राहक बही-खाता, उधारी प्रबंधन, वॉइस सर्च व ग्राहक डैशबोर्ड
 */

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: 1. ग्राहक खोजें (नाम, गांव या फोन नंबर से)
 *     tags: [Customers & Khata]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: ग्राहक का नाम या फोन नंबर
 *       - in: query
 *         name: village
 *         schema:
 *           type: string
 *         description: गांव का नाम
 *     responses:
 *       200:
 *         description: ग्राहक सूची सफलतापूर्वक लोड हुई
 */
router.get('/', optionalProtect, searchCustomers);

/**
 * @swagger
 * /customers/voice-search:
 *   post:
 *     summary: 2. बोलकर ग्राहक खोजें (Voice AI Search)
 *     tags: [Customers & Khata]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - spokenText
 *             properties:
 *               spokenText:
 *                 type: string
 *                 example: "रामलाल रामपुर का खाता दिखाओ"
 *     responses:
 *       200:
 *         description: वॉइस सर्च द्वारा खोजे गए ग्राहक
 */
router.post('/voice-search', optionalProtect, voiceSearchCustomers);

/**
 * @swagger
 * /customers/{id}:
 *   get:
 *     summary: 3. ग्राहक का सामान्य खाता व पासबुक इतिहास देखें
 *     tags: [Customers & Khata]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ग्राहक ID
 *     responses:
 *       200:
 *         description: ग्राहक की पूरी पासबुक और आर्डर हिस्ट्री
 */
router.get('/:id', optionalProtect, getCustomerDetail);

/**
 * @swagger
 * /customers/{id}/dashboard:
 *   get:
 *     summary: 4. ग्राहक का विस्तृत डैशबोर्ड देखें (पिछला रिकॉर्ड, कितना बाकी है, पूरी हिस्ट्री)
 *     tags: [Customers & Khata]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ग्राहक ID या नाम
 *     responses:
 *       200:
 *         description: ग्राहक डैशबोर्ड डेटा (बकाया राशि, कुल वजन, संपूर्ण पिछले आर्डर व भुगतान विवरण)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     customer:
 *                       $ref: '#/components/schemas/Customer'
 *                     financialSummary:
 *                       type: object
 *                       properties:
 *                         pendingBalance: { type: number, example: 1250 }
 *                         status: { type: string, example: "बाकी" }
 *                         totalBilled: { type: number, example: 540 }
 *                         totalPaid: { type: number, example: 470 }
 *                         totalWeightMilledKg: { type: number, example: 75 }
 *                         totalOrdersCount: { type: number, example: 3 }
 *                     history:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date: { type: string, example: "20-11-2026" }
 *                           tokenNumber: { type: string, example: "#24" }
 *                           itemLabel: { type: string, example: "गेहूं (पिसाई)" }
 *                           weightKg: { type: number, example: 25 }
 *                           ratePerKg: { type: number, example: 4 }
 *                           totalAmount: { type: number, example: 100 }
 *                           amountPaid: { type: number, example: 0 }
 *                           pendingAmount: { type: number, example: 100 }
 *                           paymentStatus: { type: string, example: "बाकी" }
 */
router.get('/:id/dashboard', optionalProtect, getCustomerDashboard);

/**
 * @swagger
 * /customers/{id}/pay-debt:
 *   post:
 *     summary: 5. पुराने बाकी पैसे जमा करें (Debt Settlement)
 *     tags: [Customers & Khata]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amountPaid
 *             properties:
 *               amountPaid:
 *                 type: number
 *                 example: 70
 *               paymentMethod:
 *                 type: string
 *                 enum: [CASH, UPI]
 *                 example: "CASH"
 *               notes:
 *                 type: string
 *                 example: "नकद जमा"
 *     responses:
 *       200:
 *         description: खाता अपडेट हुआ और भुगतान दर्ज हुआ
 */
router.post('/:id/pay-debt', optionalProtect, recordDebtPayment);
router.post('/:id/debt-payment', optionalProtect, recordDebtPayment);

module.exports = router;
