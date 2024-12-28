//models
const Comment = require('../models/commentModel')
const Post = require('../models/postModel')
const {CommentLikes} = require('../models/likedByModel')

//error and asynchronization handler
const factory = require('./handlerFactory')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')

//utils
const mongoose = require('mongoose')
const imageProcess = require('../utils/imageUpload'); // Import the reusable function
const APIFeatures = require('../utils/apiFeatures')


//middleware for checking the current user validation to delete or update another user's posts
exports.checkUser = catchAsync(async (req, res, next)=>{
    const comment = await Comment.findById(req.params.id);

    if(!comment) return next(new AppError('No comment found with that ID', 400));

    if(comment.user._id.toString() !== req.user.id && req.user.role !== 'admin'){
        return next(new AppError('you do not have the permission for this action', 403));
    }

    req.comment = comment

    next();
})


exports.updateComment = factory.updateOne(Comment);

exports.deleteComment = catchAsync(async (req, res, next) =>{
    const comment = req.comment

    if(!comment){
        return next(new AppError('No comment found with that id', 404))
    }

    if(comment.photo.length){
        //use the imageProcess function to delete image from the cloudinary
        await imageProcess.deleteImagesFromCloudinary(comment.photo);
    }

    //updating the number of comments on a post
    await Post.findByIdAndUpdate(comment.post._id.toString(), { $inc: { comments: -1 } });

    //delete the post 
    await Comment.deleteOne({_id: comment._id});

    res.status(204).json({
        status: 'success',
        message: 'Comment and associated image were deleted successfully'
    })
});

exports.createComment = catchAsync(async (req, res, next) => {
    const postId = req.params.postId
    const userId = req.user.id  

    let uploadedImage;

    //check if the files are uploaded
    if(req.files || req.files.length > 0){
        // Upload the images using the reusable function
        uploadedImage = await imageProcess.uploadImagesToCloudinary(req.files); 
    }
    

    //updating the number of comments on a post
    await Post.findByIdAndUpdate(postId, { $inc: { comments: 1 } });

    const comment = await Comment.create({
        user: userId,
        post: postId,
        comment: req.body.comment,
        photo: uploadedImage
    })

    //send response 
    res.status(201).json({
        status: 'success',
        data:{
            comment
        }
    })
});


exports.getAllComments = catchAsync(async (req, res, next) => {
    const postId = req.params.postId; // Get the postId from the route params
    const currentUser = req.user.id; // Get the current user's ID from the request

    // 1) Fetch comments for the specific post
    const features = new APIFeatures(Comment.find({post: postId}), req.query).filter().pagination()
    // const comments = await Comment.find({ post: postId });
    const comments = await features.query;

    // 2) Collect all unique comment IDs
    const commentIds = comments.map(comment => comment._id.toString());

    console.log(commentIds)

    // 3) Check if the current user has liked any of these comments
    const userLikes = await CommentLikes.find({
        userId: currentUser,
        commentId: { $in: commentIds }, // Use commentId instead of _id
    });

    console.log(userLikes)
    
    // 4) Create a set of liked comment IDs for quick lookup
    const likedCommentsSet = new Set(userLikes.map(like => like.commentId.toString()));

    console.log(likedCommentsSet)

    // 5) Add `hasLiked` field to each comment
    const commentsWithLikeStatus = comments.map(comment => ({
        ...comment.toObject(),
        hasLiked: likedCommentsSet.has(comment._id.toString()), // Check if the comment is liked by the user
    }));

    // Send the response
    res.status(200).json({
        status: 'success',
        results: commentsWithLikeStatus.length,
        data: {
            comments: commentsWithLikeStatus,
        },
    });
});


// exports.getAllComments = catchAsync(async (req, res, next) => {
//     const postId = req.params.postId; // Get the postId from the route params
//     const userId = req.user.id; // Get the current user's ID from the request

//     const comments = await Comment.aggregate([
//         // Step 1: Match comments for the specific post
//         {
//             $match: { post: new mongoose.Types.ObjectId(postId) },
//         },
//         // Step 2: Lookup user details
//         {
//             $lookup: {
//                 from: "users", // Name of the User collection
//                 localField: "user",
//                 foreignField: "_id",
//                 as: "user",
//             },
//         },
//         {
//             $unwind: "$user", // Unwind the user array (since it's a one-to-one relationship)
//         },
//         // Step 3: Lookup likes for each comment
//         {
//             $lookup: {
//                 from: "commentlikes", // Name of the CommentLikes collection
//                 let: { commentId: "$_id" }, // Reference to the current comment's `_id`
//                 pipeline: [
//                     {
//                         $match: {
//                             $expr: {
//                                 $and: [
//                                     { $eq: ["$commentId", "$$commentId"] }, // Match the commentId
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
//         // Step 4: Add the hasLiked field
//         {
//             $addFields: {
//                 hasLiked: { $gt: [{ $size: "$userLike" }, 0] }, // True if userLike array is not empty
//             },
//         },
//         // Step 5: Remove unnecessary fields
//         {
//             $project: {
//                 userLike: 0, // Exclude the temporary userLike array
//                 "user.password": 0, // Optionally exclude sensitive user fields
//             },
//         },
//     ]);


//     // Send the response
//     res.status(200).json({
//         status: 'success',
//         results: comments.length,
//         data: {
//             comments,
//         },
//     });
// });


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


