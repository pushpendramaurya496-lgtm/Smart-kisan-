const mongoose = require('mongoose');
const Customer = require('../customer/customer.model');
const Entry = require('../entry/entry.model');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * Helper to build Date filter for periods
 */
const getDateFilter = (period = 'today', date) => {
  const match = {};
  const now = new Date();
  let dateLabel = 'आज की तारीख';

  if (date) {
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      match.createdAt = { $gte: start, $lte: end };
      dateLabel = d.toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' });
      return { match, dateLabel };
    }
  }

  if (period === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    match.createdAt = { $gte: start };
    dateLabel = now.toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  } else if (period === 'yesterday') {
    const start = new Date(now);
    start.setDate(now.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setDate(now.getDate() - 1);
    end.setHours(23, 59, 59, 999);
    match.createdAt = { $gte: start, $lte: end };
    dateLabel = start.toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  } else if (period === 'week' || period === 'weekly') {
    const start = new Date(now);
    start.setDate(now.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    match.createdAt = { $gte: start };
    dateLabel = 'इस सप्ताह';
  } else if (period === 'month' || period === 'monthly') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    match.createdAt = { $gte: start };
    dateLabel = now.toLocaleDateString('hi-IN', { month: 'long', year: 'numeric' });
  } else if (period === 'total') {
    dateLabel = 'समग्र रिकॉर्ड (All-Time)';
  }
  return { match, dateLabel };
};

/**
 * Get Overall Dashboard Statistics
 * GET /api/v1/dashboard/stats
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const ownerId = req.user?._id;
  const matchQuery = {};
  if (ownerId) matchQuery.ownerId = ownerId;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  let entriesToday = [];
  let totalCustCount = 0;
  let pendingAgg = [];

  if (isDbConnected()) {
    try {
      [entriesToday, totalCustCount, pendingAgg] = await Promise.all([
        Entry.find({ ...matchQuery, createdAt: { $gte: startOfDay } }),
        Customer.countDocuments(matchQuery),
        Customer.aggregate([
          { $match: matchQuery },
          { $group: { _id: null, totalPending: { $sum: '$pendingBalance' } } },
        ]),
      ]);

      // Fallback: If no records found under this specific ownerId, check all records
      if (totalCustCount === 0 && ownerId) {
        const fallbackCust = await Customer.countDocuments({});
        if (fallbackCust > 0) {
          totalCustCount = fallbackCust;
          entriesToday = await Entry.find({ createdAt: { $gte: startOfDay } });
          pendingAgg = await Customer.aggregate([
            { $group: { _id: null, totalPending: { $sum: '$pendingBalance' } } },
          ]);
        }
      }
    } catch (e) {
      console.warn('DB stats query warning:', e.message);
    }
  }

  let todayPisaiKg = 0;
  let cashReceived = 0;
  let onlineReceived = 0;

  // Calculate purely from REAL entries
  if (entriesToday.length > 0) {
    todayPisaiKg = entriesToday.reduce((sum, e) => sum + (Number(e.weightKg) || 0), 0);
    cashReceived = entriesToday
      .filter((e) => (e.paymentMethod || 'CASH') === 'CASH')
      .reduce((sum, e) => sum + (Number(e.amountPaid) || 0), 0);
    onlineReceived = entriesToday
      .filter((e) => e.paymentMethod === 'UPI')
      .reduce((sum, e) => sum + (Number(e.amountPaid) || 0), 0);
  }

  // Also include debt settlement payments received today from customers
  let todayDebtCash = 0;
  let todayDebtOnline = 0;
  if (isDbConnected()) {
    try {
      const debtPaymentAgg = await Customer.aggregate([
        { $unwind: '$ledgerHistory' },
        {
          $match: {
            'ledgerHistory.type': 'PAYMENT',
            'ledgerHistory.date': { $gte: startOfDay },
          },
        },
        {
          $group: {
            _id: '$ledgerHistory.paymentMethod',
            total: { $sum: '$ledgerHistory.paidAmount' },
          },
        },
      ]);

      debtPaymentAgg.forEach((item) => {
        const amt = Number(item.total) || 0;
        if (item._id === 'UPI') {
          todayDebtOnline += amt;
        } else {
          todayDebtCash += amt;
        }
      });
    } catch (e) {
      console.warn('Debt payment aggregation warning:', e.message);
    }
  }

  cashReceived += todayDebtCash;
  onlineReceived += todayDebtOnline;
  // Today's total earnings = total cash + online money received today
  const todayEarnings = cashReceived + onlineReceived;

  // Count repeat customer entries today: when a customer visits/orders again today
  const todayCustKeySet = new Set();
  let todayRepeatVisits = 0;
  for (const e of entriesToday) {
    const k = e.customerId ? String(e.customerId) : (e.customerName || '').trim().toLowerCase();
    if (k && todayCustKeySet.has(k)) {
      todayRepeatVisits += 1;
    } else if (k) {
      todayCustKeySet.add(k);
    }
  }

  // Total customer count increments on every new customer registered and repeat customer visit
  const totalCustomers = Math.max(totalCustCount || 0, entriesToday.length || 0) + todayRepeatVisits;
  const pendingDebt = pendingAgg.length > 0 && pendingAgg[0].totalPending ? Number(pendingAgg[0].totalPending) : 0;
  const totalExpense = 0;

  return ApiResponse.success(res, 200, {
    todayPisaiKg,
    totalCustomers,
    pendingDebt,
    totalExpense,
    todayEarnings,
    cashReceived,
    onlineReceived,
    growthPercent: 0,
    todayAdded: entriesToday.length,
    todayEntries: entriesToday.length,
  }, 'डैशबोर्ड आंकड़े सफलतापूर्वक लोड हुए');
});

/**
 * Get Real Earnings Breakdown for Today / Weekly / Monthly / Total / Custom Date
 * GET /api/v1/dashboard/earnings
 */
