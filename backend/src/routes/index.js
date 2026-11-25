const express = require('express');
const router = express.Router();

const authRoutes = require('../modules/auth/auth.route');
const entryRoutes = require('../modules/entry/entry.route');
const customerRoutes = require('../modules/customer/customer.route');
const uploadRoutes = require('../modules/upload/upload.route');
const dashboardRoutes = require('../modules/dashboard/dashboard.route');

// Mount Modules
router.use('/auth', authRoutes);
router.use('/entries', entryRoutes);
router.use('/customers', customerRoutes);
router.use('/upload', uploadRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
