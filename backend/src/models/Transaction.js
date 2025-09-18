const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionNumber: {
    type: String,
    unique: true,
    required: true
  },
  transactionDate: {
    type: Date,
    required: [true, 'Transaction date is required'],
    default: Date.now
  },
  description: {
    type: String,
    required: [true, 'Transaction description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  reference: {
    type: String,
    trim: true,
    maxlength: [100, 'Reference cannot exceed 100 characters']
  },
  transactionType: {
    type: String,
    required: [true, 'Transaction type is required'],
    enum: ['journal_entry', 'payment', 'receipt', 'adjustment', 'closing', 'opening']
  },
  entries: [{
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true
    },
    debitAmount: {
      type: Number,
      default: 0,
      min: [0, 'Debit amount cannot be negative']
    },
    creditAmount: {
      type: Number,
      default: 0,
      min: [0, 'Credit amount cannot be negative']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Entry description cannot exceed 200 characters']
    },
    costCenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CostCenter'
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project'
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount must be positive']
  },
  currency: {
    type: String,
    default: 'VND',
    enum: ['VND', 'USD', 'EUR', 'JPY', 'GBP']
  },
  exchangeRate: {
    type: Number,
    default: 1,
    min: [0, 'Exchange rate must be positive']
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'cancelled'],
    default: 'draft'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  },
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimeType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  fiscalYear: {
    type: Number,
    required: true
  },
  fiscalPeriod: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly']
    },
    nextDate: Date,
    endDate: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted transaction number
transactionSchema.virtual('formattedNumber').get(function() {
  return `TXN-${this.transactionNumber}`;
});

// Virtual for total debit amount
transactionSchema.virtual('totalDebit').get(function() {
  return this.entries.reduce((sum, entry) => sum + entry.debitAmount, 0);
});

// Virtual for total credit amount
transactionSchema.virtual('totalCredit').get(function() {
  return this.entries.reduce((sum, entry) => sum + entry.creditAmount, 0);
});

// Index for better performance
transactionSchema.index({ transactionNumber: 1 });
transactionSchema.index({ transactionDate: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ transactionType: 1 });
transactionSchema.index({ fiscalYear: 1, fiscalPeriod: 1 });
transactionSchema.index({ 'entries.account': 1 });
transactionSchema.index({ createdBy: 1 });

// Pre-save middleware to generate transaction number
transactionSchema.pre('save', async function(next) {
  if (!this.transactionNumber && this.isNew) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, new Date().getMonth(), 1),
        $lt: new Date(year, new Date().getMonth() + 1, 1)
      }
    });
    
    this.transactionNumber = `${year}${month}${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Pre-save middleware to set fiscal year and period
transactionSchema.pre('save', function(next) {
  if (this.transactionDate) {
    const date = new Date(this.transactionDate);
    this.fiscalYear = date.getFullYear();
    this.fiscalPeriod = date.getMonth() + 1;
  }
  next();
});

// Pre-save middleware to validate entries balance
transactionSchema.pre('save', function(next) {
  const totalDebit = this.entries.reduce((sum, entry) => sum + entry.debitAmount, 0);
  const totalCredit = this.entries.reduce((sum, entry) => sum + entry.creditAmount, 0);
  
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    return next(new Error('Transaction entries must be balanced (total debits must equal total credits)'));
  }
  
  this.totalAmount = totalDebit; // or totalCredit, they should be equal
  next();
});

// Static method to get transactions by account
transactionSchema.statics.getByAccount = function(accountId, startDate, endDate) {
  const query = {
    'entries.account': accountId,
    status: 'approved'
  };
  
  if (startDate || endDate) {
    query.transactionDate = {};
    if (startDate) query.transactionDate.$gte = new Date(startDate);
    if (endDate) query.transactionDate.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .populate('entries.account', 'accountCode accountName')
    .populate('createdBy', 'firstName lastName')
    .populate('approvedBy', 'firstName lastName')
    .sort({ transactionDate: -1 });
};

// Static method to get trial balance
transactionSchema.statics.getTrialBalance = async function(asOfDate) {
  const matchStage = {
    status: 'approved'
  };
  
  if (asOfDate) {
    matchStage.transactionDate = { $lte: new Date(asOfDate) };
  }
  
  return this.aggregate([
    { $match: matchStage },
    { $unwind: '$entries' },
    {
      $group: {
        _id: '$entries.account',
        totalDebit: { $sum: '$entries.debitAmount' },
        totalCredit: { $sum: '$entries.creditAmount' }
      }
    },
    {
      $lookup: {
        from: 'accounts',
        localField: '_id',
        foreignField: '_id',
        as: 'account'
      }
    },
    { $unwind: '$account' },
    {
      $project: {
        accountCode: '$account.accountCode',
        accountName: '$account.accountName',
        accountType: '$account.accountType',
        totalDebit: 1,
        totalCredit: 1,
        balance: {
          $cond: [
            { $in: ['$account.accountType', ['asset', 'expense']] },
            { $subtract: ['$totalDebit', '$totalCredit'] },
            { $subtract: ['$totalCredit', '$totalDebit'] }
          ]
        }
      }
    },
    { $sort: { accountCode: 1 } }
  ]);
};

// Method to approve transaction
transactionSchema.methods.approve = function(approvedBy) {
  this.status = 'approved';
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  return this.save();
};

// Method to reject transaction
transactionSchema.methods.reject = function(rejectionReason) {
  this.status = 'rejected';
  this.rejectionReason = rejectionReason;
  return this.save();
};

module.exports = mongoose.model('Transaction', transactionSchema);
