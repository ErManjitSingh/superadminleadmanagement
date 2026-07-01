const express = require('express');
const authRoutes = require('./authRoutes');
const companyRoutes = require('./companyRoutes');
const planRoutes = require('./planRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const settingsRoutes = require('./settingsRoutes');
const logsRoutes = require('./logsRoutes');
const notificationRoutes = require('./notificationRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/companies', companyRoutes);
router.use('/plans', planRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/settings', settingsRoutes);
router.use('/logs', logsRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
