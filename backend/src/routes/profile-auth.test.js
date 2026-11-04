const assert = require('node:assert/strict');
const { test } = require('node:test');
const express = require('express');
const request = require('supertest');
const { errorHandler } = require('../middlewares/errorMiddleware');

for (const [name, modulePath, path] of [
    ['account profile', './account-profile', '/'],
    ['skin profile', './skinProfileRoutes', '/profile'],
    ['routine history', './routineRoutes', '/history'],
    ['my routine', './routineRoutes', '/my-routine'],
]) {
    test(`${name} requires a real authenticated session`, async () => {
        const app = express();
        app.use(require(modulePath));
        app.use(errorHandler);
        const response = await request(app).get(path).expect(401);
        assert.equal(response.body.error.code, 'AUTH_REQUIRED');
    });
}
