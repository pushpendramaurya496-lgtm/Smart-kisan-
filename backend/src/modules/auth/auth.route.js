const express = require('express');
const router = express.Router();
const {
  sendOTP,
  verifyOTP,
  completeProfile,
  updateProfile,
  loginWithPIN,
  resetPIN,
  getMe,
  getSettings,
  updateSettings,
  logoutUser,
} = require('./auth.controller');
const { protect } = require('./auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: चक्की मालिक लॉगिन, OTP सत्यापन और प्रोफाइल निर्माण
 */

/**
 * @swagger
 * /auth/send-otp:
 *   post:
 *     summary: 1. मोबाइल नंबर पर OTP भेजें
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *                 description: 10 अंकों का भारतीय मोबाइल नंबर
 *     responses:
 *       200:
 *         description: OTP सफलतापूर्वक भेजा गया
 *       400:
 *         description: अमान्य मोबाइल नंबर
 */
router.post('/send-otp', sendOTP);

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: 2. OTP सत्यापित करें (लॉगिन टोकन प्राप्त करें)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - otp
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               otp:
 *                 type: string
 *                 example: "1234"
 *                 description: 4-अंकीय OTP कोड
 *     responses:
 *       200:
 *         description: OTP सही है, JWT टोकन जारी हुआ
 *       400:
 *         description: गलत OTP या समय समाप्त
 */
router.post('/verify-otp', verifyOTP);

/**
 * @swagger
 * /auth/complete-profile:
 *   post:
 *     summary: 3. चक्की मालिक की प्रोफाइल बनाएं / पूरी करें
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ownerName
 *               - chakkiName
 *             properties:
 *               ownerName:
 *                 type: string
 *                 example: "रामलाल शर्मा"
 *               chakkiName:
 *                 type: string
 *                 example: "श्री गणेश चक्की"
 *               village:
 *                 type: string
 *                 example: "रामपुरा, सीकर"
 *               mpin:
 *                 type: string
 *                 example: "1234"
 *                 description: दैनिक ऐप अनलॉक के लिए 4 अंकों का पिन
 *               servicesOffered:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["PISAI", "OIL", "MASALA"]
 *     responses:
 *       200:
 *         description: प्रोफाइल सफलतापूर्वक बन गई
 *       401:
 *         description: अनधिकृत (Token Missing)
 */
router.post('/complete-profile', protect, completeProfile);

/**
 * @swagger
 * /auth/profile:
 *   put:
 *     summary: 3.1. चक्की मालिक प्रोफाइल व फोटो अपडेट करें
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ownerName:
 *                 type: string
 *                 example: "रामलाल शर्मा"
 *               chakkiName:
 *                 type: string
 *                 example: "श्री गणेश चक्की"
 *               village:
 *                 type: string
 *                 example: "रामपुरा, सीकर"
 *               profileImage:
 *                 type: string
 *                 description: बेस64 या फोटो URL
 *               servicesOffered:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["PISAI", "OIL", "MASALA"]
 *               defaultRates:
 *                 type: object
 *                 properties:
 *                   wheatPisaiPerKg:
 *                     type: number
 *                     example: 3
 *                   oilExtractionPerKg:
 *                     type: number
 *                     example: 7
 *                   masalaGrindingPerKg:
 *                     type: number
 *                     example: 15
 *     responses:
 *       200:
 *         description: प्रोफाइल और फोटो सफलतापूर्वक अपडेट हुई
 *       401:
 *         description: अनधिकृत
 */
router.put('/profile', protect, updateProfile);

/**
 * @swagger
 * /auth/login-pin:
 *   post:
 *     summary: 4. 4-अंकीय MPIN से तुरंत लॉगिन करें
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - mpin
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               mpin:
 *                 type: string
 *                 example: "1234"
 *     responses:
 *       200:
 *         description: MPIN सही, लॉगिन सफल
 *       400:
 *         description: गलत MPIN या अमान्य विवरण
 */
router.post('/login-pin', loginWithPIN);

/**
 * @swagger
 * /auth/reset-pin:
 *   post:
 *     summary: 5. पिन भूलने पर OTP से नया MPIN सेट करें (Forgot PIN)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - otp
 *               - newMpin
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               otp:
 *                 type: string
 *                 example: "1234"
 *               newMpin:
 *                 type: string
 *                 example: "4321"
 *     responses:
 *       200:
 *         description: नया PIN सफलतापूर्वक सेट हुआ
 *       400:
 *         description: गलत OTP या अमान्य नया PIN
 */
router.post('/reset-pin', resetPIN);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: 4. वर्तमान लॉग-इन चक्की मालिक का विवरण प्राप्त करें
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: प्रोफाइल विवरण
 *       401:
 *         description: अनधिकृत
 */
router.get('/me', protect, getMe);

/**
 * @swagger
 * /auth/settings:
 *   get:
 *     summary: 6. सेटिंग्स और गतिविधि कॉन्फ़िगरेशन प्राप्त करें (Settings and Activity)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: सेटिंग्स और सब्सक्रिप्शन विवरण
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SettingsResponse'
 *       401:
 *         description: अनधिकृत
 *   put:
 *     summary: 7. सेटिंग्स अपडेट करें (Update Milling Rates & Profile)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ownerName:
 *                 type: string
 *                 example: "पुष्पेन्द्र मौर्य"
 *               chakkiName:
 *                 type: string
 *                 example: "श्री गणेश आटा चक्की"
 *               millingRates:
 *                 type: object
 *                 properties:
 *                   wheatPisaiPerKg: { type: number, example: 3.5 }
 *                   oilExtractionPerKg: { type: number, example: 15 }
 *                   masalaGrindingPerKg: { type: number, example: 20 }
 *     responses:
 *       200:
 *         description: सेटिंग्स सफलतापूर्वक अपडेट हुई
 *
 * /auth/logout:
 *   post:
 *     summary: 8. चक्की मालिक अकाउंट लॉगआउट करें (Logout)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: सफलतापूर्वक लॉगआउट हुआ
 */
router.get('/settings', protect, getSettings);
router.put('/settings', protect, updateSettings);
router.post('/logout', protect, logoutUser);

module.exports = router;