const getEarningsBreakdown = asyncHandler(async (req, res) => {
  const ownerId = req.user?._id;
  const { period = 'today', date } = req.query;

  const { match: matchQuery, dateLabel } = getDateFilter(period, date);
  if (ownerId) matchQuery.ownerId = ownerId;

  let periodTitle = 'आज की कुल कमाई';
  if (period === 'weekly' || period === 'week') periodTitle = 'इस हफ्ते की कुल कमाई';
  else if (period === 'monthly' || period === 'month') periodTitle = 'इस महीने की कुल कमाई';
  else if (period === 'total') periodTitle = 'अब तक की कुल कमाई';
  else if (date) periodTitle = `${dateLabel} की कुल कमाई`;

  let entries = [];
  if (isDbConnected()) {
    try {
      entries = await Entry.find(matchQuery);
    } catch (dbErr) {
      console.warn('MongoDB query warning in dashboard:', dbErr.message);
    }
  }

  let totalEarnings = 0;
  let totalPisaiKg = 0;
  let cashReceived = 0;
  let onlineReceived = 0;
  let pendingDebt = 0;
  const customerSet = new Set();

  const catMap = {
    OIL: { id: 'oil', name: 'तेल पिराई', customers: new Set(), weightKg: 0, amount: 0, type: 'oil' },
    MASALA: { id: 'haldi', name: 'हल्दी पिसाई', customers: new Set(), weightKg: 0, amount: 0, type: 'haldi' },
    DARRA: { id: 'darra', name: 'दर्रा पिसाई', customers: new Set(), weightKg: 0, amount: 0, type: 'darra' },
    WHEAT: { id: 'atta', name: 'आटा पिसाई', customers: new Set(), weightKg: 0, amount: 0, type: 'atta' },
    OTHER: { id: 'atta', name: 'अन्य पिसाई', customers: new Set(), weightKg: 0, amount: 0, type: 'atta' },
  };

  // Calculate STRICTLY from real entries in database (No dummy fallback!)
  if (entries.length > 0) {
    for (const e of entries) {
      const amt = Number(e.totalAmount) || 0;
      const paid = Number(e.amountPaid) || 0;
      const pending = Number(e.pendingAmount) !== undefined ? Number(e.pendingAmount) : Math.max(0, amt - paid);
      const wt = Number(e.weightKg) || 0;

      totalEarnings += amt;
      totalPisaiKg += wt;
      pendingDebt += pending;

      if ((e.paymentMethod || 'CASH') === 'UPI') {
        onlineReceived += paid;
      } else {
        cashReceived += paid;
      }

      const custKey = e.customerId ? String(e.customerId) : e.customerName;
      if (custKey) customerSet.add(custKey);

      const typeKey = (e.itemType || 'WHEAT').toUpperCase();
      const targetCat = catMap[typeKey] || catMap.WHEAT;
      targetCat.amount += amt;
      targetCat.weightKg += wt;
      if (custKey) targetCat.customers.add(custKey);
    }
  }

  // Also include debt settlement payments received in this period
  if (isDbConnected()) {
    try {
      const ledgerMatch = { 'ledgerHistory.type': 'PAYMENT' };
      if (matchQuery.createdAt) {
        ledgerMatch['ledgerHistory.date'] = matchQuery.createdAt;
      }
      const debtAgg = await Customer.aggregate([
        { $unwind: '$ledgerHistory' },
        { $match: ledgerMatch },
        {
          $group: {
            _id: '$ledgerHistory.paymentMethod',
            total: { $sum: '$ledgerHistory.paidAmount' },
          },
        },
      ]);
      debtAgg.forEach((item) => {
        const amt = Number(item.total) || 0;
        if (item._id === 'UPI') {
          onlineReceived += amt;
        } else {
          cashReceived += amt;
        }
        totalEarnings += amt;
      });
    } catch (err) {
      console.warn('Earnings debt aggregation warning:', err.message);
    }
  }

  const uniqueCustomers = customerSet.size;

  const services = [
    {
      id: 'oil',
      name: 'तेल पिराई',
      customers: `${catMap.OIL.customers.size} ग्राहक`,
      weightKg: `${catMap.OIL.weightKg} KG`,
      amount: `₹${catMap.OIL.amount.toLocaleString('en-IN')}`,
      type: 'oil',
    },
    {
      id: 'haldi',
      name: 'हल्दी पिसाई',
      customers: `${catMap.MASALA.customers.size} ग्राहक`,
      weightKg: `${catMap.MASALA.weightKg} KG`,
      amount: `₹${catMap.MASALA.amount.toLocaleString('en-IN')}`,
      type: 'haldi',
    },
    {
      id: 'darra',
      name: 'दर्रा पिसाई',
      customers: `${catMap.DARRA.customers.size} ग्राहक`,
      weightKg: `${catMap.DARRA.weightKg} KG`,
      amount: `₹${catMap.DARRA.amount.toLocaleString('en-IN')}`,
      type: 'darra',
    },
    {
      id: 'atta',
      name: 'आटा पिसाई',
      customers: `${catMap.WHEAT.customers.size} ग्राहक`,
      weightKg: `${catMap.WHEAT.weightKg} KG`,
      amount: `₹${catMap.WHEAT.amount.toLocaleString('en-IN')}`,
      type: 'atta',
    },
  ];

  return ApiResponse.success(res, 200, {
    period,
    periodTitle,
    dateLabel,
    totalEarning: `₹${totalEarnings.toLocaleString('en-IN')}`,
    totalEarningRaw: totalEarnings,
    stats: {
      customers: `${uniqueCustomers}`,
      pisaiKg: `${totalPisaiKg.toLocaleString('en-IN')} KG`,
      cash: `₹${cashReceived.toLocaleString('en-IN')}`,
      cashReceived: `₹${cashReceived.toLocaleString('en-IN')}`,
      online: `₹${onlineReceived.toLocaleString('en-IN')}`,
      onlineReceived: `₹${onlineReceived.toLocaleString('en-IN')}`,
    },
    payment: {
      pending: `₹${pendingDebt.toLocaleString('en-IN')}`,
      total: `₹${totalEarnings.toLocaleString('en-IN')}`,
    },
    paymentSummary: {
      pending: `₹${pendingDebt.toLocaleString('en-IN')}`,
      total: `₹${totalEarnings.toLocaleString('en-IN')}`,
    },
    services,
  }, 'पिसाई अनुसार रियल कमाई लोड हुई');
});

