const Customer = require('./customer.model');
const Entry = require('../entry/entry.model');
const User = require('../auth/auth.model');

class CustomerService {
  /**
   * Helper: Resolve active Chakki owner ID
   */
  static async resolveOwnerId(ownerId) {
    if (ownerId) return ownerId;
    const user = (await User.findOne({ isActive: true })) || (await User.findOne());
    return user ? user._id : null;
  }

  /**
   * 1. Search Customers by Name, Village or Phone
   */
  static async searchCustomers(ownerId, filters) {
    const resolvedOwnerId = await CustomerService.resolveOwnerId(ownerId);
    const { query, village } = filters;
    const filterObj = resolvedOwnerId ? { ownerId: resolvedOwnerId } : {};

    if (query && query.trim()) {
      const clean = query.trim();
      filterObj.$or = [
        { name: { $regex: clean, $options: 'i' } },
        { phone: { $regex: clean, $options: 'i' } },
        { village: { $regex: clean, $options: 'i' } },
      ];
    }

    if (village && village.trim()) {
      filterObj.village = { $regex: village.trim(), $options: 'i' };
    }

    const customers = await Customer.find(filterObj)
      .sort({ lastVisitDate: -1 })
      .limit(30);

    return customers;
  }

  /**
   * 2. Voice Search Customers (बोलकर ग्राहक खोजें)
   */
  static async voiceSearchCustomers(ownerId, spokenText) {
    if (!spokenText || !spokenText.trim()) {
      return [];
    }

    const resolvedOwnerId = await CustomerService.resolveOwnerId(ownerId);
    const ownerFilter = resolvedOwnerId ? { ownerId: resolvedOwnerId } : {};

    // Clean voice filler words in Hindi/Hinglish
    const cleanQuery = spokenText
      .replace(/(का खाता|खाता दिखाओ|की हिस्ट्री|कितना बाकी है|का रिकॉर्ड|गांव|गाँव|का|की|के|दिखाओ|खोजो)/gi, '')
      .trim();

    const terms = cleanQuery.split(/\s+/).filter(Boolean);
    const orConditions = [
      { name: { $regex: cleanQuery, $options: 'i' } },
      { village: { $regex: cleanQuery, $options: 'i' } },
    ];

    terms.forEach((t) => {
      if (t.length >= 2) {
        orConditions.push({ name: { $regex: t, $options: 'i' } });
        orConditions.push({ village: { $regex: t, $options: 'i' } });
      }
    });

    const customers = await Customer.find({
      ...ownerFilter,
      $or: orConditions,
    })
      .sort({ lastVisitDate: -1 })
      .limit(20);

    return {
      recognizedQuery: cleanQuery,
      totalFound: customers.length,
      customers,
    };
  }

  /**
   * 3. Get Customer Detail with Full Khata Ledger & Order History
   */
  static async getCustomerDetail(ownerId, customerId) {
    const resolvedOwnerId = await CustomerService.resolveOwnerId(ownerId);
    const query = { _id: customerId };
    if (resolvedOwnerId) query.ownerId = resolvedOwnerId;

    const customer = await Customer.findOne(query);
    if (!customer) {
      throw new Error('ग्राहक नहीं मिला');
    }

    // Fetch all orders
    const ordersQuery = { customerId };
    if (resolvedOwnerId) ordersQuery.ownerId = resolvedOwnerId;
    const orders = await Entry.find(ordersQuery)
      .sort({ createdAt: -1 })
      .limit(50);

    return {
      customer,
      orders,
      summary: {
        totalOrders: customer.totalOrdersCount,
        totalWeightMilledKg: customer.totalWeightMilledKg,
        totalBilled: customer.totalBilledAmount,
        totalPaid: customer.totalPaidAmount,
        pendingBalance: customer.pendingBalance,
      },
    };
  }

