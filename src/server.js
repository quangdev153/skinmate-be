const path = require('path');
// Tự động tìm nạp file .env ở thư mục cha BE_ASS hoặc ngay trong src
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
if (!process.env.MONGO_URI) {
  require('dotenv').config({ path: path.resolve(__dirname, '.env') });
}

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const communityRoutes = require('./routes/communityRoutes');
const collectionRoutes = require('./routes/collectionRoutes');
const skinProfileRoutes = require('./routes/skinProfileRoutes');
const routineRoutes = require('./routes/routineRoutes');

const app = express();

// 1. Kết nối cơ sở dữ liệu MongoDB
connectDB();

// 2. Middlewares toàn cục
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Khai báo các API Endpoints
app.use('/api/community', communityRoutes);
app.use('/api/collection', collectionRoutes);
app.use('/api/skin-profile', skinProfileRoutes);
app.use('/api/routines', routineRoutes);

// Endpoint kiểm tra nhanh server có sống không
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Backend DermaScan AI (Trần Quang) đang chạy ngon lành!',
    status: 'online',
  });
});

// 4. Middleware bắt lỗi tập trung (Error Handler)
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Lỗi hệ thống máy chủ',
  });
});

// 5. Lắng nghe cổng
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});