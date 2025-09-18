const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const { protect, authorize, checkPermission } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

/**
 * @swagger
 * components:
 *   schemas:
 *     Account:
 *       type: object
 *       required:
 *         - accountCode
 *         - accountName
 *         - accountType
 *         - accountSubType
 *       properties:
 *         accountCode:
 *           type: string
 *           description: Unique account code
 *         accountName:
 *           type: string
 *           description: Account name
 *         accountType:
 *           type: string
 *           enum: [asset, liability, equity, revenue, expense]
 *         accountSubType:
 *           type: string
 *           description: Account sub-type
 */

// ============ ACCOUNTS ROUTES ============

/**
 * @swagger
 * /api/finance/accounts:
 *   get:
 *     summary: Get all accounts
 *     tags: [Finance - Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by account type
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of accounts retrieved successfully
 */
router.get('/accounts', checkPermission('finance', 'read'), [
  query('type').optional().isIn(['asset', 'liability', 'equity', 'revenue', 'expense']),
  query('active').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { type, active, hierarchy } = req.query;
    let query = {};

    if (type) query.accountType = type;
    if (active !== undefined) query.isActive = active === 'true';

    let accounts;

    if (hierarchy === 'true') {
      accounts = await Account.getHierarchy();
    } else {
      accounts = await Account.find(query)
        .populate('parentAccount', 'accountCode accountName')
        .populate('createdBy', 'firstName lastName')
        .sort({ accountCode: 1 });
    }

    res.status(200).json({
      success: true,
      count: Array.isArray(accounts) ? accounts.length : 0,
      data: {
        accounts
      }
    });

  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching accounts'
    });
  }
});

/**
 * @swagger
 * /api/finance/accounts:
 *   post:
 *     summary: Create a new account
 *     tags: [Finance - Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Account'
 *     responses:
 *       201:
 *         description: Account created successfully
 */
router.post('/accounts', checkPermission('finance', 'create'), [
  body('accountCode')
    .trim()
    .isLength({ min: 3, max: 10 })
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Account code must be 3-10 alphanumeric characters'),
  body('accountName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Account name is required and cannot exceed 100 characters'),
  body('accountType')
    .isIn(['asset', 'liability', 'equity', 'revenue', 'expense'])
    .withMessage('Invalid account type'),
  body('accountSubType')
    .notEmpty()
    .withMessage('Account sub-type is required'),
  body('openingBalance')
    .optional()
    .isNumeric()
    .withMessage('Opening balance must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const accountData = {
      ...req.body,
      createdBy: req.user._id
    };

    const account = await Account.create(accountData);

    await account.populate('parentAccount', 'accountCode accountName');
    await account.populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        account
      }
    });

  } catch (error) {
    console.error('Create account error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Account code already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating account'
    });
  }
});

/**
 * @swagger
 * /api/finance/accounts/{id}:
 *   get:
 *     summary: Get account by ID
 *     tags: [Finance - Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Account retrieved successfully
 */
router.get('/accounts/:id', checkPermission('finance', 'read'), async (req, res) => {
  try {
    const account = await Account.findById(req.params.id)
      .populate('parentAccount', 'accountCode accountName')
      .populate('createdBy', 'firstName lastName');

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Calculate current balance
    const currentBalance = await account.calculateBalance();

    res.status(200).json({
      success: true,
      data: {
        account: {
          ...account.toObject(),
          currentBalance
        }
      }
    });

  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching account'
    });
  }
});

/**
 * @swagger
 * /api/finance/accounts/{id}:
 *   put:
 *     summary: Update account
 *     tags: [Finance - Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Account updated successfully
 */
router.put('/accounts/:id', checkPermission('finance', 'update'), [
  body('accountName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Account name cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const allowedUpdates = ['accountName', 'description', 'isActive', 'allowDirectPosting'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    updates.updatedBy = req.user._id;

    const account = await Account.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('parentAccount', 'accountCode accountName')
     .populate('updatedBy', 'firstName lastName');

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Account updated successfully',
      data: {
        account
      }
    });

  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating account'
    });
  }
});

// ============ TRANSACTIONS ROUTES ============