  /**
   * 4. Get Dedicated Customer Dashboard (ग्राहक डैशबोर्ड व पिछला पूरा रिकॉर्ड)
   */
  static async getCustomerDashboard(ownerId, customerId) {
    const resolvedOwnerId = await CustomerService.resolveOwnerId(ownerId);
    let customer = null;
    const baseQuery = resolvedOwnerId ? { ownerId: resolvedOwnerId } : {};

    // Check if customerId is a valid ObjectId or try finding by ID / Name
    if (typeof customerId === 'string' && customerId.match(/^[0-9a-fA-F]{24}$/)) {
      customer = await Customer.findOne({ _id: customerId, ...baseQuery });
    }
    if (!customer) {
      customer = await Customer.findOne({
        ...baseQuery,
        name: { $regex: `^${customerId}$`, $options: 'i' },
      });
    }

    if (!customer) {
      // Empty zero-state fallback customer (no fake dummy numbers)
      return {
        customer: {
          id: customerId,
          name: customerId,
          village: '',
          phone: '',
          pendingBalance: 0,
          totalWeightMilledKg: 0,
          totalBilledAmount: 0,
          totalPaidAmount: 0,
          totalOrdersCount: 0,
        },
        financialSummary: {
          pendingBalance: 0,
          status: 'साफ',
          totalBilled: 0,
          totalPaid: 0,
          totalWeightMilledKg: 0,
          totalOrdersCount: 0,
        },
        history: [],
      };
    }

    // Fetch past entries / orders
    const orderQuery = { customerId: customer._id };
    if (resolvedOwnerId) orderQuery.ownerId = resolvedOwnerId;
    const orders = await Entry.find(orderQuery)
      .sort({ createdAt: -1 })
      .limit(50);

    const formattedHistory = orders.map((o) => ({
      id: o._id,
      date: new Date(o.createdAt).toLocaleDateString('en-GB').replace(/\//g, '-'),
      tokenNumber: `#${o.tokenNumber || '1'}`,
      itemLabel: o.itemLabel || 'गेहूं पिसाई',
      weightKg: o.weightKg || 0,
      ratePerKg: o.ratePerKg || 3,
      totalAmount: o.totalAmount || 0,
      amountPaid: o.amountPaid || 0,
      pendingAmount: o.pendingAmount || 0,
      paymentStatus: o.pendingAmount > 0 ? 'बाकी' : 'चुकाया',
      isDelivered: o.isDelivered || false,
    }));

    return {
      customer: {
        id: customer._id,
        name: customer.name,
        village: customer.village,
        phone: customer.phone,
        pendingBalance: customer.pendingBalance,
        totalWeightMilledKg: customer.totalWeightMilledKg,
        totalBilledAmount: customer.totalBilledAmount,
        totalPaidAmount: customer.totalPaidAmount,
        totalOrdersCount: customer.totalOrdersCount,
      },
      financialSummary: {
        pendingBalance: customer.pendingBalance,
        status: customer.pendingBalance > 0 ? 'बाकी' : 'चुकाया',
        totalBilled: customer.totalBilledAmount,
        totalPaid: customer.totalPaidAmount,
        totalWeightMilledKg: customer.totalWeightMilledKg,
        totalOrdersCount: customer.totalOrdersCount,
      },
      history: formattedHistory,
      passbook: customer.ledgerHistory || [],
    };
  }

  /**
   * 5. Settle Debt / Receive Direct Payment into Customer Khata
   */
  static async recordDebtPayment(ownerId, customerId, data) {
    const resolvedOwnerId = await CustomerService.resolveOwnerId(ownerId);
    let customer = null;
    if (typeof customerId === 'string' && customerId.match(/^[0-9a-fA-F]{24}$/)) {
      if (resolvedOwnerId) {
        customer = await Customer.findOne({ _id: customerId, ownerId: resolvedOwnerId });
      }
      if (!customer) {
        customer = await Customer.findById(customerId);
      }
    }
    if (!customer) {
      const nameQuery = resolvedOwnerId ? { ownerId: resolvedOwnerId } : {};
      customer = await Customer.findOne({
        ...nameQuery,
        name: { $regex: `^${customerId}$`, $options: 'i' },
      });
    }
    if (!customer) {
      throw new Error('ग्राहक नहीं मिला');
    }

    const amountPaid = parseFloat(data.amountPaid);
    if (!amountPaid || amountPaid <= 0) {
      throw new Error('मान्य जमा राशि दर्ज करें');
    }

    const paymentMethod = data.paymentMethod || 'CASH';

    // Update customer debt balance
    customer.pendingBalance = Math.max(0, (customer.pendingBalance || 0) - amountPaid);
    customer.totalPaidAmount = (customer.totalPaidAmount || 0) + amountPaid;
    customer.lastVisitDate = new Date();

    // Add passbook entry
    customer.ledgerHistory.unshift({
      date: new Date(),
      type: 'PAYMENT',
      description: `उधार राशि का भुगतान (${data.notes || 'नकद जमा'})`,
      billedAmount: 0,
      paidAmount: amountPaid,
      balanceAfter: customer.pendingBalance,
      paymentMethod,
      notes: data.notes || '',
    });

    await customer.save();

    // Also update customer's unpaid entries so they reflect the payment & mark as delivered
    try {
      const Entry = require('../entry/entry.model');
      let remainingToApply = amountPaid;
      const unpaidEntries = await Entry.find({
        customerId: customer._id,
        $or: [{ pendingAmount: { $gt: 0 } }, { isDelivered: false }],
      }).sort({ createdAt: 1 });

      for (const entry of unpaidEntries) {
        const entryPending = Number(entry.pendingAmount) || Math.max(0, (Number(entry.totalAmount) || 0) - (Number(entry.amountPaid) || 0));
        const applyAmt = remainingToApply > 0 ? Math.min(entryPending, remainingToApply) : 0;
        entry.amountPaid = (Number(entry.amountPaid) || 0) + applyAmt;
        entry.pendingAmount = Math.max(0, entryPending - applyAmt);
        entry.paymentStatus = entry.pendingAmount <= 0 ? 'PAID' : 'PARTIAL';
        entry.isDelivered = true;
        entry.millingStatus = 'DELIVERED';
        entry.handoverDate = new Date();
        if (paymentMethod) entry.paymentMethod = paymentMethod;
        await entry.save();
        remainingToApply -= applyAmt;
      }
    } catch (entryErr) {
      console.warn('Failed to apply debt payment to entries:', entryErr.message);
    }

    // Send debt payment receipt SMS to customer if mobile number exists
    if (customer.phone) {
      try {
        const SmsService = require('../../services/sms.service');
        SmsService.sendDebtPaymentSMS({
          phone: customer.phone,
          customerName: customer.name,
          amountPaid,
          pendingBalance: customer.pendingBalance,
        }).catch((err) => console.warn('[CustomerService] Debt payment SMS send background error:', err.message));
      } catch (smsErr) {}
    }

    const receiptText = `🌾 *किसान साथी | चक्की स्मार्ट AI*\n━━━━━━━━━━━━━━━━━━━━\n👤 *ग्राहक:* ${customer.name} (${customer.village})\n💵 *जमा राशि:* ₹${amountPaid} (${paymentMethod})\n${
      customer.pendingBalance > 0
        ? `🔴 *शेष बकाया:* ₹${customer.pendingBalance}`
        : `🟢 *खाता साफ:* कोई बकाया नहीं`
    }\n━━━━━━━━━━━━━━━━━━━━\n✅ भुगतान दर्ज किया गया। धन्यवाद!`;

    return {
      customer,
      receiptText,
      message: `₹${amountPaid} सफलतापूर्वक जमा किए गए`,
    };
  }
}

module.exports = CustomerService;
