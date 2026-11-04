const User = require('../models/User');
const SkinDictionary = require('../models/SkinDictionary');
const Collection = require('../models/Collection');
const TreatmentPlan = require('../models/TreatmentPlan');

exports.getSkinProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('Không tìm thấy người dùng');

  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    skinProfile: user.skinProfile,
  };
};

/**
 * 1. Lấy thông tin cẩm nang da (Do's & Don'ts) dựa trên loại da và dị ứng
 */
exports.getSkinGuide = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.skinProfile?.skinType) {
    return {
      skinType: user?.skinProfile?.skinType || null,
      dos: [],
      donts: (user?.skinProfile?.allergies || []).map((ingredientName) => ({
        ingredientName,
        reason: 'Dị ứng cá nhân trong hồ sơ',
      })),
    };
  }

  const dictionary = await SkinDictionary.findOne({ skinType: user.skinProfile.skinType });
  const dos = dictionary ? dictionary.dos : [];
  let donts = dictionary ? [...dictionary.donts] : [];

  // Thêm các chất dị ứng của người dùng vào danh mục Don'ts
  if (user.skinProfile.allergies && user.skinProfile.allergies.length > 0) {
    user.skinProfile.allergies.forEach((allergy) => {
      if (!donts.some((d) => d.ingredientName?.toLowerCase() === allergy.toLowerCase())) {
        donts.push({ ingredientName: allergy, reason: 'Dị ứng cá nhân trong hồ sơ' });
      }
    });
  }

  return { skinType: user.skinProfile.skinType, dos, donts };
};

/**
 * 2. Thiết lập hoặc cập nhật lại hồ sơ da
 * Xử lý: Tra cứu cẩm nang mới, tính toán lại độ phù hợp của tủ đồ, cảnh báo/hủy phác đồ cũ nếu được yêu cầu
 */
exports.updateSkinProfile = async (userId, { skinType, allergies, currentConcerns, cancelActivePlan = false }) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('Không tìm thấy người dùng');

  const oldSkinType = user.skinProfile?.skinType;
  const isSkinTypeChanged = oldSkinType && oldSkinType !== skinType;

  if (isSkinTypeChanged) {
    const activePlan = await TreatmentPlan.findOne({ userId, status: 'active' });
    if (activePlan) {
      if (!cancelActivePlan) {
        const activePlanWarning = {
          hasActivePlan: true,
          planId: activePlan._id,
          message: 'Việc đổi loại da sẽ tác động đến phác đồ điều trị đang chạy. Vui lòng xác nhận hủy phác đồ cũ.',
        };
        return { activePlanWarning };
      }
      activePlan.status = 'canceled';
      await activePlan.save();
    }
  }

  user.skinProfile = {
    skinType,
    allergies: allergies || [],
    currentConcerns: currentConcerns || [],
  };
  await user.save();

  const closetProducts = await Collection.find({ userId, status: 'active' });
  const dictionary = await SkinDictionary.findOne({ skinType });
  const dontList = dictionary ? dictionary.donts.map((d) => d.ingredientName.toLowerCase()) : [];
  const userAllergies = (allergies || []).map((allergy) => allergy.toLowerCase());

  const evaluatedCloset = closetProducts.map((p) => {
    const conflictingIngredients = p.ingredients.filter((ingredient) => {
      const lower = ingredient.toLowerCase();
      return dontList.some((dont) => lower.includes(dont) || dont.includes(lower))
        || userAllergies.some((allergy) => lower.includes(allergy) || allergy.includes(lower));
    });
    const compatibilityScore = conflictingIngredients.length ? 30 : 100;

    return {
      productId: p._id,
      productName: p.productName,
      compatibilityScore,
      suitable: compatibilityScore >= 70,
      conflictingIngredients,
    };
  });

  return {
    user: {
      id: user._id,
      fullName: user.fullName,
      skinProfile: user.skinProfile,
    },
    evaluatedCloset,
  };
};