const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productCode: {
    type: String,
    required: [true, 'Product code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z0-9]{3,20}$/, 'Product code must be 3-20 alphanumeric characters']
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductCategory',
    required: [true, 'Product category is required']
  },
  brand: {
    type: String,
    trim: true,
    maxlength: [100, 'Brand cannot exceed 100 characters']
  },
  manufacturer: {
    type: String,
    trim: true,
    maxlength: [100, 'Manufacturer cannot exceed 100 characters']
  },
  productType: {
    type: String,
    required: [true, 'Product type is required'],
    enum: ['finished_good', 'raw_material', 'semi_finished', 'service', 'kit']
  },
  unitOfMeasure: {
    primary: {
      type: String,
      required: [true, 'Primary unit of measure is required'],
      enum: ['piece', 'kg', 'gram', 'liter', 'meter', 'box', 'pack', 'set']
    },
    secondary: {
      unit: {
        type: String,
        enum: ['piece', 'kg', 'gram', 'liter', 'meter', 'box', 'pack', 'set']
      },
      conversionFactor: {
        type: Number,
        min: [0, 'Conversion factor must be positive']
      }
    }
  },
  pricing: {
    costPrice: {
      type: Number,
      required: [true, 'Cost price is required'],
      min: [0, 'Cost price cannot be negative']
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative']
    },
    currency: {
      type: String,
      default: 'VND',
      enum: ['VND', 'USD', 'EUR', 'JPY', 'GBP']
    },
    priceList: [{
      customerType: {
        type: String,
        enum: ['retail', 'wholesale', 'distributor', 'vip']
      },
      price: {
        type: Number,
        min: [0, 'Price cannot be negative']
      },
      minQuantity: {
        type: Number,
        default: 1,
        min: [1, 'Minimum quantity must be at least 1']
      }
    }]
  },
  inventory: {
    trackInventory: {
      type: Boolean,
      default: true
    },
    currentStock: {
      type: Number,
      default: 0,
      min: [0, 'Current stock cannot be negative']
    },
    reservedStock: {
      type: Number,
      default: 0,
      min: [0, 'Reserved stock cannot be negative']
    },
    availableStock: {
      type: Number,
      default: 0
    },
    reorderLevel: {
      type: Number,
      default: 0,
      min: [0, 'Reorder level cannot be negative']
    },
    maxStockLevel: {
      type: Number,
      min: [0, 'Max stock level cannot be negative']
    },
    leadTime: {
      type: Number,
      default: 0,
      min: [0, 'Lead time cannot be negative']
    },
    storageLocation: [{
      warehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse'
      },
      location: String,
      quantity: {
        type: Number,
        default: 0,
        min: [0, 'Quantity cannot be negative']
      }
    }]
  },
  specifications: {
    weight: {
      value: Number,
      unit: {
        type: String,
        enum: ['kg', 'gram', 'pound']
      }
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: {
        type: String,
        enum: ['cm', 'inch', 'meter']
      }
    },
    color: String,
    size: String,
    material: String,
    customAttributes: [{
      name: String,
      value: String,
      dataType: {
        type: String,
        enum: ['text', 'number', 'boolean', 'date']
      }
    }]
  },
  suppliers: [{
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier'
    },
    supplierProductCode: String,
    costPrice: Number,
    leadTime: Number,
    minOrderQuantity: {
      type: Number,
      default: 1
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  images: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimeType: String,
    isPrimary: {
      type: Boolean,
      default: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  documents: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimeType: String,
    documentType: {
      type: String,
      enum: ['datasheet', 'manual', 'certificate', 'warranty', 'other']
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  barcode: {
    type: String,
    unique: true,
    sparse: true
  },
  qrCode: {
    type: String,
    unique: true,
    sparse: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isDiscontinued: {
    type: Boolean,
    default: false
  },
  discontinuedDate: Date,
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

// Virtual for available stock calculation
productSchema.virtual('availableStockCalculated').get(function() {
  return this.inventory.currentStock - this.inventory.reservedStock;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  const available = this.availableStockCalculated;
  if (available <= 0) return 'out_of_stock';
  if (available <= this.inventory.reorderLevel) return 'low_stock';
  return 'in_stock';
});

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  if (this.pricing.costPrice === 0) return 0;
  return ((this.pricing.sellingPrice - this.pricing.costPrice) / this.pricing.costPrice) * 100;
});

// Index for better performance
productSchema.index({ productCode: 1 });
productSchema.index({ productName: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ productType: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ barcode: 1 });
productSchema.index({ 'inventory.currentStock': 1 });
productSchema.index({ 'inventory.reorderLevel': 1 });

// Pre-save middleware to update available stock
productSchema.pre('save', function(next) {
  if (this.inventory.trackInventory) {
    this.inventory.availableStock = this.inventory.currentStock - this.inventory.reservedStock;
  }
  next();
});

// Static method to get low stock products
productSchema.statics.getLowStockProducts = function() {
  return this.find({
    isActive: true,
    'inventory.trackInventory': true,
    $expr: {
      $lte: [
        { $subtract: ['$inventory.currentStock', '$inventory.reservedStock'] },
        '$inventory.reorderLevel'
      ]
    }
  }).populate('category', 'name');
};

// Static method to get products by category
productSchema.statics.getByCategory = function(categoryId) {
  return this.find({ category: categoryId, isActive: true })
    .populate('category', 'name')
    .sort({ productName: 1 });
};

// Method to update stock
productSchema.methods.updateStock = function(quantity, type = 'add', reason = '') {
  if (type === 'add') {
    this.inventory.currentStock += quantity;
  } else if (type === 'subtract') {
    this.inventory.currentStock = Math.max(0, this.inventory.currentStock - quantity);
  } else if (type === 'set') {
    this.inventory.currentStock = quantity;
  }
  
  this.inventory.availableStock = this.inventory.currentStock - this.inventory.reservedStock;
  
  // Log stock movement (you might want to create a separate StockMovement model)
  return this.save();
};

// Method to reserve stock
productSchema.methods.reserveStock = function(quantity) {
  if (this.availableStockCalculated >= quantity) {
    this.inventory.reservedStock += quantity;
    this.inventory.availableStock = this.inventory.currentStock - this.inventory.reservedStock;
    return this.save();
  } else {
    throw new Error('Insufficient stock available for reservation');
  }
};

// Method to release reserved stock
productSchema.methods.releaseReservedStock = function(quantity) {
  this.inventory.reservedStock = Math.max(0, this.inventory.reservedStock - quantity);
  this.inventory.availableStock = this.inventory.currentStock - this.inventory.reservedStock;
  return this.save();
};

module.exports = mongoose.model('Product', productSchema);
