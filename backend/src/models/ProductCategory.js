const mongoose = require('mongoose');

const productCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters'],
    unique: true
  },
  code: {
    type: String,
    trim: true,
    uppercase: true,
    unique: true,
    sparse: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductCategory',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [300, 'Description cannot exceed 300 characters']
  }
}, { timestamps: true });

productCategorySchema.index({ name: 1 });
productCategorySchema.index({ code: 1 });
productCategorySchema.index({ parent: 1 });

module.exports = mongoose.model('ProductCategory', productCategorySchema);
