const express = require('express');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const Product = require('../models/Product');
const { protect, checkPermission } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// Overview metrics
router.get('/overview', checkPermission('dashboard', 'read'), async (req, res) => {
  try {
    const [txCount, accountsCount, productsCount] = await Promise.all([
      Transaction.countDocuments({}),
      Account.countDocuments({}),
      Product.countDocuments({}),
    ]);

    const recentTransactions = await Transaction.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('createdBy', 'firstName lastName')
      .select('transactionNumber transactionType totalAmount currency status createdAt');

    res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalTransactions: txCount,
          totalAccounts: accountsCount,
          totalProducts: productsCount,
        },
        recentTransactions,
      },
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ success: false, message: 'Server error while loading dashboard' });
  }
});

module.exports = router;
