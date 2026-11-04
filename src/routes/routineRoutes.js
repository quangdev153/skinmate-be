const express = require('express');
const routineController = require('../controllers/routineController');
const authenticate = require('../middlewares/authMiddleware');

const router = express.Router();
router.get('/guide', (req, res, next) => {
  if (req.get('authorization')) {
    return authenticate(req, res, error => error ? next(error) : routineController.getGuide(req, res, next));
  }
  return routineController.getGuide(req, res, next);
});
router.use(authenticate);
router.post('/suggest', routineController.suggestRoutine);
router.put('/skin-profile', routineController.updateSkinProfile);
router.get('/my-routine', routineController.getMyRoutine);
router.get('/history', routineController.getHistory);
router.get('/:id', routineController.getRoutineDetail);
router.post('/:id/activate', routineController.activateRoutine);
router.post('/:id/dismiss', routineController.dismissRoutine);
router.post('/:id/copy/check', routineController.checkCopyCompatibility);
router.post('/:id/copy', routineController.executeCopy);
router.get('/:id/share-preview', routineController.getSharePreview);

const profileRouter = express.Router();
profileRouter.use(authenticate);
profileRouter.post('/generate-chain', routineController.generateRoutineChain);
profileRouter.put('/plans/:planId/activate', routineController.activatePlan);
profileRouter.put('/plans/:planId/skip', routineController.skipPlan);
profileRouter.get('/history', routineController.getRoutineHistory);
profileRouter.post('/history/:planId/copy', routineController.copyOldRoutine);
profileRouter.post('/plans/:planId/share-payload', routineController.prepareRoutineForShare);

const dailyRouter = express.Router();
const dailyService = require('../services/daily-routine-service');
const { sendSuccess } = require('../utils/response');
const daily = operation => async (req, res, next) => {
  try { return sendSuccess(res, { data: await operation(req) }); } catch (error) { next(error); }
};
dailyRouter.use(authenticate);
dailyRouter.get('/daily', daily(req => dailyService.getDailyRoutine(req.user.id)));
dailyRouter.post('/daily/checkin', daily(req => dailyService.checkIn(req.user.id, req.body?.conditions)));
dailyRouter.post('/daily/undo', daily(req => dailyService.undoCheckIn(req.user.id)));
dailyRouter.get('/plan/active', daily(req => dailyService.getActivePlan(req.user.id)));
dailyRouter.get('/plan/suggested', daily(req => dailyService.getSuggestedPlans(req.user.id)));
dailyRouter.get('/plan/:planId', daily(req => dailyService.viewPlan(req.user.id, req.params.planId)));
dailyRouter.post('/plan/:planId/activate', daily(req => dailyService.activatePlan(req.user.id, req.params.planId)));
dailyRouter.post('/plan/:planId/product', daily(req => dailyService.updatePlanProduct(req.user.id, req.params.planId, req.body || {})));
dailyRouter.post('/plan/:planId/day', daily(req => dailyService.addPlanDay(req.user.id, req.params.planId, req.body || {})));
dailyRouter.post('/check-conflict', daily(req => dailyService.checkConflict(req.user.id, req.body || {})));
dailyRouter.get('/external-recommendations', daily(() => require('../services/routine-catalog').EXTERNAL_RECOMMENDATIONS));

module.exports = router;
module.exports.profileRouter = profileRouter;
module.exports.dailyRouter = dailyRouter;
