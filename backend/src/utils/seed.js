require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp_system';
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@erp.local';
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

  const existing = await User.findOne({ $or: [{ email: adminEmail }, { username: adminUsername }] });
  if (existing) {
    console.log('Admin user already exists:', existing.username);
  } else {
    const admin = await User.create({
      username: adminUsername,
      email: adminEmail,
      password: adminPassword,
      firstName: 'System',
      lastName: 'Admin',
      role: 'admin',
      department: 'management',
      position: 'Administrator',
      isActive: true,
      permissions: [
        { module: 'finance', actions: ['create','read','update','delete','approve'] },
        { module: 'inventory', actions: ['create','read','update','delete'] },
        { module: 'hr', actions: ['create','read','update','delete'] },
        { module: 'operations', actions: ['create','read','update','delete'] },
        { module: 'dashboard', actions: ['read'] },
        { module: 'users', actions: ['create','read','update','delete'] }
      ]
    });
    console.log('Admin user created:', admin.username);
  }

  await mongoose.disconnect();
  process.exit(0);
})();
