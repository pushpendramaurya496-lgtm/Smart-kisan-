const https = require('https');

/**
 * Fast2SMS Service for Kisan Sathi - Chakki Smart AI
 * Sends automated SMS receipts, delivery alerts & OTPs directly to farmers.
 */
class SmsService {
  static getApiKey() {
    return process.env.FAST2SMS_API_KEY || '';
  }

  /**
   * Core method to send SMS via Fast2SMS API
   * @param {Object} params
   * @param {string|number} params.phone - 10-digit Indian mobile number
   * @param {string} params.message - Content of SMS
   * @param {string} [params.route='q'] - 'q' for Quick SMS, 'otp' for OTP
   */
  static async sendSMS({ phone, message, route = 'q' }) {
    const apiKey = SmsService.getApiKey();
    if (!apiKey) {
      console.warn('[SmsService] FAST2SMS_API_KEY is not configured in .env');
      return { success: false, message: 'SMS API Key not configured' };
    }

    const cleanPhone = String(phone || '').replace(/[^0-9]/g, '');
    const mobile10 = cleanPhone.length > 10 ? cleanPhone.slice(-10) : cleanPhone;
    if (!mobile10 || mobile10.length !== 10) {
      console.warn('[SmsService] Invalid mobile number:', phone);
      return { success: false, message: 'अमान्य मोबाइल नंबर' };
    }

    return new Promise((resolve) => {
      const postData = JSON.stringify({
        route,
        message,
        language: 'english',
        flash: 0,
        numbers: mobile10,
      });

      const options = {
        hostname: 'www.fast2sms.com',
        path: '/dev/bulkV2',
        method: 'POST',
        headers: {
          authorization: apiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode === 200 && (parsed.return === true || parsed.status_code === 200)) {
              console.log(`[SmsService] SMS sent successfully to ${mobile10}`);
              resolve({ success: true, data: parsed });
            } else {
              console.warn(`[SmsService] Fast2SMS Response (${res.statusCode}):`, parsed.message || data);
              resolve({ success: false, message: parsed.message || 'SMS भेजने में विफलता', data: parsed });
            }
          } catch (e) {
            resolve({ success: false, message: data });
          }
        });
      });

      req.on('error', (err) => {
        console.error('[SmsService] Request error:', err.message);
        resolve({ success: false, message: err.message });
      });

      req.setTimeout(8000, () => {
        req.destroy();
        resolve({ success: false, message: 'SMS Request Timeout' });
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * 1. नई पिसाई दर्ज होने पर किसान को टोकन व बिल रसीद SMS
   */
  static async sendMillingSlipSMS({
    phone,
    customerName = 'किसान ग्राहक',
    tokenNumber = '1',
    weightKg = 0,
    itemLabel = 'पिसाई',
    totalAmount = 0,
    amountPaid = 0,
    pendingAmount = 0,
    millName = 'किसान साथी आटा चक्की',
  }) {
    const paymentText = pendingAmount > 0
      ? `जमा: Rs.${amountPaid}, बाकी: Rs.${pendingAmount}`
      : `जमा: Rs.${amountPaid} (चुकता)`;

    const message = `Namaste ${customerName}, ${millName} par aapka order darj hua.\nToken: #${tokenNumber}\nMaal: ${weightKg} KG (${itemLabel})\nKul Bill: Rs.${totalAmount}\n${paymentText}\nDhanyawad!`;

    return SmsService.sendSMS({ phone, message });
  }

  /**
   * 2. माल तैयार होने / डिलीवरी की सूचना SMS
   */
  static async sendDeliverySMS({
    phone,
    customerName = 'किसान ग्राहक',
    itemLabel = 'आटा',
    weightKg = 0,
    millName = 'किसान साथी आटा चक्की',
  }) {
    const message = `Namaste ${customerName}, aapka ${weightKg} KG ${itemLabel} pis kar taiyar hai. Kripya ${millName} se apna maal le jayein. Dhanyawad!`;

    return SmsService.sendSMS({ phone, message });
  }

  /**
   * 3. खाता उधारी भुगतान की पक्की रसीद SMS
   */
  static async sendDebtPaymentSMS({
    phone,
    customerName = 'किसान ग्राहक',
    amountPaid = 0,
    pendingBalance = 0,
    millName = 'किसान साथी आटा चक्की',
  }) {
    const balText = pendingBalance > 0
      ? `Shesh Baaki: Rs.${pendingBalance}`
      : 'Aapka khata bilkul saaf (Chukta) hai';

    const message = `Namaste ${customerName}, ${millName} par aapke Rs.${amountPaid} jama kiye gaye.\n${balText}.\nDhanyawad!`;

    return SmsService.sendSMS({ phone, message });
  }
}

module.exports = SmsService;
