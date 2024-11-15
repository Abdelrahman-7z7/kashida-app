const Comment = require('../models/commentModel')
const factory = require('./handlerFactory')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const mongoose = require('mongoose')

exports.updateComment = factory.updateOne(Comment);
exports.deleteComment = factory.deleteOne(Comment);
exports.createComment = factory.createOne(Comment);

exports.getAllComments = catchAsync(async (req, res, next) => {
    const userId = req.user.id; // Get the current user's ID from the request

    const comments = await Comment.aggregate([
        // Step 1: Lookup likes for each comment
        {
            $lookup: {
                from: "commentlikes", // Name of the CommentLikes collection
                let: { commentId: "$_id" }, // Reference to the current comment's `_id`
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$commentId", "$$commentId"] }, // Match the commentId
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
        results: comments.length,
        data: {
            comments: comments, // Return the list of comments with like status
        },
    });
});


// exports.getCommentById = factory.getOne(Comment);
// get a single comment by its ID
exports.getCommentById = catchAsync(async (req, res, next) => {
    const commentId = req.params.id; // Extract commentId from request parameters
    const userId = req.user.id; // Get the current user's ID from the request

    const comment = await Comment.aggregate([
        // Step 1: Match the specific comment by its ID
        {
            $match: {
                _id: new mongoose.Types.ObjectId(commentId), // Match the comment's `_id`
            },
        },
        // Step 2: Lookup likes for the comment
        {
            $lookup: {
                from: "commentlikes", // Name of the CommentLikes collection
                let: { commentId: "$_id" }, // Reference to the current comment's `_id`
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$commentId", "$$commentId"] }, // Match the commentId
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

    // If no comment is found, handle it gracefully
    if (!comment.length) {
        return next(new AppError("No comment found with that ID", 404));
    }

    // Send the response
    res.status(200).json({
        status: "success",
        data: {
            comment: comment[0], // Return the single comment object
        },
    });
});


