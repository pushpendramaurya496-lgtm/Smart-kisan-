const mongoose = require('mongoose');
const Entry = require('./entry.model');
const Customer = require('../customer/customer.model');
const User = require('../auth/auth.model');

class EntryService {
  /**
   * Helper: Resolve or create default Chakki owner
   */
  static async resolveOwner(ownerId) {
    if (ownerId) {
      const owner = await User.findById(ownerId);
      if (owner) return owner;
    }
    let owner = (await User.findOne({ isActive: true })) || (await User.findOne());
    if (!owner) {
      owner = await User.create({
        name: 'चक्की संचालक',
        phone: '9876543210',
        businessName: 'किसान आटा चक्की',
        village: 'रामपुरा',
        isActive: true,
        defaultRates: {
          wheatPisaiPerKg: 3.5,
          oilExtractionPerKg: 7,
          masalaGrindingPerKg: 15,
        },
      });
    }
    return owner;
  }

  /**
   * 1. Create New Milling Entry (Manual or Voice)
   */
  static async createEntry(ownerId, data) {
    const owner = await EntryService.resolveOwner(ownerId);
    ownerId = owner._id;

    const normalizedName = data.name.trim();
    const normalizedVillage = data.village.trim();
    const phone = data.phone ? data.phone.trim() : '';

    // 1. Find or create Customer
    let customer = null;

    // A) If a specific valid MongoDB customerId was passed
    if (data.customerId && mongoose.Types.ObjectId.isValid(data.customerId)) {
      customer = await Customer.findOne({ _id: data.customerId, ownerId });
    }

    // B) If not creating a separate customer profile, try matching by phone or (name + village)
    if (!customer && !data.createNewCustomer) {
      if (phone) {
        // High accuracy: match by phone
        customer = await Customer.findOne({ ownerId, phone });
      }
      if (!customer && normalizedName) {
        // Match by exact Name + Village
        customer = await Customer.findOne({
          ownerId,
          name: new RegExp(`^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
          village: new RegExp(`^${normalizedVillage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
        });
      }
      if (!customer && normalizedName) {
        // Fallback match by Name only
        customer = await Customer.findOne({
          ownerId,
          name: new RegExp(`^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
        });
      }
    }

    // C) If still no customer found, or createNewCustomer was requested, create a brand-new Customer
    if (!customer) {
      customer = await Customer.create({
        ownerId,
        name: normalizedName,
        village: normalizedVillage,
        phone,
        pendingBalance: 0,
      });
    } else if (phone && !customer.phone) {
      customer.phone = phone;
      await customer.save();
    }

    // 2. Resolve Rate Per Kg
    let ratePerKg = data.ratePerKg;
    if (ratePerKg === undefined || ratePerKg === null) {
      const itemType = data.itemType || 'WHEAT';
      if (itemType === 'OIL') {
        ratePerKg = owner.defaultRates?.oilExtractionPerKg || 15;
      } else if (itemType === 'MASALA') {
        ratePerKg = owner.defaultRates?.masalaGrindingPerKg || 20;
      } else if (itemType === 'DARRA') {
        ratePerKg = owner.defaultRates?.darraPisaiPerKg || 4;
      } else if (itemType === 'MATAR_BESAN') {
        ratePerKg = owner.defaultRates?.matarBesanPerKg || 6;
      } else if (itemType === 'CHANA_BESAN') {
        ratePerKg = owner.defaultRates?.chanaBesanPerKg || 7;
      } else if (itemType === 'DHANIYA') {
        ratePerKg = owner.defaultRates?.dhaniyaPerKg || 20;
      } else if (itemType === 'MAKKA_AATA') {
        ratePerKg = owner.defaultRates?.makkaAataPerKg || 4.5;
      } else if (itemType === 'CHAWAL') {
        ratePerKg = owner.defaultRates?.chawalPerKg || 4;
      } else {
        ratePerKg = owner.defaultRates?.wheatPisaiPerKg || 3.5;
      }
    }

    // 3. Item Label
    const itemType = data.itemType || 'WHEAT';
    let itemLabel = data.itemLabel;
    if (!itemLabel) {
      if (itemType === 'OIL') itemLabel = 'सरसों तेल पिराई';
      else if (itemType === 'MASALA') itemLabel = 'मसाला पिसाई';
      else if (itemType === 'DARRA') itemLabel = 'दर्रा पिसाई';
      else if (itemType === 'MATAR_BESAN') itemLabel = 'मटर बेसन';
      else if (itemType === 'CHANA_BESAN') itemLabel = 'चना बेसन';
      else if (itemType === 'DHANIYA') itemLabel = 'धनिया पिसाई';
      else if (itemType === 'MAKKA_AATA') itemLabel = 'मक्का आटा';
      else if (itemType === 'CHAWAL') itemLabel = 'चावल पिसाई';
      else itemLabel = 'गेहूं पिसाई';
    }

    // 4. Financial Calculations
    const weightKg = parseFloat(data.weightKg);
    const totalAmount = Math.round(weightKg * ratePerKg * 100) / 100;
    const amountPaid = Math.min(totalAmount, parseFloat(data.amountPaid) || 0);
    const pendingAmount = Math.max(0, totalAmount - amountPaid);

    let paymentStatus = 'UNPAID';
    if (amountPaid >= totalAmount) {
      paymentStatus = 'PAID';
    } else if (amountPaid > 0) {
      paymentStatus = 'PARTIAL';
    }

    // 5. Generate Daily Sequential Token Number (#1, #2, ...)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const countToday = await Entry.countDocuments({
      ownerId,
      createdAt: { $gte: startOfDay },
    });
    const tokenNumber = String(countToday + 1);

    const resolvedPaymentMethod = data.paymentMethod || (amountPaid >= totalAmount ? 'CASH' : (amountPaid > 0 ? 'CASH' : 'CREDIT'));

    // 6. Create Entry Record
    const entry = await Entry.create({
      ownerId,
      customerId: customer._id,
      tokenNumber,
      customerName: customer.name,
      village: customer.village,
      phone: customer.phone,
      itemType,
      itemLabel,
      weightKg,
      ratePerKg,
      totalAmount,
      amountPaid,
      pendingAmount,
      paymentStatus,
      paymentMethod: resolvedPaymentMethod,
      millingStatus: pendingAmount === 0 ? 'DELIVERED' : 'RECEIVED',
      isDelivered: pendingAmount === 0,
      handoverDate: pendingAmount === 0 ? new Date() : null,
      source: data.source || 'MANUAL',
      notes: data.notes || '',
    });

    // 7. Update Customer Ledger & Outstanding Debt
    customer.pendingBalance = Math.round((Number(customer.pendingBalance || 0) + pendingAmount) * 100) / 100;
    customer.totalOrdersCount += 1;
    customer.totalWeightMilledKg = Math.round((Number(customer.totalWeightMilledKg || 0) + weightKg) * 100) / 100;
    customer.totalBilledAmount = Math.round((Number(customer.totalBilledAmount || 0) + totalAmount) * 100) / 100;
    customer.totalPaidAmount = Math.round((Number(customer.totalPaidAmount || 0) + amountPaid) * 100) / 100;
    customer.lastMilledItem = itemLabel;
    customer.lastMilledWeight = weightKg;
    customer.lastVisitDate = new Date();
    if (phone && (!customer.phone || customer.phone !== phone)) {
      customer.phone = phone;
    }

    customer.ledgerHistory.unshift({
      date: new Date(),
      type: 'BILL',
      orderId: entry._id,
      description: `${weightKg} kg ${itemLabel} (टोकन #${tokenNumber})`,
      billedAmount: totalAmount,
      paidAmount: amountPaid,
      balanceAfter: customer.pendingBalance,
      paymentMethod: resolvedPaymentMethod,
      notes: data.notes || '',
    });

    await customer.save();

    // Send SMS receipt to customer asynchronously if mobile number exists
    if (customer.phone) {
      try {
        const SmsService = require('../../services/sms.service');
        SmsService.sendMillingSlipSMS({
          phone: customer.phone,
          customerName: customer.name,
          tokenNumber,
          weightKg,
          itemLabel,
          totalAmount,
          amountPaid,
          pendingAmount,
        }).catch((err) => console.warn('[EntryService] SMS send background error:', err.message));
      } catch (smsErr) {
        console.warn('[EntryService] SMS service error:', smsErr.message);
      }
    }

    return {
      entry,
      customer: {
        id: customer._id,
        name: customer.name,
        village: customer.village,
        phone: customer.phone,
        pendingBalance: customer.pendingBalance,
      },
      tokenNumber,
      message: `टोकन #${tokenNumber} सफलतापूर्वक दर्ज हुआ`,
    };
  }

  /**
   * 2. Search Customers & Pending Milling Orders for Delivery / Pickup
   */
  static async searchForPickup(ownerId, filters) {
    const owner = await EntryService.resolveOwner(ownerId);
    ownerId = owner._id;
    const { name, village, token, phone } = filters;

    // Search by Token Number directly
    if (token && token.trim()) {
      const cleanToken = token.trim().replace('#', '');
      const entry = await Entry.findOne({
        ownerId,
        tokenNumber: cleanToken,
      }).sort({ createdAt: -1 });

      if (entry) {
        const customer = await Customer.findOne({ _id: entry.customerId, ownerId });
        const allCustomerPendingEntries = await Entry.find({
          ownerId,
          customerId: entry.customerId,
          isDelivered: false,
        }).sort({ createdAt: -1 });

        return [
          {
            customer: {
              id: customer._id,
              name: customer.name,
              village: customer.village,
              phone: customer.phone,
              pendingBalance: customer.pendingBalance,
            },
            matchedEntry: entry,
            activeEntries: allCustomerPendingEntries,
            summary: {
              totalBags: allCustomerPendingEntries.length,
              todayOrderAmount: entry.totalAmount,
              customerTotalDebt: customer.pendingBalance,
            },
          },
        ];
      }
    }

    // Build query for Customer search by Name and/or Village and/or Phone
    const customerQuery = { ownerId };

    if (name && name.trim()) {
      customerQuery.name = { $regex: name.trim(), $options: 'i' };
    }
    if (village && village.trim()) {
      customerQuery.village = { $regex: village.trim(), $options: 'i' };
    }
    if (phone && phone.trim()) {
      customerQuery.phone = { $regex: phone.trim(), $options: 'i' };
    }

    const customers = await Customer.find(customerQuery).limit(10);

    const results = [];
    for (const cust of customers) {
      // Find active uncollected entries for this customer
      const activeEntries = await Entry.find({
        ownerId,
        customerId: cust._id,
        isDelivered: false,
      }).sort({ createdAt: -1 });

      // Recent completed entries for context
      const completedEntries = await Entry.find({
        ownerId,
        customerId: cust._id,
        isDelivered: true,
      })
        .sort({ handoverDate: -1 })
        .limit(3);

      const totalActiveWeightKg = activeEntries.reduce((sum, e) => sum + e.weightKg, 0);
      const totalActiveAmount = activeEntries.reduce((sum, e) => sum + e.totalAmount, 0);

      results.push({
        customer: {
          id: cust._id,
          name: cust.name,
          village: cust.village,
          phone: cust.phone,
          pendingBalance: cust.pendingBalance,
          lastVisitDate: cust.lastVisitDate,
        },
        activeEntries,
        recentCompletedEntries: completedEntries,
        summary: {
          totalActiveBags: activeEntries.length,
          totalActiveWeightKg,
          totalActiveAmount,
          customerTotalDebt: cust.pendingBalance,
        },
      });
    }

    return results;
  }

  /**
   * 3. Handover / Deliver Milling Order & Settle Payment
   */
  static async deliverEntry(ownerId, entryId, data) {
    const owner = await EntryService.resolveOwner(ownerId);
    ownerId = owner._id;

    let entry = null;
    if (entryId && mongoose.Types.ObjectId.isValid(entryId)) {
      entry = await Entry.findOne({ _id: entryId, ownerId });
      if (!entry) {
        // Maybe entryId was actually a customerId
        entry = await Entry.findOne({ customerId: entryId, ownerId, isDelivered: false }).sort({ createdAt: -1 });
      }
    }
    if (!entry && data?.customerName) {
      entry = await Entry.findOne({
        customerName: new RegExp(`^${data.customerName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
        ownerId,
        isDelivered: false,
      }).sort({ createdAt: -1 });
    }
    if (!entry && entryId && mongoose.Types.ObjectId.isValid(entryId)) {
      // Fallback: check without ownerId if not matched
      entry = await Entry.findOne({ _id: entryId });
      if (!entry) {
        entry = await Entry.findOne({ customerId: entryId, isDelivered: false }).sort({ createdAt: -1 });
      }
    }
    if (!entry) {
      throw new Error('पिसाई ऑर्डर रिकॉर्ड नहीं मिला');
    }
    if (entry.isDelivered) {
      return { entry, message: 'यह माल पहले ही सुपुर्द किया जा चुका है' };
    }

    let customer = await Customer.findOne({ _id: entry.customerId });
    if (!customer && ownerId) {
      customer = await Customer.findOne({ _id: entry.customerId, ownerId });
    }

    const amountPaid = parseFloat(data.amountPaid) || 0;
    const paymentMethod = data.paymentMethod || 'CASH';

    // Update Entry
    entry.amountPaid += amountPaid;
    entry.pendingAmount = Math.max(0, entry.totalAmount - entry.amountPaid);
    entry.paymentStatus =
      entry.pendingAmount === 0 ? 'PAID' : entry.amountPaid > 0 ? 'PARTIAL' : 'UNPAID';
    entry.paymentMethod = paymentMethod;
    entry.isDelivered = true;
    entry.millingStatus = 'DELIVERED';
    entry.handoverDate = new Date();
    if (data.notes) entry.notes = data.notes;
    await entry.save();

    // Update Customer Ledger Balance
    // When entry was created, `customer.pendingBalance` was increased by entry's pending debt.
    // Now customer is paying `amountPaid` at pickup, so balance decreases by `amountPaid`.
    customer.pendingBalance -= amountPaid;
    customer.totalPaidAmount += amountPaid;
    customer.lastVisitDate = new Date();

    customer.ledgerHistory.unshift({
      date: new Date(),
      type: 'PAYMENT',
      orderId: entry._id,
      description: `माल सुपुर्दगी भुगतान (टोकन #${entry.tokenNumber})`,
      billedAmount: 0,
      paidAmount: amountPaid,
      balanceAfter: customer.pendingBalance,
      paymentMethod,
      notes: data.notes || '',
    });
    await customer.save();

    // Send delivery / pickup completion SMS to customer if mobile number exists
    if (customer.phone) {
      try {
        const SmsService = require('../../services/sms.service');
        SmsService.sendDeliverySMS({
          phone: customer.phone,
          customerName: customer.name,
          itemLabel: entry.itemLabel,
          weightKg: entry.weightKg,
        }).catch((err) => console.warn('[EntryService] Delivery SMS send background error:', err.message));
      } catch (smsErr) {}
    }

    // Hindi WhatsApp Receipt Text
    const dateFormatted = new Date().toLocaleDateString('hi-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const receiptText = `🌾 *किसान साथी | चक्की स्मार्ट AI*\n━━━━━━━━━━━━━━━━━━━━\n👤 *ग्राहक:* ${customer.name} (${customer.village})\n📅 *दिनांक:* ${dateFormatted}\n📦 *माल:* ${entry.weightKg} किलो ${entry.itemLabel} (टोकन #${entry.tokenNumber})\n💰 *कुल बिल:* ₹${entry.totalAmount}\n💵 *जमा किया:* ₹${amountPaid} (${paymentMethod})\n${
      customer.pendingBalance > 0
        ? `🔴 *कुल शेष बाकी:* ₹${customer.pendingBalance}`
        : `🟢 *खाता साफ:* कोई बकाया नहीं`
    }\n━━━━━━━━━━━━━━━━━━━━\n✅ माल सुपुर्द हुआ। धन्यवाद!`;

    return {
      entry,
      customer: {
        id: customer._id,
        name: customer.name,
        village: customer.village,
        phone: customer.phone,
        pendingBalance: customer.pendingBalance,
      },
      receiptText,
      message: 'माल सफलतापूर्वक सुपुर्द किया गया',
    };
  }

  /**
   * 4. Get Recent Entries for Dashboard & Feed
   */
  static async getEntries(ownerId, filters = {}) {
    const owner = await EntryService.resolveOwner(ownerId);
    ownerId = owner._id;
    const query = { ownerId };
    if (filters.isDelivered !== undefined) {
      query.isDelivered = filters.isDelivered === 'true' || filters.isDelivered === true;
    }
    if (filters.millingStatus) {
      query.millingStatus = filters.millingStatus;
    }

    const limit = parseInt(filters.limit, 10) || 20;
    const entries = await Entry.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    return entries;
  }
}

module.exports = EntryService;