/**
 * @swagger
 * /api/finance/transactions:
 *   get:
 *     summary: Get all transactions
 *     tags: [Finance - Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of transactions retrieved successfully
 */
router.get('/transactions', checkPermission('finance', 'read'), [
  query('status').optional().isIn(['draft', 'pending', 'approved', 'rejected', 'cancelled']),
  query('type').optional().isIn(['journal_entry', 'payment', 'receipt', 'adjustment', 'closing', 'opening']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { status, type, startDate, endDate, page = 1, limit = 20 } = req.query;
    let query = {};

    if (status) query.status = status;
    if (type) query.transactionType = type;
    
    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) query.transactionDate.$gte = new Date(startDate);
      if (endDate) query.transactionDate.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const transactions = await Transaction.find(query)
      .populate('entries.account', 'accountCode accountName')
      .populate('createdBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .sort({ transactionDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: {
        transactions
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transactions'
    });
  }
});

/**
 * @swagger
 * /api/finance/transactions:
 *   post:
 *     summary: Create a new transaction
 *     tags: [Finance - Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Transaction created successfully
 */
router.post('/transactions', checkPermission('finance', 'create'), [
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description is required and cannot exceed 500 characters'),
  body('transactionType')
    .isIn(['journal_entry', 'payment', 'receipt', 'adjustment', 'closing', 'opening'])
    .withMessage('Invalid transaction type'),
  body('entries')
    .isArray({ min: 2 })
    .withMessage('At least 2 entries are required'),
  body('entries.*.account')
    .isMongoId()
    .withMessage('Valid account ID is required for each entry'),
  body('entries.*.debitAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Debit amount must be a positive number'),
  body('entries.*.creditAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Credit amount must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Validate that each entry has either debit or credit amount (not both)
    for (const entry of req.body.entries) {
      const hasDebit = entry.debitAmount && entry.debitAmount > 0;
      const hasCredit = entry.creditAmount && entry.creditAmount > 0;
      
      if (hasDebit && hasCredit) {
        return res.status(400).json({
          success: false,
          message: 'Each entry must have either debit or credit amount, not both'
        });
      }
      
      if (!hasDebit && !hasCredit) {
        return res.status(400).json({
          success: false,
          message: 'Each entry must have either debit or credit amount'
        });
      }
    }

    const transactionData = {
      ...req.body,
      createdBy: req.user._id
    };

    const transaction = await Transaction.create(transactionData);

    await transaction.populate('entries.account', 'accountCode accountName');
    await transaction.populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: {
        transaction
      }
    });

  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating transaction'
    });
  }
});

/**
 * @swagger
 * /api/finance/transactions/{id}/approve:
 *   put:
 *     summary: Approve a transaction
 *     tags: [Finance - Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction approved successfully
 */
router.put('/transactions/:id/approve', checkPermission('finance', 'approve'), async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending transactions can be approved'
      });
    }

    await transaction.approve(req.user._id);

    await transaction.populate('entries.account', 'accountCode accountName');
    await transaction.populate('approvedBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      message: 'Transaction approved successfully',
      data: {
        transaction
      }
    });

  } catch (error) {
    console.error('Approve transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while approving transaction'
    });
  }
});

/**
 * @swagger
 * /api/finance/reports/trial-balance:
 *   get:
 *     summary: Get trial balance report
 *     tags: [Finance - Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: asOfDate
 *         schema:
 *           type: string
 *           format: date
 *         description: As of date for the trial balance
 *     responses:
 *       200:
 *         description: Trial balance retrieved successfully
 */
router.get('/reports/trial-balance', checkPermission('finance', 'read'), [
  query('asOfDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { asOfDate } = req.query;
    
    const trialBalance = await Transaction.getTrialBalance(asOfDate);

    // Calculate totals
    const totals = trialBalance.reduce((acc, item) => {
      acc.totalDebit += item.totalDebit;
      acc.totalCredit += item.totalCredit;
      return acc;
    }, { totalDebit: 0, totalCredit: 0 });

    res.status(200).json({
      success: true,
      data: {
        trialBalance,
        totals,
        asOfDate: asOfDate || new Date().toISOString().split('T')[0]
      }
    });

  } catch (error) {
    console.error('Trial balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating trial balance'
    });
  }
});

module.exports = router;
