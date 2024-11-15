const Reply = require('../models/replyModel')
const factory = require('./handlerFactory')

exports.getAllReplies = factory.getAll(Reply);
exports.createReply = factory.createOne(Reply);
exports.updateReply = factory.updateOne(Reply);
exports.deleteReply = factory.deleteOne(Reply);
exports.getReplyById = factory.getOne(Reply);
