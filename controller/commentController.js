const Comment = require('../models/commentModel')
const factory = require('./handlerFactory')

exports.getAllComments = factory.getAll(Comment);
exports.getCommentById = factory.getOne(Comment);
exports.updateComment = factory.updateOne(Comment);
exports.deleteComment = factory.deleteOne(Comment);
exports.createComment = factory.createOne(Comment);
exports.likeComment = factory.updateOne(Comment, 'increment');
exports.unlikeComment = factory.updateOne(Comment, 'decrement');