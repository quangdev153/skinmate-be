const assert = require('node:assert/strict');
const { test } = require('node:test');
const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const CommunityPost = require('../models/CommunityPost');
const Collection = require('../models/Collection');
const DailyRoutine = require('../models/DailyRoutine');
const TreatmentPlan = require('../models/TreatmentPlan');
const User = require('../models/User');
const { copyRoutine, list, get, toggleLike } = require('../controllers/communityController');

test('community copy reuses named products, adds missing products once and rejects own posts', async () => {
  const database = await MongoMemoryServer.create();
  try {
    // Connect only to the disposable database, never the configured application database.
    await mongoose.connect(database.getUri());
    const viewerId = new mongoose.Types.ObjectId();
    const authorId = new mongoose.Types.ObjectId();
    await User.create({
      _id: authorId, fullName: 'Routine Author', email: 'author@example.test',
      passwordHash: 'unused-in-controller-test', avatarUrl: 'https://example.test/avatar.jpg',
      termsAcceptedAt: new Date(), termsVersion: '1', privacyVersion: '1',
    });
    const existing = await Collection.create({ userId: viewerId, productName: 'My Cleanser', productType: 'cleanser', status: 'active' });
    await Collection.create({ userId: authorId, productName: 'New Serum', productType: 'serum', status: 'active' });
    const step = { productName: 'New Serum', productType: 'serum' };
    const post = await CommunityPost.create({ userId: authorId, content: 'Shared routine', sharedRoutine: {
      morning: [{ productName: '  MY   cleanser ', productType: 'cleanser' }, step], evening: [step],
    } });
    const app = express();
    // Supply authenticated identity at the controller boundary; route auth is tested separately.
    app.use((req, res, next) => { req.user = { id: String(viewerId) }; next(); });
    app.get('/', list);
    app.get('/:id', get);
    app.post('/:id/like', toggleLike);
    app.post('/:id/copy', copyRoutine);
    const feed = await request(app).get('/').expect(200);
    assert.equal(feed.body.posts[0].authorName, 'Routine Author');
    assert.equal(feed.body.posts[0].authorAvatarUrl, 'https://example.test/avatar.jpg');
    await User.updateOne({ _id: authorId }, { fullName: 'Updated Author', avatarUrl: null });
    const detail = await request(app).get(`/${post._id}`).expect(200);
    assert.equal(detail.body.post.authorName, 'Updated Author');
    assert.equal(detail.body.post.authorAvatarUrl, null);
    const liked = await request(app).post(`/${post._id}/like`).expect(200);
    assert.equal(liked.body.post.authorName, 'Updated Author');
    const response = await request(app).post(`/${post._id}/copy`).expect(201);
    assert.equal(response.body.addedProductsCount, 1);
    assert.equal(response.body.post.authorName, 'Updated Author');
    assert.equal(response.body.post.authorAvatarUrl, null);
    assert.equal(response.body.post.email, undefined);
    assert.equal(response.body.post.passwordHash, undefined);
    assert.equal(await Collection.countDocuments({ userId: viewerId }), 2);
    const daily = await DailyRoutine.findOne({ userId: viewerId }).lean();
    assert.equal(String(daily.morningSteps[0].productId), String(existing._id));
    assert.equal(String(daily.morningSteps[1].productId), String(daily.eveningSteps[0].productId));
    assert.equal(daily.eveningSteps[0].isExternalSuggestion, false);
    await request(app).post(`/${post._id}/copy`).expect(201);
    assert.equal(await Collection.countDocuments({ userId: viewerId }), 2);
    const ownPost = await CommunityPost.create({ userId: viewerId, content: 'My routine', sharedRoutine: { morning: [step] } });
    const plansBefore = await TreatmentPlan.countDocuments({ userId: viewerId });
    const denied = await request(app).post(`/${ownPost._id}/copy`).expect(403);
    assert.equal(denied.body.error.code, 'OWN_ROUTINE');
    assert.equal(await TreatmentPlan.countDocuments({ userId: viewerId }), plansBefore);
  } finally {
    await mongoose.disconnect();
    await database.stop();
  }
});
