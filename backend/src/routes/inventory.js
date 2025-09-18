const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const { protect, checkPermission } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// Get all products
router.get('/products', checkPermission('inventory', 'read'), async (req, res) => {
  try {
    const { category, type, status, page = 1, limit = 20 } = req.query;
    let query = {};

    if (category) query.category = category;
    if (type) query.productType = type;
    if (status) {
      if (status === 'active') query.isActive = true;
      if (status === 'inactive') query.isActive = false;
      if (status === 'discontinued') query.isDiscontinued = true;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .populate('category', 'name')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: { products }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching products'
    });
  }
});

// Create new product
router.post('/products', checkPermission('inventory', 'create'), [
  body('productCode').trim().isLength({ min: 3, max: 20 }).matches(/^[A-Z0-9]+$/).withMessage('Invalid product code'),
  body('productName').trim().isLength({ min: 1, max: 200 }).withMessage('Product name is required'),
  body('productType').isIn(['finished_good', 'raw_material', 'semi_finished', 'service', 'kit']).withMessage('Invalid product type'),
  body('pricing.costPrice').isFloat({ min: 0 }).withMessage('Cost price must be positive'),
  body('pricing.sellingPrice').isFloat({ min: 0 }).withMessage('Selling price must be positive')
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

    const productData = {
      ...req.body,
      createdBy: req.user._id
    };

    const product = await Product.create(productData);
    await product.populate('category', 'name');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product }
    });

  } catch (error) {
    console.error('Create product error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Product code already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating product'
    });
  }
});

// Get low stock products
router.get('/products/low-stock', checkPermission('inventory', 'read'), async (req, res) => {
  try {
    const lowStockProducts = await Product.getLowStockProducts();

    res.status(200).json({
      success: true,
      count: lowStockProducts.length,
      data: { products: lowStockProducts }
    });

  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching low stock products'
    });
  }
});

// Update product stock
router.put('/products/:id/stock', checkPermission('inventory', 'update'), [
  body('quantity').isFloat().withMessage('Quantity must be a number'),
  body('type').isIn(['add', 'subtract', 'set']).withMessage('Invalid stock update type'),
  body('reason').optional().trim().isLength({ max: 200 }).withMessage('Reason cannot exceed 200 characters')
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

    const { quantity, type, reason } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await product.updateStock(quantity, type, reason);

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data: { product }
    });

  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating stock'
    });
  }
});

module.exports = router;
