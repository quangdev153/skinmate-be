const path = require('path');
// Tự động tìm file .env ở thư mục cha hoặc thư mục dự án
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
// Dự phòng nếu .env nằm ngay trong src:
if (!process.env.MONGO_URI) {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
}
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import các Models
const User = require('../models/User');
const SkinDictionary = require('../models/SkinDictionary');
const MyCollection = require('../models/MyCollection');

const seedDatabase = async () => {
  try {
    // 1. Kết nối MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Đã kết nối MongoDB để nạp dữ liệu...');

    // 2. Xóa dữ liệu cũ (nếu muốn làm sạch bảng)
    await User.deleteMany({ email: 'tranquang@example.com' });
    await SkinDictionary.deleteMany({});
    await MyCollection.deleteMany({});

    // 3. Tạo User mẫu (Trần Quang)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('123456', salt);

    const testUser = await User.create({
      email: 'tranquang@example.com',
      passwordHash: passwordHash,
      fullName: 'Trần Quang',
      skinProfile: {
        skinType: 'da_dau',
        allergies: ['Fragrance', 'Alcohol Denat'],
      },
    });
    console.log(`Đã tạo User mẫu: ${testUser.email} (Mật khẩu: 123456)`);

    // 4. Tạo Từ điển Hồ sơ da (Do's & Don'ts theo chuẩn Use Case)
    await SkinDictionary.insertMany([
      {
        skinType: 'da_dau',
        dos: [
          { ingredientName: 'Niacinamide', purpose: 'Kiểm soát bã nhờn, phục hồi da' },
          { ingredientName: 'BHA (Salicylic Acid)', purpose: 'Làm sạch sâu lỗ chân lông' },
          { ingredientName: 'Clay (Đất sét)', purpose: 'Hút dầu thừa, ngừa bít tắc' },
        ],
        donts: [
          { ingredientName: 'Mineral Oil', reason: 'Dễ gây bít tắc lỗ chân lông sinh mụn' },
          { ingredientName: 'Shea Butter', reason: 'Quá đặc, gây bí da dầu' },
          { ingredientName: 'Coconut Oil', reason: 'Chỉ số gây bít tắc (comedogenic) cao' },
        ],
      },
      {
        skinType: 'da_kho',
        dos: [
          { ingredientName: 'Hyaluronic Acid', purpose: 'Cấp nước đa tầng' },
          { ingredientName: 'Ceramide', purpose: 'Khóa ẩm, phục hồi màng lipid' },
          { ingredientName: 'Shea Butter', purpose: 'Dưỡng ẩm chuyên sâu' },
        ],
        donts: [
          { ingredientName: 'Alcohol Denat', reason: 'Làm khô rát, mất nước bề mặt' },
          { ingredientName: 'Salicylic Acid nồng độ cao', reason: 'Gây bong tróc da' },
        ],
      },
      {
        skinType: 'da_hon_hop',
        dos: [
          { ingredientName: 'Niacinamide', purpose: 'Cân bằng dầu và hỗ trợ hàng rào da' },
          { ingredientName: 'Hyaluronic Acid', purpose: 'Cấp nước nhẹ cho vùng da khô' },
        ],
        donts: [
          { ingredientName: 'Alcohol Denat', reason: 'Có thể làm khô vùng da thiếu ẩm' },
        ],
      },
      {
        skinType: 'da_nhay_cam',
        dos: [
          { ingredientName: 'Ceramide', purpose: 'Hỗ trợ hàng rào bảo vệ da' },
          { ingredientName: 'Panthenol', purpose: 'Làm dịu và dưỡng ẩm' },
        ],
        donts: [
          { ingredientName: 'Fragrance', reason: 'Có thể gây kích ứng da nhạy cảm' },
          { ingredientName: 'Alcohol Denat', reason: 'Có thể gây khô và kích ứng' },
        ],
      },
      {
        skinType: 'da_thuong',
        dos: [
          { ingredientName: 'Niacinamide', purpose: 'Duy trì hàng rào da khỏe mạnh' },
          { ingredientName: 'Hyaluronic Acid', purpose: 'Duy trì độ ẩm' },
        ],
        donts: [
          { ingredientName: 'Fragrance', reason: 'Có thể gây kích ứng tùy cơ địa' },
        ],
      },
    ]);
    console.log('Đã nạp Từ điển Hồ sơ da (SkinDictionary)');

    // 5. Tạo sẵn vài sản phẩm trong Tủ đồ của User để test thuật toán Routine
    await MyCollection.insertMany([
      {
        userId: testUser._id,
        productName: 'Sữa rửa mặt CeraVe Foaming Cleanser',
        productType: 'cleanser',
        ingredientsList: ['Water', 'Niacinamide', 'Ceramide NP', 'Hyaluronic Acid'],
        openedDate: new Date('2026-01-10'),
        expirationDate: new Date('2027-01-10'),
        status: 'active',
        note: 'Dùng hàng ngày sáng/tối',
      },
      {
        userId: testUser._id,
        productName: "Paula's Choice Skin Perfecting 2% BHA",
        productType: 'serum',
        ingredientsList: ['Salicylic Acid', 'Camellia Oleifera Leaf Extract'],
        openedDate: new Date('2025-12-01'),
        expirationDate: new Date('2026-04-15'), // Sắp hết hạn
        status: 'expiring',
        note: 'Dùng cách ngày buổi tối',
      },
      {
        userId: testUser._id,
        productName: 'Kem dưỡng La Roche-Posay B5+',
        productType: 'cream',
        ingredientsList: ['Panthenol 5%', 'Madecassoside', 'Zinc Gluconate'],
        openedDate: new Date('2026-02-01'),
        expirationDate: new Date('2027-02-01'),
        status: 'active',
        note: 'Phục hồi da',
      },
    ]);
    console.log('Đã nạp sản phẩm mẫu vào Tủ đồ cá nhân');

    console.log('\n===> NẠP DỮ LIỆU THÀNH CÔNG! <===');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi nạp dữ liệu:', error);
    process.exit(1);
  }
};

seedDatabase();