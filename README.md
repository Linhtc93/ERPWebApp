# ERP System - D365 Finance and Operations Clone

## Mô tả dự án
Hệ thống ERP web hoàn chỉnh tương tự Microsoft Dynamics 365 Finance and Operations, bao gồm các module chính:

- **Finance Management**: Quản lý tài chính, kế toán, ngân sách
- **Operations Management**: Quản lý chuỗi cung ứng, sản xuất, mua hàng
- **Human Resources**: Quản lý nhân sự, lương, hiệu suất
- **Inventory Management**: Quản lý kho, kiểm soát tồn kho
- **Dashboard & Analytics**: Báo cáo và phân tích dữ liệu

## Công nghệ sử dụng

### Backend
- Node.js với Express.js
- MongoDB với Mongoose ODM
- JWT Authentication
- Bcrypt cho mã hóa mật khẩu
- Multer cho upload file

### Frontend
- React 18 với TypeScript
- Material-UI (MUI) cho giao diện
- Redux Toolkit cho state management
- React Router cho routing
- Axios cho API calls
- Chart.js cho biểu đồ

## Cấu trúc dự án

```
erp-system/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/     # API controllers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── utils/          # Utility functions
│   │   └── config/         # Configuration files
│   ├── package.json
│   └── server.js
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── store/          # Redux store
│   │   ├── services/       # API services
│   │   ├── utils/          # Utility functions
│   │   └── styles/         # CSS/SCSS files
│   ├── public/
│   └── package.json
└── README.md
```

## Cài đặt và chạy dự án

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Tính năng chính

### 1. Authentication & Authorization
- Đăng nhập/đăng xuất
- Phân quyền theo vai trò (Admin, Manager, Employee)
- JWT token authentication

### 2. Finance Management
- Quản lý tài khoản kế toán
- Theo dõi thu chi
- Báo cáo tài chính
- Quản lý ngân sách

### 3. Operations Management
- Quản lý đơn hàng
- Quản lý nhà cung cấp
- Theo dõi sản xuất
- Quản lý mua hàng

### 4. Human Resources
- Quản lý nhân viên
- Tính lương
- Đánh giá hiệu suất
- Quản lý chấm công

### 5. Inventory Management
- Quản lý sản phẩm
- Kiểm soát tồn kho
- Quản lý kho hàng
- Báo cáo tồn kho

### 6. Dashboard & Reporting
- Dashboard tổng quan
- Biểu đồ thống kê
- Báo cáo chi tiết
- Export dữ liệu

## API Documentation
API documentation sẽ được tạo tự động với Swagger UI tại `/api-docs`

## License
MIT License
