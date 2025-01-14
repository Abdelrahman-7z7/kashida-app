const {PostLikes, CommentLikes, ReplyLikes} = require('../models/likedByModel');
const AppError = require('../utils/appError');
const Post = require('../models/postModel')
const Comment = require('../models/commentModel')
const Reply = require('../models/replyModel')
const catchAsync = require('../utils/catchAsync')
//helping for testing
const factory = require('./handlerFactory')
const mongoose = require('mongoose')

//get likes post
exports.getLike = catchAsync(async (req, res, next) => {

    const like = await PostLikes.findOne({userId: req.user.id, postId: req.params.postId})

    res.status(200).json({
        status:'success',
        hasLiked: like? true : false
    })
})

// //get all posts that the user has liked in a collection using middleware for population
// exports.getAllLikedPosts = catchAsync(async (req, res, next)=>{
//     //get the user id, fetch the user's liked posts
//     const userID = req.params.id

//     //fetch all posts that has the user id
//     const likedPosts = await PostLikes.find({userId: userID});

//     //send response
//     res.status(200).json({
//         status:'success',
//         data: {
//             likedPosts
//         }
//     })
// })

exports.getAllLikedPosts = catchAsync(async (req, res, next) => {
    const userId = req.params.id; // Target user ID
    const currentUserId = req.user.id; // Current authenticated user ID

    const likedPostsWithHasLiked = await PostLikes.aggregate([
        {
            $match: { userId: new mongoose.Types.ObjectId(userId) },
        },
        {
            $lookup: {
                from: 'posts',
                localField: 'postId',
                foreignField: '_id',
                as: 'postDetails',
            },
        },
        {
            $unwind: '$postDetails',
        },
        {
            $lookup: {
                from: 'postlikes',
                let: { postId: '$postId' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$postId', '$$postId'] },
                                    { $eq: ['$userId', new mongoose.Types.ObjectId(currentUserId)] },
                                ],
                            },
                        },
                    },
                ],
                as: 'currentUserLike',
            },
        },
        {
            $addFields: {
                hasLiked: {
                    $cond: {
                        if: { $eq: [userId, currentUserId] }, // If fetching own liked posts
                        then: true, // hasLiked is always true
                        else: { $gt: [{ $size: '$currentUserLike' }, 0] }, // Check if current user liked
                    },
                },
            },
        },
        {
            $replaceRoot: { newRoot: { $mergeObjects: ['$postDetails', { hasLiked: '$hasLiked' }] } },
        },
    ]);

    res.status(200).json({
        status: 'success',
        results: likedPostsWithHasLiked.length,
        data: {
            posts: likedPostsWithHasLiked,
        },
    });
});


//like post
exports.likePost = catchAsync(async (req, res, next) => {
    // 1) get the user and the post Id
    const userId = req.user.id;
    const postId = req.params.postId;

    // 2) check if the like exists
    const existingLike = await PostLikes.findOne({postId: postId, userId: userId});
    if(existingLike){
        return next(new AppError('You have already liked this message', 400));
    }

    // 3) if not, create the like 
    await PostLikes.create({postId: postId, userId: userId});

    // 4) increment like count on the post
    await Post.findByIdAndUpdate(postId, {$inc: {likes: 1}})

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
    const postId = req.params.postId;

    // 2) remove like from the likedBy model
    const deleteLike = await PostLikes.findOneAndDelete({postId: postId, userId: userId})
    
    // 3) check if the delete doesn't exists
    if(!deleteLike){
        return next(new AppError('You have not liked this post', 400))
    }

    // 4) likes decrement
    await Post.findByIdAndUpdate(postId, {$inc: {likes: -1}})

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
    const commentId = req.params.commentId;

    // 2) check if the like exists
    const existingLike = await CommentLikes.findOne({commentId: commentId, userId: userId});
    if(existingLike){
        return next(new AppError('You have already liked this comment', 400));
    }

    // 3) if not, create the like 
    await CommentLikes.create({commentId: commentId, userId: userId});

    // 4) increment like count on the comment
    await Comment.findByIdAndUpdate(commentId, {$inc: {likes: 1}})

    // 5) send response
    res.status(201).json({
        status: 'success',
        message: 'Liked Comment successfully'
    })
})

//unlike Comment
exports.unlikeComment = catchAsync(async (req, res, next) => {
    // 1) get the commentId and the userId
    const userId = req.user.id;
    const commentId = req.params.commentId;

    // 2) remove like from the likedBy model
    const deleteLike = await CommentLikes.findOneAndDelete({commentId: commentId, userId: userId})
    
    // 3) check if the delete doesn't exists
    if(!deleteLike){
        return next(new AppError('You have not liked this comment', 400))
    }

    // 4) likes decrement
    await Comment.findByIdAndUpdate(commentId, {$inc: {likes: -1}})

    // 5) send response
    res.status(200).json({
        status: 'success',
        message: 'Comment unliked successfully'
    })
})

//like Reply
exports.likeReply = catchAsync (async (req, res, next) => {
    // 1) get the user and the reply Id
    const userId = req.user.id;
    const replyId = req.params.replyId;

    // 2) check if the like exists
    const existingLike = await ReplyLikes.findOne({replyId: replyId, userId: userId});
    if(existingLike){
        return next(new AppError('You have already liked this reply', 400));
    }

    // 3) if not, create the like 
    await ReplyLikes.create({replyId: replyId, userId: userId});

    // 4) increment like count on the reply
    await Reply.findByIdAndUpdate(replyId, {$inc: {likes: 1}})

    // 5) send response
    res.status(201).json({
        status: 'success',
        message: 'Like Reply successfully'
    })
})

//unlike Reply
exports.unlikeReply = catchAsync(async (req, res, next) => {
    // 1) get the replyId and the userId
    const userId = req.user.id;
    const replyId = req.params.replyId;

    // 2) remove like from the likedBy model
    const deleteLike = await ReplyLikes.findOneAndDelete({replyId: replyId, userId: userId})
    
    // 3) check if the delete doesn't exists
    if(!deleteLike){
        return next(new AppError('You have not liked this reply', 400))
    }

    // 4) likes decrement
    await Reply.findByIdAndUpdate(replyId, {$inc: {likes: -1}})

    // 5) send response
    res.status(200).json({
        status: 'success',
        message: 'Reply unliked successfully'
    })
})

//get all likes
exports.getAllPostLikes = factory.getAll(PostLikes);
exports.getAllCommentLikes = factory.getAll(CommentLikes);
exports.getAllReplyLikes = factory.getAll(ReplyLikes);


