const LikedBy = require('../models/likedByModel');
const AppError = require('../utils/appError');
const Post = require('../models/postModel')
const Comment = require('../models/commentModel')
const Reply = require('../models/replyModel')

//like post
exports.likePost = catchAsync (async (req, res, next) => {
    // 1) get the user and the post Id
    const userId = req.user.id;
    const {postId} = req.body;

    // 2) check if the like exists
    const existingLike = await LikedBy.findOne({postId: postId, userId: userId});
    if(existingLike){
        return next(new AppError('You have already liked this message', 400));
    }

    // 3) if not, create the like 
    await LikedBy.create({postId: postId, userId: userId});

    // 4) increment like count on the post
    await Post.findById(postId, {$inc: {likes: 1}})

    // 5) send response
    res.status(201).json({
        status: 'success',
        message: 'Liked post successfully'
    })
})

//unlike post
exports.unlikePost = catchAsync(async (req, res, next) => {
    // 1) get the postId and the userId
    const userId = req.user.id;
    const {postId} = req.body;

    // 2) remove like from the likedBy model
    const deleteLike = await LikedBy.findOneAndDelete({postId: postId, userId: userId})
    
    // 3) check if the delete doesn't exists
    if(!deleteLike){
        return next(new AppError('You have not liked this post', 400))
    }

    // 4) likes decrement
    await Post.findByIdAndDelete(postId, {$inc: {likes: -1}})

    // 5) send response
    res.status(200).json({
        status: 'success',
        message: 'Post unliked successfully'
    })
})

//like comment
exports.likeComment = catchAsync (async (req, res, next) => {
    // 1) get the user and the comment Id
    const userId = req.user.id;
    const {commentId} = req.body;

    // 2) check if the like exists
    const existingLike = await LikedBy.findOne({commentId: commentId, userId: userId});
    if(existingLike){
        return next(new AppError('You have already liked this message', 400));
    }

    // 3) if not, create the like 
    await LikedBy.create({commentId: commentId, userId: userId});

    // 4) increment like count on the comment
    await Comment.findById(commentId, {$inc: {likes: 1}})

    // 5) send response
    res.status(201).json({
        status: 'success',
        message: 'Liked post successfully'
    })
})

//unlike Comment
exports.unlikeComment = catchAsync(async (req, res, next) => {
    // 1) get the commentId and the userId
    const userId = req.user.id;
    const {commentId} = req.body;

    // 2) remove like from the likedBy model
    const deleteLike = await LikedBy.findOneAndDelete({commentId: commentId, userId: userId})
    
    // 3) check if the delete doesn't exists
    if(!deleteLike){
        return next(new AppError('You have not liked this post', 400))
    }

    // 4) likes decrement
    await Comment.findByIdAndDelete(commentId, {$inc: {likes: -1}})

    // 5) send response
    res.status(200).json({
        status: 'success',
        message: 'Post unliked successfully'
    })
})

//like Reply
exports.likeReply = catchAsync (async (req, res, next) => {
    // 1) get the user and the reply Id
    const userId = req.user.id;
    const {replyId} = req.body;

    // 2) check if the like exists
    const existingLike = await LikedBy.findOne({replyId: replyId, userId: userId});
    if(existingLike){
        return next(new AppError('You have already liked this message', 400));
    }

    // 3) if not, create the like 
    await LikedBy.create({replyId: replyId, userId: userId});

    // 4) increment like count on the reply
    await Reply.findById(replyId, {$inc: {likes: 1}})

    // 5) send response
    res.status(201).json({
        status: 'success',
        message: 'Liked post successfully'
    })
})

//unlike Reply
exports.unlikeComment = catchAsync(async (req, res, next) => {
    // 1) get the replyId and the userId
    const userId = req.user.id;
    const {replyId} = req.body;

    // 2) remove like from the likedBy model
    const deleteLike = await LikedBy.findOneAndDelete({replyId: replyId, userId: userId})
    
    // 3) check if the delete doesn't exists
    if(!deleteLike){
        return next(new AppError('You have not liked this post', 400))
    }

    // 4) likes decrement
    await Reply.findByIdAndDelete(replyId, {$inc: {likes: -1}})

    // 5) send response
    res.status(200).json({
        status: 'success',
        message: 'Post unliked successfully'
    })
})