//models
const Post = require('../models/postModel');
const {PostLikes} = require('../models/likedByModel');
const Category = require('../models/categoryModel')
const User = require('../models/userModel')

//utils for handling errors and loading
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError')

const mongoose = require('mongoose')
const imageProcess = require('../utils/imageUpload'); // Import the reusable function
const APIFeatures = require('../utils/apiFeatures')

// creating a filtered Object function to restrict and filter the body
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};

    Object.keys(obj).forEach(key => {
        if(allowedFields.includes(key)){
            newObj[key] = obj[key]
        }
    })

    return newObj;
}

//middleware for setting the user and tour id
exports.setUserId = (req, res, next) => {
    //from the protect middleware
    if(!req.body.user) req.body.user = req.user.id;
    next();
}

//middleware for checking the current user validation to delete or update another user's posts
exports.checkUser = catchAsync(async (req, res, next)=>{
    const post = await Post.findById(req.params.id);

    if(!post) return next(new AppError('No post found with that ID', 404));

    //for testing 
    // console.log('Post user:', post.user._id.toString());
    // console.log('Request user:', req.user.id);

    if(post.user._id.toString() !== req.user.id && req.user.role !== 'admin'){
        return next(new AppError('you do not have the permission for this action', 403));
    }

    req.post = post

    next();
})


//exports for sending a report over a post
exports.sendReport = factory.sendReport(Post)

// exports.getAllPost = factory.getAll(Post);
exports.getAllPost = catchAsync(async (req, res, next) => {
    const userId = req.user.id; // Assuming the user's ID is available on `req.user`

    // Step 1: Use APIFeatures for base query
    const features = new APIFeatures(Post.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .pagination();
        
        // Execute base query to get post IDs
        const posts = await features.query;

    //in case there is no post no need to perform the next operations
    if (!posts.length) {
        return res.status(200).json({
            status: 'success',
            results: 0,
            data: {
                posts: [],
            },
        });
    }

    // Step 2: Aggregate to check like status for each post using PostLikes
    const postIds = posts.map(post => post._id);
    
    const likes = await PostLikes.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),  // Match the current user ID
                postId: { $in: postIds },                   // Match posts the user has liked
            },
        },
        {
            $group: {
                _id: '$postId',        // Group by post ID
                hasLiked: { $first: true }, // Add hasLiked flag
            },
        },
    ]);
    
    const likeStatusMap = likes.reduce((acc, like) => {
        acc[like._id.toString()] = true; // Mark posts liked by the user
        return acc;
    }, {});
    
    // Step 3: Attach the like status to each post
    const postsWithLikes = posts.map(post => ({
        ...post.toObject(), // Convert Mongoose document to plain object
        hasLiked: likeStatusMap[post._id.toString()] || false, // Attach like status
    }));

    // Step 4: Send response
    res.status(200).json({
        status: 'success',
        results: postsWithLikes.length,
        data: {
            posts: postsWithLikes,
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


// exports.createPost = factory.createOne(Post);
exports.createPost = catchAsync(async (req, res, next)=> {
    //checking if the provided categories is valid 
    const category = await Category.exists({name: req.body.categories})
    
    if(!category){
        return next(new AppError('Invalid category', 404))
    }
    
    let uploadedImages = null;
    
    //check if the files are uploaded
    if(req.files || req.files.length > 0){
        // Upload the images using the reusable function
        uploadedImages = await imageProcess.uploadImagesToCloudinary(req.files);    
    }
    
    //create post with all fields
    const post = await Post.create({
        title: req.body.title,
        description: req.body.description,
        categories: req.body.categories,
        photos: uploadedImages,
        user: req.user.id
    })
    
    //send success response
    res.status(201).json({
        status:'success',
        data:{
            post
        }
    })
})

//updating post
exports.updatePost = catchAsync( async (req, res, next) => {
    const post = req.post

    //using the filterObj method to filter the req.body data
    const filteredBody = filterObj(req.body, 'title', 'description', 'categories')

    // //test
    console.log(filteredBody.title)

    if(filteredBody.categories){
        //check if the provided categories is valid 
        const category = await Category.exists({name: req.body.categories})
        
        if(!category){
            return next(new AppError('Invalid category', 404))
        }
    }
    
    //update the post
    post.set(filteredBody);

    //save the updated post
    await post.save();
    
    res.status(200).json({
        status:'success',
        data:{
            post
        }
    })
});

// exports.deletePost = factory.deleteOne(Post);
exports.deletePost = catchAsync(async (req, res, next) =>{
    const post = req.post

    if(post.photos.length){
        //use the imageProcess function to delete image from the cloudinary
        await imageProcess.deleteImagesFromCloudinary(post.photos);
    }
    
    //decreasing the number of posts in the post's user info
    await User.findByIdAndUpdate(post.user, { $inc: { posts: -1} });
    
    //delete the post 
    await Post.deleteOne({_id: post._id});

    res.status(204).json({
        status: 'success',
        message: 'Post and associated images were deleted successfully'
    })
})

//search controller for posts
exports.searchPost = catchAsync(async (req, res, next)=>{
    const {searchTerm} = req.params;

    //check for the search term
    if(!searchTerm){
        return next(new AppError('Please provide a search term to search posts for.', 400))
    }

    // Split the searchTerm into words
    const searchWords = searchTerm.split(/\s+/);

    // Build regex for each word to match in title, description, and categories
    const regexConditions = searchWords.map(word => ({
        $or: [
            { title: { $regex: word, $options: 'i' } },
            { description: { $regex: word, $options: 'i' } },
            { categories: { $regex: word, $options: 'i' } }
        ]
    }));

    //APIFeatures and preparing the query
    const features = new APIFeatures(Post.find({$or: regexConditions}), req.query)
        .filter()
        .sort()
        .limitFields()
        .pagination();

    //await for fetching the query
    const posts = await features.query;

    //send response
    res.status(200).json({
        status: 'success',
        results: posts.length,
        data: {
            posts
        }
    })

})
