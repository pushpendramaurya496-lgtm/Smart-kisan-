const express = require('express');
const router = express.Router();

const authRoutes = require('../modules/auth/auth.route');
const entryRoutes = require('../modules/entry/entry.route');
const customerRoutes = require('../modules/customer/customer.route');

// Mount Modules
router.use('/auth', authRoutes);
router.use('/entries', entryRoutes);
router.use('/customers', customerRoutes);

module.exports = router;
