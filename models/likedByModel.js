const mongoose = require('mongoose');

const postLikeSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    postId:{
        type: mongoose.Schema.ObjectId,
        ref: 'Post',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
},{
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
})

const commentLikeSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    commentId:{
        type: mongoose.Schema.ObjectId,
        ref: 'Comment',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
},{
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
})

const replyLikeSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    replyId:{
        type: mongoose.Schema.ObjectId,
        ref: 'Reply',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
},{
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
})

postLikeSchema.index({postId: 1, userId: 1}, {unique: true})
commentLikeSchema.index({commentId: 1, userId: 1}, {unique: true})
replyLikeSchema.index({replyId: 1, userId: 1}, {unique: true})

//query middleware for populating the posts
postLikeSchema.pre(/^find/, function(next){
    this.populate({
        path: 'postId',
        options: {
            sort: { createdAt: -1 }
        }
    })
    next();
})


const PostLikes = mongoose.model('PostLikes', postLikeSchema)
const CommentLikes = mongoose.model('CommentLikes', commentLikeSchema);
const ReplyLikes = mongoose.model('ReplyLikes', replyLikeSchema);

// Export the models for use in other parts of your application
module.exports = {
    PostLikes,
    CommentLikes,
    ReplyLikes,
}