/**
 * Get Real Milling Breakdown for Selected Period / Date
 * GET /api/v1/dashboard/milling
 */
const getMillingBreakdown = asyncHandler(async (req, res) => {
  const ownerId = req.user?._id;
  const { period = 'today', date } = req.query;

  const { match, dateLabel } = getDateFilter(period, date);
  if (ownerId) match.ownerId = ownerId;

  let entries = [];
  if (isDbConnected()) {
    try {
      entries = await Entry.find(match).sort({ createdAt: -1 });
    } catch (e) {
      console.warn('Milling query error:', e.message);
    }
  }

  let totalWeightKg = 0;
  let totalEarnings = 0;
  let totalReceived = 0;
  const custSet = new Set();

  const catMap = {
    OIL: { id: 'oil', name: 'तेल पिराई', customers: new Set(), weightKg: 0, amount: 0 },
    MASALA: { id: 'haldi', name: 'हल्दी पिसाई', customers: new Set(), weightKg: 0, amount: 0 },
    DARRA: { id: 'darra', name: 'दर्रा पिसाई', customers: new Set(), weightKg: 0, amount: 0 },
    WHEAT: { id: 'atta', name: 'आटा पिसाई', customers: new Set(), weightKg: 0, amount: 0 },
  };

  if (entries.length > 0) {
    for (const e of entries) {
      const wt = Number(e.weightKg) || 0;
      const amt = Number(e.totalAmount) || 0;
      const paid = Number(e.amountPaid) || 0;

      totalWeightKg += wt;
      totalEarnings += amt;
      totalReceived += paid;

      const cName = e.customerId ? String(e.customerId) : e.customerName;
      if (cName) custSet.add(cName);

      const typeKey = (e.itemType || 'WHEAT').toUpperCase();
      const target = catMap[typeKey] || catMap.WHEAT;
      target.weightKg += wt;
      target.amount += amt;
      if (cName) target.customers.add(cName);
    }
  }

  const details = [
    {
      id: 'oil',
      name: 'तेल पिराई',
      customers: `${catMap.OIL.customers.size} ग्राहक`,
      weight: `${catMap.OIL.weightKg} KG`,
      amount: `₹${catMap.OIL.amount.toLocaleString('en-IN')}`,
    },
    {
      id: 'haldi',
      name: 'हल्दी पिसाई',
      customers: `${catMap.MASALA.customers.size} ग्राहक`,
      weight: `${catMap.MASALA.weightKg} KG`,
      amount: `₹${catMap.MASALA.amount.toLocaleString('en-IN')}`,
    },
    {
      id: 'darra',
      name: 'दर्रा पिसाई',
      customers: `${catMap.DARRA.customers.size} ग्राहक`,
      weight: `${catMap.DARRA.weightKg} KG`,
      amount: `₹${catMap.DARRA.amount.toLocaleString('en-IN')}`,
    },
    {
      id: 'atta',
      name: 'आटा पिसाई',
      customers: `${catMap.WHEAT.customers.size} ग्राहक`,
      weight: `${catMap.WHEAT.weightKg} KG`,
      amount: `₹${catMap.WHEAT.amount.toLocaleString('en-IN')}`,
    },
  ];

  return ApiResponse.success(res, 200, {
    period,
    dateStr: dateLabel,
    totalPisai: `${totalWeightKg.toLocaleString('en-IN')} KG`,
    totalWeightKg,
    totalCustomers: `${custSet.size}`,
    totalEarnings: `₹${totalEarnings.toLocaleString('en-IN')}`,
    totalReceived: `₹${totalReceived.toLocaleString('en-IN')}`,
    details,
  }, 'पिसाई का रियल हिसाब लोड हुआ');
});

