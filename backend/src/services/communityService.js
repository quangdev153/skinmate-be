const CommunityPost = require('../models/CommunityPost');

exports.listPosts = () => CommunityPost.find()
  .sort({ createdAt: -1 })
  .limit(50)
  .populate('userId', 'fullName skinProfile.skinType')
  .lean();
