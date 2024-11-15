const Post = require('../models/postModel');
const factory = require('./handlerFactory');
const {PostLikes} = require('../models/likedByModel');
const catchAsync = require('../utils/catchAsync');
const mongoose = require('mongoose')


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

exports.updatePost = factory.updateOne(Post);
exports.deletePost = factory.deleteOne(Post);
exports.createPost = factory.createOne(Post);
exports.getPostById = factory.getOne(Post);
