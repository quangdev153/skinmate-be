const routineService = require('../services/routineService');
const User = require('../models/User');
const { sendSuccess } = require('../utils/response');

const handle = (operation, statusCode = 200) => async (req, res, next) => {
  try {
    const data = await operation(req);
    return sendSuccess(res, { data, statusCode });
  } catch (error) {
    next(error);
  }
};

const invalidInput = (message) => {
  const error = new Error(message);
  error.status = 400;
  throw error;
};

exports.generateRoutineChain = handle(req => {
  const { targetConcern } = req.body || {};
  if (targetConcern !== undefined && (typeof targetConcern !== 'string' || !targetConcern.trim())) {
    invalidInput('Mối quan tâm về da không hợp lệ');
  }
  return routineService.generateRoutineChain(req.user.id, targetConcern);
}, 201);
exports.activatePlan = handle(req => routineService.activatePlan(req.user.id, req.params.planId));
exports.skipPlan = handle(req => routineService.skipPlan(req.user.id, req.params.planId));
exports.getRoutineHistory = handle(req => routineService.getLegacyRoutineHistory(req.user.id));
exports.copyOldRoutine = handle(req => {
  const { overrideActive } = req.body || {};
  if (overrideActive !== undefined && typeof overrideActive !== 'boolean') {
    invalidInput('Giá trị xác nhận thay routine không hợp lệ');
  }
  return routineService.copyOldRoutine(req.user.id, req.params.planId, overrideActive);
});
exports.prepareRoutineForShare = handle(req => routineService.prepareRoutineForShare(req.user.id, req.params.planId, req.body || {}), 201);

exports.getGuide = handle(async req => {
  const user = req.user ? await User.findById(req.user.id).select('skinProfile').lean() : null;
  const skinType = req.query.skinType || user?.skinProfile?.skinType || 'normal';
  const allergies = req.query.allergies === undefined
    ? (user?.skinProfile?.allergies || [])
    : (typeof req.query.allergies === 'string' ? req.query.allergies.split(',') : null);
  if (typeof skinType !== 'string' || !Array.isArray(allergies)) invalidInput('Invalid guide parameters.');
  return routineService.getSkinGuide(skinType, allergies);
});
exports.suggestRoutine = handle(req => routineService.generateRoutinePlan(req.user.id));
exports.getRoutineDetail = handle(req => routineService.getRoutineDetail(req.user.id, req.params.id));
exports.activateRoutine = handle(req => routineService.activateRoutinePlan(req.user.id, req.params.id));
exports.dismissRoutine = handle(req => routineService.dismissRoutineSuggestion(req.user.id, req.params.id));
exports.getMyRoutine = handle(req => routineService.getMyRoutine(req.user.id));
exports.getHistory = handle(req => routineService.getRoutineHistory(req.user.id));
exports.checkCopyCompatibility = handle(req => routineService.checkCopyRoutineCompatibility(req.user.id, req.params.id));
exports.executeCopy = handle(req => {
  const { userChoice = 'start_now' } = req.body || {};
  if (!['start_now', 'queue_later'].includes(userChoice)) invalidInput('Invalid routine copy choice.');
  return routineService.executeCopyRoutine(req.user.id, req.params.id, { userChoice });
});
exports.getSharePreview = handle(req => routineService.getRoutineSharePreview(req.user.id, req.params.id));
exports.updateSkinProfile = handle(req => {
  const { skinType, allergies, currentConcerns, forceReset = false } = req.body || {};
  if ((skinType !== undefined && !['normal', 'dry', 'oily', 'combination', 'sensitive'].includes(skinType))
    || [allergies, currentConcerns].some(value => value !== undefined
      && (!Array.isArray(value) || value.some(item => typeof item !== 'string' || !item.trim())))
    || typeof forceReset !== 'boolean') {
    invalidInput('Invalid skin profile.');
  }
  return routineService.updateSkinProfileWithImpact(req.user.id, { skinType, allergies, currentConcerns }, forceReset);
});
