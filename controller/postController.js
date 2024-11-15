const Post = require('../models/postModel');
const factory = require('./handlerFactory');
const {PostLikes} = require('../models/likedByModel');
const catchAsync = require('../utils/catchAsync');
const mongoose = require('mongoose')
const AppError = require('../utils/appError')


exports.updatePost = factory.updateOne(Post);
exports.deletePost = factory.deleteOne(Post);
exports.createPost = factory.createOne(Post);

//get all post
// exports.getAllPost = factory.getAll(Post, PostLikes);
exports.getAllPost = catchAsync(async (req, res, next) => {
    const userId = req.user.id; // Current user's ID

    const posts = await Post.aggregate([
        // Step 1: Lookup likes for each post
        {
            $lookup: {
                from: "postlikes", // Name of the PostLikes collection
                let: { postId: "$_id" }, // Reference to the current post's _id
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$postId", "$$postId"] }, // Match the postId
                                    { $eq: ["$userId", new mongoose.Types.ObjectId(userId)] }, // Match the userId with `new`
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

    res.status(200).json({
        status: 'success',
        result: posts.length,
        data: {
            data: posts,
        },
    });
});

exports.getPostById = catchAsync(async (req, res, next) => {
    const postId = req.params.id; // Extract postId from request parameters
    const userId = req.user.id; // Get the current user's ID from the request

    // Validate that postId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(postId)) {
        return next(new AppError("Invalid Post ID", 400));
    }

    const post = await Post.aggregate([
        // Step 1: Match the specific post by its ID
        {
            $match: {
                _id: new mongoose.Types.ObjectId(postId), // Match the post's `_id`
            },
        },
        // Step 2: Lookup likes for the post
        {
            $lookup: {
                from: "postlikes", // Ensure the collection name matches exactly
                let: { postId: "$_id" }, // Reference to the current post's `_id`
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$postId", "$$postId"] }, // Match the postId
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

    // If no post is found, handle it gracefully
    if (!post.length) {
        return next(new AppError("No post found with that ID", 404));
    }

    // Send the response
    res.status(200).json({
        status: "success",
        data: {
            post: post[0] // Return the single post object
        },
    });
});