/**
 * Get Real Pending Dues / बाकी हिसाब Breakdown
 * GET /api/v1/dashboard/pending
 */
const getPendingBreakdown = asyncHandler(async (req, res) => {
  const ownerId = req.user?._id;
  const matchQuery = {};
  if (ownerId) matchQuery.ownerId = ownerId;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  let pendingEntries = [];
  let allPendingCustomers = [];

  if (isDbConnected()) {
    try {
      [pendingEntries, allPendingCustomers] = await Promise.all([
        Entry.find({
          ...matchQuery,
          $or: [
            { paymentStatus: { $in: ['UNPAID', 'PARTIAL'] } },
            { pendingAmount: { $gt: 0 } },
          ],
        }).sort({ createdAt: -1 }),
        Customer.find({
          ...matchQuery,
          pendingBalance: { $gt: 0 },
        }),
      ]);
    } catch (e) {
      console.warn('Pending breakdown query error:', e.message);
    }
  }

  // Calculate overall totals from unique customers
  let totalPendingAmount = 0;
  const pendingCustomerIds = new Set();
  const debtorsList = [];

  for (const c of allPendingCustomers) {
    const bal = Number(c.pendingBalance) || 0;
    if (bal > 0) {
      totalPendingAmount += bal;
      pendingCustomerIds.add(String(c._id));

      // Find customer's latest entry for preview details
      const latestEntry = pendingEntries.find((e) => String(e.customerId) === String(c._id));
      const entryDate = latestEntry ? new Date(latestEntry.createdAt) : new Date(c.lastVisitDate || Date.now());
      const isToday = entryDate >= startOfDay;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const isWeek = entryDate >= weekAgo;

      let periodKey = 'month';
      let dateLabel = entryDate.toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' });
      if (isToday) {
        periodKey = 'today';
        dateLabel = 'आज';
      } else if (isWeek) {
        periodKey = 'week';
      }

      debtorsList.push({
        id: String(c._id),
        customerId: String(c._id),
        name: c.name,
        village: c.village,
        phone: c.phone || '',
        category: latestEntry ? latestEntry.itemLabel : 'गेहूं पिसाई',
        weight: latestEntry ? `${latestEntry.weightKg} KG` : `${c.totalWeightMilledKg || 0} KG`,
        dateLabel,
        periodKey,
        totalBill: Number(c.totalBilledAmount) || bal,
        paid: Number(c.totalPaidAmount) || 0,
        pending: bal,
      });
    }
  }

  // Calculate today's pending
  let todayPendingAmount = 0;
  const todayPendingCustIds = new Set();
  const todayEntries = pendingEntries.filter((e) => new Date(e.createdAt) >= startOfDay);
  for (const e of todayEntries) {
    const pAmt = Number(e.pendingAmount) !== undefined && Number(e.pendingAmount) > 0
      ? Number(e.pendingAmount)
      : Math.max(0, (Number(e.totalAmount) || 0) - (Number(e.amountPaid) || 0));
    todayPendingAmount += pAmt;
    const cId = e.customerId ? String(e.customerId) : e.customerName;
    if (cId) todayPendingCustIds.add(cId);
  }

  return ApiResponse.success(res, 200, {
    totalPendingAmount,
    totalPendingCustomers: pendingCustomerIds.size,
    todayPendingAmount,
    todayPendingCustomers: todayPendingCustIds.size,
    customers: debtorsList,
  }, 'बाकी हिसाब डेटा लोड हुआ');
});

