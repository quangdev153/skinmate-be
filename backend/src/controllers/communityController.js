const mongoose = require('mongoose');
const CommunityPost = require('../models/CommunityPost');
const TreatmentPlan = require('../models/TreatmentPlan');
const DailyRoutine = require('../models/DailyRoutine');
const Collection = require('../models/Collection');
const User = require('../models/User');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const { notFound } = require('../validations/postDto');

const PAGE_SIZE = 20;

const currentUserId = req => req.user.id;

const getSkinTypes = post => {
  if (Array.isArray(post.skinTypes) && post.skinTypes.length) return post.skinTypes;
  return post.skinType ? [post.skinType] : [];
};

const normalizeSkinTypes = (body, req) => {
  if (Array.isArray(body.skinTypes)) {
    return { ...body, skinTypes: body.skinTypes, skinType: body.skinTypes[0] || null };
  }
  const profileSkinType = req.user?.skinProfile?.skinType;
  if (profileSkinType) return { ...body, skinTypes: [profileSkinType], skinType: profileSkinType };
  return body;
};

const serialize = (post, userId, author) => ({
  id: post._id.toString(),
  authorId: post.userId.toString(),
  authorName: author?.fullName || post.authorName,
  authorAvatarUrl: author?.avatarUrl || null,
  content: post.content,
  images: post.images || [],
  tags: post.tags || [],
  skinType: post.skinType,
  skinTypes: getSkinTypes(post),
  sharedRoutine: {
    morning: post.sharedRoutine?.morning || [],
    evening: post.sharedRoutine?.evening || [],
    days: post.sharedRoutine?.days,
  },
  status: post.status,
  likesCount: post.likesCount,
  copiesCount: post.copiesCount,
  isLiked: (post.likedBy || []).some(id => id.toString() === userId),
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
});

const serializePosts = async (posts, userId) => {
  if (!posts.length) return [];
  // Read only public profile fields; batch authors for the whole feed.
  const authors = await User.find({ _id: { $in: posts.map(post => post.userId) } })
    .select('_id fullName avatarUrl').lean();
  const authorsById = new Map(authors.map(author => [String(author._id), author]));
  return posts.map(post => serialize(post, userId, authorsById.get(String(post.userId))));
};

const serializePost = async (post, userId) => (await serializePosts([post], userId))[0];

exports.uploadImages = async (req, res, next) => {
  try {
    if (!req.files?.length) return res.status(400).json({ error: { message: 'A JPG, PNG, or WebP image is required', code: 'INVALID_IMAGE' } });
    const images = [];
    for (const file of req.files) {
      const result = await uploadToCloudinary(file, 'skinmate/community');
      images.push(result.secureUrl);
    }
    res.status(201).json({ images });
  } catch (error) {
    res.status(error.code === 'CLOUDINARY_NOT_CONFIGURED' ? 503 : 502);
    next(error);
  }
};

exports.list = async (req, res, next) => {
  try {
    const userId = currentUserId(req);
    const filter = { status: 'published' };
    if (req.query.skinType) filter.$or = [{ skinTypes: req.query.skinType }, { skinType: req.query.skinType }];
    if (req.query.mine === 'true') {
      filter.userId = userId;
      if (req.query.status === 'draft') filter.status = 'draft';
    }
    const before = req.query.before ? new Date(req.query.before) : null;
    if (before && !Number.isNaN(before.getTime())) filter.createdAt = { $lt: before };

    const posts = await CommunityPost.find(filter).sort({ createdAt: -1 }).limit(PAGE_SIZE).lean();
    res.json({ posts: await serializePosts(posts, userId) });
  } catch (error) {
    next(error);
  }
};

exports.get = async (req, res, next) => {
  try {
    const post = await CommunityPost.findOne({
      _id: req.params.id,
      $or: [{ status: 'published' }, { status: 'draft', userId: currentUserId(req) }],
    }).lean();
    return post ? res.json({ post: await serializePost(post, currentUserId(req)) }) : notFound(res);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const userId = currentUserId(req);
    const author = await User.findById(userId).select('_id fullName avatarUrl').lean();
    const post = await CommunityPost.create({
      ...normalizeSkinTypes(req.body, req),
      userId,
      authorName: author?.fullName?.slice(0, 80) || undefined,
    });
    res.status(201).json({ post: serialize(post.toObject(), userId, author) });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const userId = currentUserId(req);
    const post = await CommunityPost.findOneAndUpdate(
      { _id: req.params.id, userId, status: 'draft' },
      { $set: normalizeSkinTypes(req.body, req) },
      { returnDocument: 'after', runValidators: true }
    ).lean();
    return post ? res.json({ post: await serializePost(post, userId) }) : notFound(res);
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const post = await CommunityPost.findOneAndUpdate(
      { _id: req.params.id, userId: currentUserId(req), status: 'published' },
      { status: 'deleted' }
    );
    return post ? res.status(204).send() : notFound(res);
  } catch (error) {
    next(error);
  }
};

