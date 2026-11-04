const Joi = require('joi');
const { productTypes, productIcons } = require('../models/Collection');
const { skinTypes } = require('../models/CommunityPost');

const routineStep = Joi.object({
  productName: Joi.string().trim().min(1).max(150).required(),
  productType: Joi.string().valid(...productTypes).required(),
  productIcon: Joi.string().valid(...productIcons).allow(null, ''),
  brand: Joi.string().trim().max(100).allow(null, ''),
  note: Joi.string().trim().max(300).allow(null, ''),
});

const createSchema = Joi.object({
  content: Joi.string().trim().max(2000).allow(''),
  images: Joi.array().items(Joi.string().uri({ scheme: ['https'] }).pattern(/^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//)).max(5),
  tags: Joi.array().items(Joi.string().trim().pattern(/^#[\p{L}\p{N}_]{1,30}$/u)).max(10),
  skinType: Joi.string().valid(...skinTypes).allow(null),
  skinTypes: Joi.array().items(Joi.string().valid(...skinTypes)).unique().max(skinTypes.length),
  sharedRoutine: Joi.object({
    morning: Joi.array().items(routineStep).max(15),
    evening: Joi.array().items(routineStep).max(15),
    days: Joi.array().items(Joi.object({
      morning: Joi.array().items(routineStep).max(15),
      evening: Joi.array().items(routineStep).max(15),
    })).min(1).max(31),
  }).allow(null),
  status: Joi.string().valid('draft', 'published').default('published'),
}).custom((value, helpers) => {
  if (value.status === 'published' && !value.content?.trim()) {
    return helpers.error('any.invalid');
  }
  return value;
});

const notFound = res => res.status(404).json({ error: { message: 'Community post was not found', code: 'POST_NOT_FOUND' } });

exports.create = (req, res, next) => {
  const { error, value } = createSchema.validate(req.body || {}, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ error: { message: 'Request body is invalid', code: 'VALIDATION_ERROR' } });
  req.body = value;
  next();
};

exports.listQuery = (req, res, next) => {
  const { skinType, status, mine } = req.query;
  if ((status && !['draft', 'published'].includes(status)) || (status === 'draft' && mine !== 'true')) {
    return res.status(400).json({ error: { message: 'Drafts require the owner filter', code: 'VALIDATION_ERROR' } });
  }
  if (skinType && !skinTypes.includes(skinType)) {
    return res.status(400).json({ error: { message: 'Unknown skin type filter', code: 'VALIDATION_ERROR' } });
  }
  next();
};

exports.id = (req, res, next) => /^[a-f\d]{24}$/i.test(req.params.id) ? next() : notFound(res);
exports.notFound = notFound;
