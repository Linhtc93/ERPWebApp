const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  accountCode: {
    type: String,
    required: [true, 'Account code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z0-9]{3,10}$/, 'Account code must be 3-10 alphanumeric characters']
  },
  accountName: {
    type: String,
    required: [true, 'Account name is required'],
    trim: true,
    maxlength: [100, 'Account name cannot exceed 100 characters']
  },
  accountType: {
    type: String,
    required: [true, 'Account type is required'],
    enum: ['asset', 'liability', 'equity', 'revenue', 'expense']
  },
  accountSubType: {
    type: String,
    required: [true, 'Account sub-type is required'],
    enum: [
      // Asset subtypes
      'current_asset', 'fixed_asset', 'intangible_asset',
      // Liability subtypes
      'current_liability', 'long_term_liability',
      // Equity subtypes
      'owner_equity', 'retained_earnings',
      // Revenue subtypes
      'operating_revenue', 'non_operating_revenue',
      // Expense subtypes
      'operating_expense', 'non_operating_expense', 'cost_of_goods_sold'
    ]
  },
  parentAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    default: null
  },
  level: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isSystemAccount: {
    type: Boolean,
    default: false
  },
  allowDirectPosting: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  currency: {
    type: String,
    default: 'VND',
    enum: ['VND', 'USD', 'EUR', 'JPY', 'GBP']
  },
  balance: {
    type: Number,
    default: 0
  },
  openingBalance: {
    type: Number,
    default: 0
  },
  openingBalanceDate: {
    type: Date,
    default: Date.now
  },
  taxCode: {
    type: String,
    trim: true
  },
  costCenter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CostCenter'
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

// Virtual for account hierarchy path
accountSchema.virtual('hierarchyPath').get(function() {
  return `${this.accountCode} - ${this.accountName}`;
});

// Index for better performance
accountSchema.index({ accountCode: 1 });
accountSchema.index({ accountType: 1, accountSubType: 1 });
accountSchema.index({ parentAccount: 1 });
accountSchema.index({ isActive: 1 });

// Pre-save middleware to calculate level based on parent
accountSchema.pre('save', async function(next) {
  if (this.parentAccount) {
    const parent = await this.constructor.findById(this.parentAccount);
    if (parent) {
      this.level = parent.level + 1;
    }
  }
  next();
});

// Static method to get account hierarchy
accountSchema.statics.getHierarchy = async function() {
  const accounts = await this.find({ isActive: true })
    .populate('parentAccount', 'accountCode accountName')
    .sort({ accountCode: 1 });
  
  const buildHierarchy = (parentId = null, level = 0) => {
    return accounts
      .filter(account => 
        (parentId === null && !account.parentAccount) ||
        (account.parentAccount && account.parentAccount._id.toString() === parentId)
      )
      .map(account => ({
        ...account.toObject(),
        level,
        children: buildHierarchy(account._id.toString(), level + 1)
      }));
  };
  
  return buildHierarchy();
};

// Method to calculate account balance
accountSchema.methods.calculateBalance = async function() {
  const Transaction = mongoose.model('Transaction');
  
  const result = await Transaction.aggregate([
    {
      $match: {
        $or: [
          { debitAccount: this._id },
          { creditAccount: this._id }
        ],
        status: 'approved'
      }
    },
    {
      $group: {
        _id: null,
        totalDebit: {
          $sum: {
            $cond: [
              { $eq: ['$debitAccount', this._id] },
              '$amount',
              0
            ]
          }
        },
        totalCredit: {
          $sum: {
            $cond: [
              { $eq: ['$creditAccount', this._id] },
              '$amount',
              0
            ]
          }
        }
      }
    }
  ]);
  
  if (result.length === 0) {
    return this.openingBalance;
  }
  
  const { totalDebit, totalCredit } = result[0];
  
  // Calculate balance based on account type
  let balance = this.openingBalance;
  
  if (['asset', 'expense'].includes(this.accountType)) {
    // Debit increases, Credit decreases
    balance += totalDebit - totalCredit;
  } else {
    // Credit increases, Debit decreases
    balance += totalCredit - totalDebit;
  }
  
  return balance;
};

module.exports = mongoose.model('Account', accountSchema);