// Like/unlike are conditional updates so concurrent taps cannot double count.
exports.toggleLike = async (req, res, next) => {
  try {
    const userId = currentUserId(req);
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const base = { _id: req.params.id, status: 'published' };
    let post = await CommunityPost.findOneAndUpdate(
      { ...base, likedBy: { $ne: userObjectId } },
      { $addToSet: { likedBy: userObjectId }, $inc: { likesCount: 1 } },
      { returnDocument: 'after' }
    ).lean();
    if (!post) {
      post = await CommunityPost.findOneAndUpdate(
        { ...base, likedBy: userObjectId },
        { $pull: { likedBy: userObjectId }, $inc: { likesCount: -1 } },
        { returnDocument: 'after' }
      ).lean();
    }
    return post ? res.json({ post: await serializePost(post, userId) }) : notFound(res);
  } catch (error) {
    next(error);
  }
};

// Copies the shared routine into the viewer's My Routine as a draft.
exports.copyRoutine = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const post = await CommunityPost.findOne({ _id: req.params.id, status: 'published' }).lean();
    if (!post) return notFound(res);
    if (String(post.userId) === String(userId)) {
      return res.status(403).json({ error: { message: 'You cannot copy your own routine', code: 'OWN_ROUTINE' } });
    }

    const days = post.sharedRoutine?.days?.length ? post.sharedRoutine.days : [post.sharedRoutine || {}];
    const sharedSteps = days.flatMap(day => [...(day.morning || []), ...(day.evening || [])]);
    if (!sharedSteps.length) {
      return res.status(400).json({ error: { message: 'This post has no routine to copy', code: 'EMPTY_ROUTINE' } });
    }
    const normalizeName = name => name.trim().replace(/\s+/g, ' ').toLowerCase();
    const products = await Collection.find({ userId }).lean();
    const productsByName = new Map(products.map(product => [normalizeName(product.productName), product]));
    let addedProductsCount = 0;
    for (const step of sharedSteps) {
      const name = normalizeName(step.productName);
      if (productsByName.has(name)) continue;
      const product = await Collection.create({
        userId, productName: step.productName.trim(), productType: step.productType,
        ...(step.productIcon ? { productIcon: step.productIcon } : {}),
        status: 'active',
      });
      productsByName.set(name, product);
      addedProductsCount += 1;
    }
    const copyStep = (step, index, slot) => {
      const product = productsByName.get(normalizeName(step.productName));
      return {
        stepNumber: step.stepNumber || index + 1,
        stepName: step.productType || `${slot} step`,
        productType: product.productType,
        productId: product._id,
        productName: product.productName,
        instruction: step.note || '',
        isExternalSuggestion: false,
      };
    };
    const routineDays = days.map((day, dayIndex) => ({
      dayNumber: dayIndex + 1,
      morningSteps: (day.morning || []).map((step, index) => copyStep(step, index, 'Morning')),
      eveningSteps: (day.evening || []).map((step, index) => copyStep(step, index, 'Evening')),
    }));

    if (!routineDays.some(day => day.morningSteps.length || day.eveningSteps.length)) {
      return res.status(400).json({ error: { message: 'This post has no routine to copy', code: 'EMPTY_ROUTINE' } });
    }

    const plan = await TreatmentPlan.create({
      userId,
      title: `Cộng đồng · ${post.content || 'Routine được chia sẻ'}`.slice(0, 150),
      goal: 'Routine được sao chép từ Cộng đồng',
      durationDays: routineDays.length,
      status: 'draft',
      isOriginalSuggested: false,
      notes: `Copied from community post ${post._id}`,
    });

    await DailyRoutine.insertMany(routineDays.map(day => ({ ...day, planId: plan._id, userId, isDraft: true })));
    const updated = await CommunityPost.findByIdAndUpdate(post._id, { $inc: { copiesCount: 1 } }, { returnDocument: 'after' }).lean();
    return res.status(201).json({ copiedCount: routineDays.length, addedProductsCount, plan, post: await serializePost(updated, userId) });
  } catch (error) {
    next(error);
  }
};
