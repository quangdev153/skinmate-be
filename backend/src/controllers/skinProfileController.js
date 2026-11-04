const skinProfileService = require('../services/skinProfileService');

exports.getSkinProfile = async (req, res, next) => {
  try {
    const data = await skinProfileService.getSkinProfile(req.user.id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.getSkinGuide = async (req, res, next) => {
  try {
    const data = await skinProfileService.getSkinGuide(req.user.id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.updateSkinProfile = async (req, res, next) => {
  try {
    const { skinType, allergies, currentConcerns, cancelActivePlan } = req.body || {};
    const validSkinTypes = ['da_dau', 'da_kho', 'da_hon_hop', 'da_nhay_cam', 'da_thuong'];
    if (!validSkinTypes.includes(skinType)) {
      return res.status(400).json({ success: false, message: 'Loại da không hợp lệ' });
    }
    if (allergies !== undefined && (!Array.isArray(allergies) || allergies.some((item) => typeof item !== 'string'))) {
      return res.status(400).json({ success: false, message: 'Danh sách dị ứng không hợp lệ' });
    }
    if (currentConcerns !== undefined && (!Array.isArray(currentConcerns) || currentConcerns.some((item) => typeof item !== 'string'))) {
      return res.status(400).json({ success: false, message: 'Danh sách tình trạng da không hợp lệ' });
    }
    if (cancelActivePlan !== undefined && typeof cancelActivePlan !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Giá trị xác nhận hủy routine không hợp lệ' });
    }

    const result = await skinProfileService.updateSkinProfile(req.user.id, {
      skinType,
      allergies,
      currentConcerns,
      cancelActivePlan,
    });
    if (result.activePlanWarning) {
      return res.status(409).json({ success: false, ...result });
    }
    return res.status(200).json({ success: true, message: 'Cập nhật hồ sơ da thành công', data: result });
  } catch (error) {
    next(error);
  }
};