const DailyRoutine = require('../models/DailyRoutine');
const TreatmentPlan = require('../models/TreatmentPlan');
const Collection = require('../models/Collection');
const User = require('../models/User');
const routineService = require('./routineService');
const { PREBUILT_TEMPLATES } = require('./routine-catalog');
const { analyzeIngredientConflicts, analyzeSkinSuitability } = require('../utils/skinDictionaries');

const fail = (message, status = 400) => { const error = new Error(message); error.status = status; throw error; };
const today = () => new Date().toISOString().slice(0, 10);
const stepKeys = { cleanser: 'cleanse', toner: 'tone', essences: 'tone', serum: 'treat', treatment: 'treat', exfoliant: 'treat', cream: 'moisturize', moisturizer: 'moisturize', sunscreen: 'protect' };
const toStep = (step, timeOfDay) => ({
  ...step, stepKey: stepKeys[step.productType] || 'treat',
  instructions: step.instruction || '', ingredients: step.ingredients || (step.activeIngredient ? [step.activeIngredient] : []),
  isExternalRecommendation: Boolean(step.isExternalSuggestion), timeOfDay,
});
async function viewPlan(userId, id) {
  const { plan, dailyRoutines } = await routineService.getRoutineDetail(userId, id);
  return { ...plan, totalDays: plan.durationDays, description: plan.goal, days: dailyRoutines.map(day => ({
    dayNumber: day.dayNumber, title: `Ngày ${day.dayNumber}`, focus: plan.goal,
    steps: [...day.morningSteps.map(step => toStep(step, 'morning')), ...day.eveningSteps.map(step => toStep(step, 'evening'))],
  })) };
}
async function getActivePlan(userId) {
  const plan = await TreatmentPlan.findOne({ userId, status: 'active' });
  return plan ? viewPlan(userId, plan._id) : null;
}
async function baseRoutine(userId) {
  const plan = await getActivePlan(userId);
  if (!plan) return { userId, date: today(), dayNumber: 1, steps: [] };
  const elapsed = plan.startDate ? Math.max(0, Math.floor((Date.now() - new Date(plan.startDate)) / 86400000)) : 0;
  const dayNumber = Math.min(elapsed + 1, plan.totalDays);
  const day = plan.days.find(item => item.dayNumber === dayNumber);
  const steps = day?.steps || [];
  const ids = steps.map(step => step.productId).filter(Boolean);
  const products = await Collection.find({ userId, _id: { $in: ids } }).lean();
  return { userId, date: today(), planId: plan._id, planTitle: plan.title, dayNumber, steps: steps.map(step => {
    const product = products.find(item => String(item._id) === String(step.productId));
    return { ...step, ingredients: product?.ingredients || step.ingredients, productIcon: product?.productIcon };
  }) };
}
async function getDailyRoutine(userId) {
  const base = await baseRoutine(userId);
  const saved = await DailyRoutine.findOne({ userId, date: today() }).lean();
  if (saved && String(saved.planId || '') === String(base.planId || '')) return saved;
  return base.planId ? base : null;
}
async function checkIn(userId, conditions) {
  const allowed = ['binh_thuong', 'kho_rat', 'kich_ung', 'noi_mun', 'bong_dau'];
  if (!Array.isArray(conditions) || conditions.some(value => !allowed.includes(value))) fail('Invalid skin conditions.');
  if (conditions.includes('binh_thuong') && conditions.length > 1) fail('Normal skin cannot be combined with other conditions.');
  const base = await baseRoutine(userId);
  const previous = await DailyRoutine.findOne({ userId, date: today() }).lean();
  const irritated = conditions.some(value => ['kho_rat', 'kich_ung'].includes(value));
  const products = irritated ? await Collection.find({ userId, status: 'active' }).lean() : [];
  const replacement = products.find(product => (!product.expirationDate || new Date(product.expirationDate) > new Date())
    && (!product.openedDate || !product.paoDays || new Date(product.openedDate).getTime() + product.paoDays * 86400000 > Date.now())
    && (product.ingredients || []).some(value => /panthenol|b5|ceramide|centella/i.test(value))
    && !(product.ingredients || []).some(value => /retinol|salicylic|glycolic|bha|aha/i.test(value)));
  let overridden = false;
  const steps = base.steps.flatMap(step => {
    const strong = step.ingredients.some(value => /retinol|salicylic|glycolic|bha|aha/i.test(value));
    if (!irritated || !strong) return [step];
    overridden = true;
    return replacement ? [{ ...step, productId: replacement._id, productName: replacement.productName,
      ingredients: replacement.ingredients, productIcon: replacement.productIcon, isExternalRecommendation: false,
      instructions: replacement.note || '', dynamicReason: 'Ưu tiên sản phẩm phục hồi trong tủ đồ hôm nay.' }] : [];
  });
  return DailyRoutine.findOneAndUpdate({ userId, date: today() }, { $set: {
    ...base, steps, checkIn: { status: [...new Set(conditions)], updatedAt: new Date() },
    isOverridden: overridden, overrideReason: overridden ? 'Tạm bỏ hoạt chất mạnh khi da khô rát hoặc kích ứng.' : null,
    previousCheckIn: { savedAt: new Date(), value: previous || null },
  } }, { upsert: true, new: true, runValidators: true });
}
async function undoCheckIn(userId) {
  const saved = await DailyRoutine.findOne({ userId, date: today() });
  if (!saved?.previousCheckIn || Date.now() - new Date(saved.previousCheckIn.savedAt).getTime() > 10000) fail('Undo window has expired.');
  const previous = saved.previousCheckIn.value;
  if (!previous) { await DailyRoutine.deleteOne({ _id: saved._id, userId }); return getDailyRoutine(userId); }
  const { _id, __v, createdAt: _createdAt, updatedAt: _updatedAt, ...value } = previous;
  return DailyRoutine.findOneAndUpdate({ _id: saved._id, userId }, { $set: value }, { new: true, runValidators: true });
}
async function getSuggestedPlans(userId) {
  const plans = await TreatmentPlan.find({ userId, status: 'draft' }).lean();
  const drafts = await Promise.all(plans.map(plan => viewPlan(userId, plan._id)));
  const templates = PREBUILT_TEMPLATES.map((plan, index) => ({ ...plan, _id: `template-${index}`, isTemplate: true,
    totalDays: plan.days.length, days: plan.days.map(day => ({ ...day, steps: day.steps.map(step => ({ ...step, isExternalRecommendation: true })) })),
  }));
  return [...drafts, ...templates];
}
async function activatePlan(userId, id) {
  if (/^template-\d+$/.test(id)) {
    const template = PREBUILT_TEMPLATES[Number(id.slice(9))];
    if (!template) fail('Routine template not found.', 404);
    const plan = await TreatmentPlan.create({ userId, title: template.title, goal: template.description,
      durationDays: template.days.length, status: 'draft', planPayload: template.days.map(day => ({ dayIndex: day.dayNumber,
        morning: day.steps.filter(step => step.stepKey !== 'treat').map(step => toEmbeddedStep({ ...step, category: typeForKey[step.stepKey], isExternalRecommendation: true })),
        evening: day.steps.filter(step => step.stepKey !== 'protect').map(step => toEmbeddedStep({ ...step, category: typeForKey[step.stepKey], isExternalRecommendation: true })),
      })),
    });
    id = plan._id;
  }
  await routineService.activateRoutinePlan(userId, id);
  await DailyRoutine.deleteMany({ userId, date: today() });
  return viewPlan(userId, id);
}
const typeForKey = { cleanse: 'cleanser', tone: 'toner', treat: 'treatment', moisturize: 'moisturizer', protect: 'sunscreen' };
async function checkConflict(userId, { planId, dayNumber, newProduct = {} }) {
  if (!Array.isArray(newProduct.ingredients) || newProduct.ingredients.some(value => typeof value !== 'string')) fail('Invalid ingredients.');
  const plan = await viewPlan(userId, planId);
  const day = plan.days.find(item => item.dayNumber === Number(dayNumber));
  if (!day) fail('Routine day not found.', 404);
  const user = await User.findById(userId).select('skinProfile').lean();
  const result = analyzeIngredientConflicts(day.steps.flatMap(step => step.ingredients), newProduct.ingredients);
  const suitability = analyzeSkinSuitability(user?.skinProfile?.skinType, newProduct.ingredients);
  return { ...result, hasConflict: result.hasConflict || suitability.warnings.length > 0, suitabilityWarnings: suitability.warnings };
}
async function saveDays(userId, id, days) {
  const plan = await TreatmentPlan.findOne({ _id: id, userId });
  if (!plan) fail('Routine not found.', 404);
  plan.planPayload = days.map(day => ({ dayIndex: day.dayNumber,
    morning: day.steps.filter(step => step.timeOfDay !== 'evening').map(toEmbeddedStep),
    evening: day.steps.filter(step => step.timeOfDay !== 'morning').map(toEmbeddedStep),
  }));
  plan.durationDays = days.length;
  await plan.save();
  await DailyRoutine.deleteMany({ planId: id, userId, date: { $exists: false } });
  await DailyRoutine.deleteMany({ planId: id, userId, date: today() });
  return viewPlan(userId, id);
}
const toEmbeddedStep = step => ({ stepNumber: step.stepNumber, stepType: step.productType || step.category || 'treatment',
  productId: step.productId, productName: step.productName, usageNote: step.instructions,
  targetActiveIngredient: (step.ingredients || []).join(', '), isExternalSuggestion: step.isExternalRecommendation,
});
async function updatePlanProduct(userId, id, { dayNumber, stepNumber, productId, timeOfDay = 'both' }) {
  if (!Number.isInteger(dayNumber) || !Number.isInteger(stepNumber) || stepNumber < 1 || stepNumber > 5 || !productId
    || !['morning', 'evening', 'both'].includes(timeOfDay)) fail('Invalid routine step.');
  const plan = await viewPlan(userId, id);
  const day = plan.days.find(item => item.dayNumber === dayNumber);
  if (!day) fail('Routine day not found.', 404);
  const product = await Collection.findOne({ _id: productId, userId, status: 'active' }).lean();
  if (!product || (product.expirationDate && new Date(product.expirationDate) <= new Date())
    || (product.openedDate && product.paoDays && new Date(product.openedDate).getTime() + product.paoDays * 86400000 <= Date.now())) fail('Usable collection product not found.', 404);
  const replacement = { stepNumber, stepName: product.productType, productType: product.productType, productId: product._id,
    productName: product.productName, instructions: product.note || '', ingredients: product.ingredients || [], timeOfDay };
  const matchesStep = step => step.stepNumber === stepNumber && (timeOfDay === 'both' || step.timeOfDay === timeOfDay);
  const existing = day.steps.some(matchesStep);
  day.steps = existing ? day.steps.map(step => matchesStep(step) ? { ...replacement, timeOfDay: step.timeOfDay } : step) : [...day.steps, replacement];
  return saveDays(userId, id, plan.days);
}
async function addPlanDay(userId, id, { title, steps = [] }) {
  if (typeof title !== 'string' || !title.trim() || !Array.isArray(steps) || steps.length) fail('Add an empty day, then select products from your collection.');
  const plan = await viewPlan(userId, id);
  if (plan.days.length >= 30) fail('Routine cannot exceed 30 days.');
  plan.days.push({ dayNumber: plan.days.length + 1, steps: [] });
  return saveDays(userId, id, plan.days);
}
module.exports = { viewPlan, getActivePlan, getDailyRoutine, checkIn, undoCheckIn, getSuggestedPlans, activatePlan, checkConflict, toStep, updatePlanProduct, addPlanDay };
