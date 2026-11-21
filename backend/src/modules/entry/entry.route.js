const express = require('express');
const router = express.Router();
const {
  createEntry,
  searchForPickup,
  deliverEntry,
  getEntries,
} = require('./entry.controller');
const { protect } = require('../auth/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Milling Entries
 *   description: अनाज पिसाई, तेल व मसाला एंट्री, डिलीवरी व भुगतान
 */

/**
 * @swagger
 * /entries:
 *   post:
 *     summary: 1. नई पिसाई एंट्री दर्ज करें (बोलकर या लिखकर)
 *     tags: [Milling Entries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - village
 *               - weightKg
 *             properties:
 *               name:
 *                 type: string
 *                 example: "रामलाल शर्मा"
 *               village:
 *                 type: string
 *                 example: "रामपुरा"
 *               weightKg:
 *                 type: number
 *                 example: 40
 *               phone:
 *                 type: string
 *                 example: "9829012345"
 *               itemType:
 *                 type: string
 *                 enum: [WHEAT, OIL, MASALA, OTHER]
 *                 example: "WHEAT"
 *               ratePerKg:
 *                 type: number
 *                 example: 3
 *               amountPaid:
 *                 type: number
 *                 example: 0
 *               source:
 *                 type: string
 *                 enum: [MANUAL, VOICE]
 *                 example: "VOICE"
 *     responses:
 *       201:
 *         description: एंट्री व टोकन नंबर सफलतापूर्वक जनरेट हुआ
 */
router.post('/', protect, createEntry);

/**
 * @swagger
 * /entries/pickup-search:
 *   get:
 *     summary: 2. ग्राहक जब माल लेने आए (नाम, गांव या टोकन से सर्च करें)
 *     tags: [Milling Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: ग्राहक का नाम
 *       - in: query
 *         name: village
 *         schema:
 *           type: string
 *         description: गांव का नाम
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         description: बोरी / टोकन नंबर (उदा. 12)
 *     responses:
 *       200:
 *         description: ग्राहक का खाता और तैयार माल की सूची
 */
router.get('/pickup-search', protect, searchForPickup);

/**
 * @swagger
 * /entries/{id}/deliver:
 *   post:
 *     summary: 3. माल सुपुर्द करें और भुगतान (पूरा / आंशिक / उधार) दर्ज करें
 *     tags: [Milling Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ऑर्डर ID
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
 *                 example: 50
 *                 description: प्राप्त राशि (0 यदि पूरा उधार हो)
 *               paymentMethod:
 *                 type: string
 *                 enum: [CASH, UPI, CREDIT]
 *                 example: "CASH"
 *     responses:
 *       200:
 *         description: माल सुपुर्द हुआ और खाता अपडेट हुआ
 */
router.post('/:id/deliver', protect, deliverEntry);

/**
 * @swagger
 * /entries:
 *   get:
 *     summary: 4. हाल ही की पिसाई एंट्रियां देखें
 *     tags: [Milling Entries]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: एंट्री सूची
 */
router.get('/', protect, getEntries);

module.exports = router;
