const Post = require('../models/postModel');
const factory = require('./handlerFactory');


//get all post
exports.getAllPost = factory.getAll(Post);
exports.updatePost = factory.updateOne(Post);
exports.deletePost = factory.deleteOne(Post);
exports.createPost = factory.createOne(Post);
exports.getPostById = factory.getOne(Post);
exports.likePost = factory.likeOne(Post);
exports.unlikePost = factory.unlikeOne(Post);