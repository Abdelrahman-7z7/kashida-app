const Post = require('../models/postModel')
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');


//get all post
exports.getAllPost = factory.getAll(Post);
exports.updatePost = factory.updateOne(Post);
exports.deletePost = factory.deleteOne(Post);
exports.createPost = factory.createOne(Post);
exports.getPostById = factory.getOne(Post);