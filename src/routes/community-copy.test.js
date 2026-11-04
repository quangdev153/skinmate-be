const assert = require('node:assert/strict');
const { test } = require('node:test');
const express = require('express');
const request = require('supertest');
const { errorHandler } = require('../middlewares/errorMiddleware');

test('community routes require an authenticated session before accessing posts', async () => {
  const app = express();
  app.use(express.json());
  app.use(require('./communityRoutes'));
  app.use(errorHandler);
  const id = '507f1f77bcf86cd799439011';
  for (const [method, path] of [
    ['get', '/'], ['get', `/${id}`], ['post', '/'], ['post', '/image'],
    ['patch', `/${id}`], ['delete', `/${id}`],
    ['post', `/${id}/like`], ['post', `/${id}/copy`],
  ]) {
    const response = await request(app)[method](path).expect(401);
    assert.equal(response.body.error.code, 'AUTH_REQUIRED');
  }
});
