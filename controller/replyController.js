const Reply = require('../models/replyModel')
const factory = require('./handlerFactory')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const mongoose = require('mongoose')

exports.createReply = factory.createOne(Reply);
exports.updateReply = factory.updateOne(Reply);
exports.deleteReply = factory.deleteOne(Reply);

exports.getAllReplies = catchAsync(async (req, res, next) => {
    const userId = req.user.id; // Get the current user's ID from the request
    
    const replies = await Reply.aggregate([
        // Step 1: Lookup likes for each reply
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
        // Step 2: Add the hasLiked field
        {
            $addFields: {
                hasLiked: { $gt: [{ $size: "$userLike" }, 0] }, // True if userLike array is not empty
            },
        },
        // Step 3: Remove unnecessary fields (optional)
        {
            $project: {
                userLike: 0, // Exclude the temporary userLike array
            },
        },
    ]);
    
    // Send the response
    res.status(200).json({
        status: "success",
        results: replies.length,
        data: {
            replies: replies, // Return the list of replies with like status
        },
    });
});

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


