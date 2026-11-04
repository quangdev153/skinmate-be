const assert = require('node:assert/strict');
const { test } = require('node:test');
const mongoose = require('mongoose');
const TreatmentPlan = require('./TreatmentPlan');

test('existing embedded routine days and cancellation statuses remain valid', () => {
  for (const status of ['paused', 'canceled', 'cancelled']) {
    const plan = new TreatmentPlan({
      userId: new mongoose.Types.ObjectId(),
      title: 'Existing routine',
      status,
      planPayload: [{
        dayIndex: 1,
        morning: [{ stepNumber: 1, stepType: 'cleanser', productName: 'Cleanser' }],
        evening: [],
      }],
    });
    assert.equal(plan.validateSync(), undefined);
    assert.equal(plan.toObject().planPayload[0].morning[0].productName, 'Cleanser');
  }
});

test('daily routine metadata coexists with embedded routine fields', () => {
  const sourceRoutineId = new mongoose.Types.ObjectId();
  const plan = new TreatmentPlan({
    userId: new mongoose.Types.ObjectId(),
    title: 'New routine',
    goal: 'Hydration',
    skinTypeTarget: 'normal',
    sourceRoutineId,
    currentDay: 2,
    notes: 'Routine notes',
  });
  assert.equal(plan.validateSync(), undefined);
  const stored = plan.toObject();
  assert.equal(stored.goal, 'Hydration');
  assert.equal(stored.currentDay, 2);
  assert.equal(String(stored.sourceRoutineId), String(sourceRoutineId));
  assert.deepEqual(stored.planPayload, []);
});