/**
 * Get Real Customer Directory / Breakdown
 * GET /api/v1/dashboard/customers
 */
const getCustomersBreakdown = asyncHandler(async (req, res) => {
  const ownerId = req.user?._id;
  const { period = 'today', date } = req.query;

  const { match, dateLabel } = getDateFilter(period, date);
  if (ownerId) match.ownerId = ownerId;

  let entries = [];
  let allCustomersCount = 0;

  if (isDbConnected()) {
    try {
      const custMatch = ownerId ? { ownerId } : {};
      const isPickupQuery = req.query.filter === 'pickup' || req.query.type === 'pickup' || period === 'pickup';
      const query = isPickupQuery
        ? { ...custMatch, isDelivered: false }
        : { ...custMatch, ...match };

      [entries, allCustomersCount] = await Promise.all([
        Entry.find(query).sort({ createdAt: -1 }),
        Customer.countDocuments(custMatch),
      ]);

      // Fallback: If no entries found with ownerId, query all entries
      if (entries.length === 0 && ownerId) {
        const fallbackQuery = isPickupQuery
          ? { isDelivered: false }
          : { ...match };
        const fallbackEntries = await Entry.find(fallbackQuery).sort({ createdAt: -1 });
        if (fallbackEntries.length > 0) {
          entries = fallbackEntries;
          allCustomersCount = await Customer.countDocuments({});
        }
      }
    } catch (e) {
      console.warn('Customer breakdown query error:', e.message);
    }
  }

  const categoryCounts = {
    oil: 0,
    haldi: 0,
    darra: 0,
    atta: 0,
  };

  const customerMap = new Map();

  if (period === 'total') {
    const custMatch = ownerId ? { ownerId } : {};
    const allCustomers = await Customer.find(custMatch).sort({ lastVisitDate: -1, createdAt: -1 });
    for (const c of allCustomers) {
      const rawType = (c.lastItemMilled || 'WHEAT').toString().toUpperCase();
      let categoryKey = 'atta';
      let categoryName = 'आटा पिसाई';
      if (rawType.includes('OIL') || rawType.includes('तेल') || rawType.includes('सरसों')) {
        categoryKey = 'oil';
        categoryName = 'तेल पिराई';
      } else if (rawType.includes('MASALA') || rawType.includes('मसाला') || rawType.includes('हल्दी')) {
        categoryKey = 'haldi';
        categoryName = 'हल्दी पिसाई';
      } else if (rawType.includes('DARRA') || rawType.includes('दर्रा') || rawType.includes('दलिया')) {
        categoryKey = 'darra';
        categoryName = 'दर्रा पिसाई';
      }

      categoryCounts[categoryKey] = (categoryCounts[categoryKey] || 0) + 1;
      customerMap.set(String(c._id), {
        id: String(c._id),
        customerId: String(c._id),
        name: c.name,
        village: c.village,
        phone: c.phone || '',
        category: categoryName,
        categoryKey,
        weight: `${c.totalWeightMilledKg || 0} KG`,
        amount: (c.pendingBalance || 0) > 0 ? 'बाकी' : 'चुकाया',
        isPending: (c.pendingBalance || 0) > 0,
        pendingBalance: c.pendingBalance || 0,
        totalOrdersCount: c.totalOrdersCount || 1,
        createdAt: c.createdAt || c.lastVisitDate,
      });
    }
  } else {
    for (const e of entries) {
      const cleanPhone = (e.phone || '').toString().replace(/\D/g, '');
      const normName = (e.customerName || '').trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');
      const normVill = (e.village || '').trim().toLowerCase().replace(/^(ग्राम|गाँव|village)\s*/i, '');
      const cId = cleanPhone.length >= 10
        ? `ph_${cleanPhone.slice(-10)}`
        : (normName ? `cust_${normName}_${normVill || 'default'}` : String(e.customerId || e._id));
      const rawType = (e.itemType || 'WHEAT').toUpperCase();
      let categoryKey = 'atta';
      let categoryName = 'आटा पिसाई';
      if (rawType === 'OIL') {
        categoryKey = 'oil';
        categoryName = 'तेल पिराई';
      } else if (rawType === 'MASALA') {
        categoryKey = 'haldi';
        categoryName = 'हल्दी पिसाई';
      } else if (rawType === 'DARRA') {
        categoryKey = 'darra';
        categoryName = 'दर्रा पिसाई';
      }

      const pAmt = Number(e.pendingAmount) !== undefined && Number(e.pendingAmount) > 0
        ? Number(e.pendingAmount)
        : Math.max(0, (Number(e.totalAmount) || 0) - (Number(e.amountPaid) || 0));

      if (!customerMap.has(cId)) {
        categoryCounts[categoryKey] = (categoryCounts[categoryKey] || 0) + 1;
        const arrivalTime = e.time || (e.createdAt ? new Date(e.createdAt).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }) : '');
        customerMap.set(cId, {
          id: String(e.customerId || e._id),
          customerId: String(e.customerId || e._id),
          name: e.customerName || 'अज्ञात',
          village: e.village || 'ग्राम',
          phone: e.phone || '',
          category: categoryName,
          categoryKey,
          itemType: e.itemType || 'WHEAT',
          lastMilledItem: e.itemLabel || categoryName,
          totalWeightKg: Number(e.weightKg) || 0,
          weightKg: Number(e.weightKg) || 0,
          weight: `${e.weightKg || 0} KG`,
          amount: pAmt > 0 ? 'बाकी' : 'चुकाया',
          isPending: pAmt > 0,
          pendingBalance: pAmt,
          totalOrdersCount: 1,
          createdAt: e.createdAt,
          firstCreatedAt: e.createdAt,
          timeStr: arrivalTime,
          time: e.time || arrivalTime,
          orderIndex: e.createdAt ? new Date(e.createdAt).getTime() : 0,
        });
      } else {
        const item = customerMap.get(cId);
        item.totalWeightKg += Number(e.weightKg) || 0;
        item.weight = `${item.totalWeightKg} KG`;
        item.totalOrdersCount += 1;
        item.pendingBalance += pAmt;
        if (item.pendingBalance > 0) {
          item.amount = 'बाकी';
          item.isPending = true;
        }
        if (e.createdAt) {
          if (!item.firstCreatedAt || new Date(e.createdAt) < new Date(item.firstCreatedAt)) {
            item.firstCreatedAt = e.createdAt;
          }
        }
      }
    }
  }

  const uniqueCustomerList = Array.from(customerMap.values());

  return ApiResponse.success(res, 200, {
    totalCustomers: period === 'total' ? (allCustomersCount || uniqueCustomerList.length) : uniqueCustomerList.length,
    activePeriodCustomers: uniqueCustomerList.length,
    dateStr: dateLabel,
    categories: categoryCounts,
    customers: uniqueCustomerList,
  }, 'ग्राहक लिस्ट रियल डेटा लोड हुआ');
});

