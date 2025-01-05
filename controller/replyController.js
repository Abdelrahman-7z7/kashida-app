const Reply = require('../models/replyModel')
const User = require('../models/userModel')
const factory = require('./handlerFactory')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const mongoose = require('mongoose')
const APIFeatures = require('../utils/apiFeatures')
const {ReplyLikes} = require('../models/likedByModel')
const Comment = require('../models/commentModel')

exports.checkUser = catchAsync(async (req, res, next) => {
    const reply = await Reply.findById(req.params.id);

    if(!reply){
        return next(new AppError('no reply found with that id', 404))
    }

    if(reply.user._id.toString() !== req.user.id && req.user.role !== 'admin'){
        return next(new AppError('you do not have permission to do this action', 403))
    }

    req.reply = reply;

    next()
})

exports.updateReply = factory.updateOne(Reply);
exports.deleteReply = factory.deleteOne(Reply);

exports.deleteReply = catchAsync(async (req, res, next)=>{
    const reply = await Reply.findByIdAndDelete(req.params.id);
    
    if(!reply){
        return next(new AppError('no reply found with that id', 404))
    }
    
    await Comment.findByIdAndUpdate(reply.comment, { $inc: { reply: -1 } })

    res.status(204).json({
        status: 204,
        message: 'Reply deleted successfully'
    })
});

//sending a report over a reply
exports.sendReport = factory.sendReport(Reply);

exports.createReply = catchAsync(async (req, res, next)=>{
    const commentId = req.params.commentId
    const userId = req.user.id

    const comment = await Comment.findById(commentId);

    if(!comment){
        return next(new AppError('no comment found with that id', 404))
    }

    const reply = await Reply.create({
        comment: commentId,
        user: userId,
        reply: req.body.reply
    })

    // Increment the reply count in the comment
    await Comment.findByIdAndUpdate(commentId, { $inc: { reply: 1 } });

    res.status(201).json({
        status: 201,
        data: {
            reply
        }
    })
});

// exports.getAllReplies = catchAsync(async (req, res, next) => {
//     const userId = req.user.id; // Get the current user's ID from the request
    
//     const replies = await Reply.aggregate([
//         // Step 1: Lookup likes for each reply
//         {
//             $lookup: {
//                 from: "replylikes", // Name of the ReplyLikes collection
//                 let: { replyId: "$_id" }, // Reference to the current reply's `_id`
//                 pipeline: [
//                     {
//                         $match: {
//                             $expr: {
//                                 $and: [
//                                     { $eq: ["$replyId", "$$replyId"] }, // Match the replyId
//                                     { $eq: ["$userId", new mongoose.Types.ObjectId(userId)] }, // Match the userId
//                                 ],
//                             },
//                         },
//                     },
//                     { $project: { _id: 0 } }, // Exclude unnecessary fields from the join
//                 ],
//                 as: "userLike", // Output an array of matches
//             },
//         },
//         // Step 2: Add the hasLiked field
//         {
//             $addFields: {
//                 hasLiked: { $gt: [{ $size: "$userLike" }, 0] }, // True if userLike array is not empty
//             },
//         },
//         // Step 3: Remove unnecessary fields (optional)
//         {
//             $project: {
//                 userLike: 0, // Exclude the temporary userLike array
//             },
//         },
//     ]);
    
//     // Send the response
//     res.status(200).json({
//         status: "success",
//         results: replies.length,
//         data: {
//             replies: replies, // Return the list of replies with like status
//         },
//     });
// });

exports.getAllReplies = catchAsync(async (req, res, next) => {
    const currentUser = req.user.id
    const commentId = req.params.commentId

    //fetching all the replies on a comment
    const features = new APIFeatures(Reply.find({comment: commentId}), req.query).filter().pagination();
    const replies = await features.query

    //collect the replies IDs
    const replyIds = replies.map(reply => reply._id.toString())

    //fetching the likes for the replies
    const userLikes = await ReplyLikes.find({
        userId: currentUser,
        replyId: { $in: replyIds } // match the reply IDs
    })

    //create a set of liked reply IDs for quick lookup
    const likedReplyIds = new Set(userLikes.map(like => like.replyId.toString()))

    //add hasLiked field to each reply in the replies array
    const replyWithLikeStatus = replies.map(reply => ({
        ...reply.toObject(),
        hasLiked: likedReplyIds.has(reply._id.toString())
    }))

    //send reply
    res.status(200).json({
        status: "success",
        results: replyWithLikeStatus.length,
        data: {
            replies: replyWithLikeStatus, // Return the list of replies with like status
        },
    })
})

exports.getReplyById = catchAsync(async (req, res, next) => {
    const replyId = req.params.id; // Extract replyId from request parameters
    const userId = req.user.id; // Get the current user's ID from the request

    const reply = await Reply.aggregate([
        // Step 1: Match the specific reply by its ID
        {
            $match: {
                _id: new mongoose.Types.ObjectId(replyId), // Match the reply's `_id`
            },
        },
        // Step 2: Lookup likes for the reply
        {
            $lookup: {
                from: "replylikes", // Name of the ReplyLikes collection
                let: { replyId: "$_id" }, // Reference to the current reply's `_id`
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$replyId", "$$replyId"] }, // Match the replyId
                                    { $eq: ["$userId", new mongoose.Types.ObjectId(userId)] }, // Match the userId
                                ],
                            },
                        },
                    },
                    { $project: { _id: 0 } }, // Exclude unnecessary fields from the join
                ],
                as: "userLike", // Output an array of matches
            },
        },
        // Step 3: Add the hasLiked field
        {
            $addFields: {
                hasLiked: { $gt: [{ $size: "$userLike" }, 0] }, // True if userLike array is not empty
            },
        },
        // Step 4: Remove unnecessary fields (optional)
        {
            $project: {
                userLike: 0, // Exclude the temporary userLike array
            },
        },
    ]);

    // If no reply is found, handle it gracefully
    if (!reply.length) {
        return next(new AppError("No reply found with that ID", 404));
    }

    // Send the response
    res.status(200).json({
        status: "success",
        data: {
            reply: reply[0], // Return the single reply object
        },
    });
});


