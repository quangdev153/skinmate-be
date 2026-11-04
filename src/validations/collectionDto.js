const Joi = require('joi');
const { productTypes, statuses, productIcons } = require('../models/Collection');

const fields = {
  productName: Joi.string().trim().min(1).max(150),
  productType: Joi.string().valid(...productTypes),
  productIcon: Joi.string().valid(...productIcons).allow(null, ''),
  productImageUrl: Joi.string().uri({ scheme: ['http', 'https'] }).allow(null, ''),
  ingredients: Joi.array().items(Joi.string().trim().min(1).max(200)).max(100),
  analysisResult: Joi.object({
    baseScore: Joi.number().min(0).max(100),
    contextualScore: Joi.number().min(0).max(100),
    verdict: Joi.string().allow(null, ''),
    conflictResolution: Joi.string().allow(null, ''),
    bestPairingInCloset: Joi.string().allow(null, ''),
    futurePlan: Joi.string().allow(null, ''),
  }).allow(null),
  openedDate: Joi.date().iso().allow(null),
  expirationDate: Joi.date().iso().allow(null),
  paoDays: Joi.number().integer().min(1).max(3650).allow(null),
  note: Joi.string().trim().max(1000).allow(null, ''),
  status: Joi.string().valid(...statuses),
  continueAfterExpiry: Joi.boolean(),
  routineUsage: Joi.object({
    morning: Joi.boolean(),
    evening: Joi.boolean(),
    step: Joi.number().integer().min(1).allow(null),
  }).allow(null),
  brand: Joi.string().trim().max(100).allow(null, ''),
  size: Joi.string().trim().max(50).allow(null, ''),
  remainingPercent: Joi.number().min(0).max(100).allow(null),
};

function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body || {}, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ error: { message: 'Request body is invalid', code: 'VALIDATION_ERROR' } });
    req.body = value;
    next();
  };
}

exports.create = validate(Joi.object({ ...fields, productName: fields.productName.required(), productType: fields.productType.required() }));
exports.update = validate(Joi.object(fields).min(1));
exports.id = (req, res, next) => /^[a-f\d]{24}$/i.test(req.params.id) ? next() : res.status(404).json({ error: { message: 'Collection product was not found', code: 'COLLECTION_NOT_FOUND' } });