/**
 * Get Delivery History Breakdown
 * GET /api/v1/dashboard/deliveries
 */
const getDeliveryHistory = asyncHandler(async (req, res) => {
  const ownerId = req.user?._id;
  const { period = 'today', date } = req.query;

  const { match, dateLabel } = getDateFilter(period, date);
  const custMatch = ownerId ? { ownerId } : {};

  // For delivery history, query delivered entries
  const deliveryQuery = {
    ...custMatch,
    $or: [{ isDelivered: true }, { millingStatus: 'DELIVERED' }],
  };

  // If period date match:
  if (match.createdAt) {
    deliveryQuery.$and = [
      {
        $or: [
          { handoverDate: match.createdAt },
          { createdAt: match.createdAt },
        ],
      },
    ];
  }

  let entries = [];
  if (isDbConnected()) {
    try {
      entries = await Entry.find(deliveryQuery).sort({ handoverDate: -1, createdAt: -1 });

      // Fallback: If no records found with ownerId, query all delivered entries
      if (entries.length === 0 && ownerId) {
        const fallbackMatch = getDateFilter(period, date).match;
        const fallbackDeliveryQuery = {
          $or: [{ isDelivered: true }, { millingStatus: 'DELIVERED' }],
        };
        if (fallbackMatch.createdAt) {
          fallbackDeliveryQuery.$and = [
            {
              $or: [
                { handoverDate: fallbackMatch.createdAt },
                { createdAt: fallbackMatch.createdAt },
              ],
            },
          ];
        }
        entries = await Entry.find(fallbackDeliveryQuery).sort({ handoverDate: -1, createdAt: -1 });
      }
    } catch (e) {
      console.warn('Delivery history query error:', e.message);
    }
  }

  // Format delivery records
  const deliveryList = entries.map((e) => {
    const entryDate = new Date(e.handoverDate || e.createdAt);
    const timeFormatted = entryDate.toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' });
    const now = new Date();
    const isToday = entryDate.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = entryDate.toDateString() === yesterday.toDateString();

    let timePrefix = entryDate.toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' });
    if (isToday) timePrefix = 'आज';
    else if (isYesterday) timePrefix = 'कल';

    const timeStr = `${timePrefix}, ${timeFormatted}`;
    const pAmt = Number(e.pendingAmount) !== undefined && Number(e.pendingAmount) > 0
      ? Number(e.pendingAmount)
      : Math.max(0, (Number(e.totalAmount) || 0) - (Number(e.amountPaid) || 0));

    return {
      id: String(e._id),
      customerId: e.customerId ? String(e.customerId) : String(e._id),
      customerName: e.customerName || 'अज्ञात',
      village: e.village || 'ग्राम',
      phone: e.phone || '',
      itemLabel: e.itemLabel || 'गेहूं पिसाई',
      itemType: e.itemType || 'WHEAT',
      weightKg: Number(e.weightKg) || 0,
      ratePerKg: Number(e.ratePerKg) || 0,
      totalAmount: Number(e.totalAmount) || 0,
      amountPaid: Number(e.amountPaid) || 0,
      pendingAmount: pAmt,
      isPaid: pAmt === 0,
      status: 'ले जा चुके',
      deliveryTimeStr: timeStr,
      date: entryDate.toISOString(),
      tokenNumber: e.tokenNumber || '1',
    };
  });

  return ApiResponse.success(res, 200, {
    totalDeliveries: deliveryList.length,
    dateStr: dateLabel,
    period,
    deliveries: deliveryList,
  }, 'डिलीवरी हिस्ट्री लोड हुई');
});

module.exports = {
  getDashboardStats,
  getEarningsBreakdown,
  getMillingBreakdown,
  getPendingBreakdown,
  getCustomersBreakdown,
  getDeliveryHistory,
};
