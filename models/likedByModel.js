const mongoose = require('mongoose')

const likedBySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    postId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Post'
    },
    commentId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Comment'
    },
    replyId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Reply'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

//Ensure each user can like a specific item only once
likedBySchema.index({userId: 1, postId: 1}, {unique: true});
likedBySchema.index({userId: 1, commentId: 1}, {unique: true});
likedBySchema.index({userId: 1, replyId: 1}, {unique: true})

const LikedBy = mongoose.model('LikedBy', likedBySchema);
module.exports = LikedBy;