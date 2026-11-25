const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getEarningsBreakdown,
  getMillingBreakdown,
  getPendingBreakdown,
  getCustomersBreakdown,
  getDeliveryHistory,
} = require('./dashboard.controller');
const { optionalProtect } = require('../auth/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Dashboard & Analytics
 *   description: चक्की डैशबोर्ड, कुल पिसाई, कमाई, उधारी और डिलीवरी आंकड़े
 */

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: 1. मुख्य डैशबोर्ड आंकड़े (आज की पिसाई, कुल ग्राहक, बकाया, आज की कमाई, नकद व ऑनलाइन)
 *     tags: [Dashboard & Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: डैशबोर्ड के लाइव आंकड़े प्राप्त हुए
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     todayPisaiKg: { type: number, example: 450 }
 *                     totalCustomers: { type: number, example: 68 }
 *                     pendingDebt: { type: number, example: 1420 }
 *                     todayEarnings: { type: number, example: 3450 }
 *                     cashReceived: { type: number, example: 2850 }
 *                     onlineReceived: { type: number, example: 600 }
 *                     todayAdded: { type: number, example: 12 }
 */
router.get('/stats', optionalProtect, getDashboardStats);

/**
 * @swagger
 * /dashboard/earnings:
 *   get:
 *     summary: 2. कमाई का विस्तृत विवरण (Today / Weekly / Monthly / Total / Custom Date)
 *     tags: [Dashboard & Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, yesterday, weekly, monthly, total]
 *           default: today
 *         description: समय सीमा (उदा. today, weekly, monthly, total)
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           example: "2026-11-24"
 *         description: किसी विशिष्ट तारीख के आंकड़े
 *     responses:
 *       200:
 *         description: कुल कमाई व फसलवार ब्रेकडाउन (तेल, आटा, हल्दी, दर्रा)
 */
router.get('/earnings', optionalProtect, getEarningsBreakdown);

/**
 * @swagger
 * /dashboard/milling:
 *   get:
 *     summary: 3. आज व समयावधि की पिसाई का विवरण (वजन, दर, बोरी संख्या)
 *     tags: [Dashboard & Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, yesterday, weekly, monthly, total]
 *           default: today
 *     responses:
 *       200:
 *         description: कुल पिसाई आंकड़े व फसलवार विवरण
 */
router.get('/milling', optionalProtect, getMillingBreakdown);

/**
 * @swagger
 * /dashboard/pending:
 *   get:
 *     summary: 4. कुल बाकी हिसाब / उधारी रिपोर्ट (सभी उधारी वाले ग्राहक)
 *     tags: [Dashboard & Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: ग्राहक का नाम या गांव
 *     responses:
 *       200:
 *         description: बकाया उधारी वाले सभी ग्राहकों की सूची व कुल बकाया
 */
router.get('/pending', optionalProtect, getPendingBreakdown);

/**
 * @swagger
 * /dashboard/customers:
 *   get:
 *     summary: 5. कुल पंजीकृत ग्राहक व उनकी पूरी सूची
 *     tags: [Dashboard & Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, weekly, monthly, all]
 *           default: all
 *     responses:
 *       200:
 *         description: ग्राहकों की सूची व कुल आंकड़े
 */
router.get('/customers', optionalProtect, getCustomersBreakdown);

/**
 * @swagger
 * /dashboard/deliveries:
 *   get:
 *     summary: 6. डिलीवरी हिस्ट्री - सामान ले जा चुके ग्राहकों का रिकॉर्ड
 *     tags: [Dashboard & Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, weekly, monthly, all]
 *           default: today
 *         description: अवधि (आज, इस हफ्ते, इस महीने, सभी)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: नाम या गांव से खोजें
 *     responses:
 *       200:
 *         description: डिलीवर हो चुके माल का रिकॉर्ड, जमा/बाकी राशि व डिलीवरी समय
 */
router.get('/deliveries', optionalProtect, getDeliveryHistory);

module.exports = router;
