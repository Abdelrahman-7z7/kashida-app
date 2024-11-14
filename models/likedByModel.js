const mongoose = require('mongoose');

const postLikeSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    },
    postId:{
        type: mongoose.Schema.ObjectId,
        ref: 'Post',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
})

const commentLikeSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    },
    commentId:{
        type: mongoose.Schema.ObjectId,
        ref: 'Comment',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
})

const replyLikeSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    },
    replyId:{
        type: mongoose.Schema.ObjectId,
        ref: 'Reply',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
})

postLikeSchema.index({postId: 1, userId: 1}, {unique: true})
commentLikeSchema.index({commentId: 1, userId: 1}, {unique: true})
replyLikeSchema.index({replyId: 1, userId: 1}, {unique: true})

const PostLikes = mongoose.model('PostLikes', postLikeSchema)
const CommentLikes = mongoose.model('CommentLikes', commentLikeSchema);
const ReplyLikes = mongoose.model('ReplyLikes', replyLikeSchema);

// Export the models for use in other parts of your application
module.exports = {
    PostLikes,
    CommentLikes,
    ReplyLikes,
}