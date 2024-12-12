const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError")
const statusCode = require("../utils/statusCode");
const { Model } = require("mongoose");
const User = require('../models/userModel')

exports.getAll = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.find();

    res.status(statusCode.SUCCESS).json({
        status: "success",
        result: doc.length,
        data: {
            data: doc
        }
    })
})

exports.getAll = (Model, likesModel) => catchAsync(async (req, res, next) => {
    const docs = await Model.find(); const userId = req.user.id; 
    if (likesModel) { 
        const docIds = docs.map(doc => doc._id);
        const likedEntities = await likesModel.find({ entityId: { $in: docIds }, userId });
        const likedMap = new Map();
        likedEntities.forEach(entity => likedMap.set(entity.entityId.toString(), true)); 
        // Ensure entityId is a string 
        docs.forEach(doc => { doc.liked = likedMap.get(doc._id.toString()) || false; // Ensure doc._id is a string 
        });
    } 
    
    res.status(statusCode.SUCCESS).json({
        status: "success",
        result: docs.length, 
        data: { 
            data: docs
        } 
    }); 
});

// exports.getAll = (Model, likesModel) => catchAsync(async (req, res, next) => {
//     // Step 1: Fetch all posts (documents)
//     const posts = await Model.find();

//     // Step 2: Fetch all likes for the current user in one query
//     const userId = req.user.id;  // Assuming the user ID is available
//     const userLikes = await likesModel.find({ userId });

//     // Step 3: Create a Set of liked postIds for the current user
//     const likedPostIds = new Set(userLikes.map(like => like.postId.toString()));  // Make sure the postId is in string format to avoid type mismatches

//     // Step 4: Add the 'liked' field to each post based on whether the user liked it or not
//     const postsWithLikes = posts.map(post => {
//         // Check if this post has been liked by the user
//         const liked = likedPostIds.has(post._id.toString()); // Convert postId to string to compare
//         return {
//             ...post.toObject(),
//             liked,  // Add the 'liked' field
//         };
//     });

//     // Step 5: Return the posts with the 'liked' field
//     res.status(statusCode.SUCCESS).json({
//         status: "success",
//         result: postsWithLikes.length,
//         data: {
//             data: postsWithLikes,
//         },
//     });
// });


//if the performance of the update method slowed down a lot take the like functionality out to a different functions (likeOne, unlikeOne)
exports.updateOne = Model => catchAsync( async (req, res, next)=> {
    //new: true ==> means that we want this method to return a new document 
    //takes the id of the doc and the modified fields from the body
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })

    if(!doc){
        next(new AppError('No document found with that Id', statusCode.NOT_FOUND))
    }

    res.status(statusCode.SUCCESS).json({
        status: "success",
        data: {
            data: doc
        }
    })
})

exports.deleteOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    
    if(!doc){
        next(new AppError('No document found with that Id', statusCode.NOT_FOUND))
    }

    res.status(statusCode.NO_CONTENT).json({
        status: "success",
        data: null
    })
})

exports.createOne = Model => catchAsync(async (req, res, next) => {
    // Ensure the user ID is passed to the post
    req.body.user = req.user.id;
    
    const doc = await Model.create(req.body);

    res.status(statusCode.CREATED).json({
        status: 'success',
        data: {
            data: doc
        }
    })
})

exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next)=> {
    let query = Model.findById(req.params.id);
    
    if(popOptions) query = query.populate(popOptions);
    
    const doc = await query;

    if(!doc){
        next(new AppError('No document found with that Id', statusCode.NOT_FOUND))
    }

    res.status(statusCode.SUCCESS).json({
        status: "success",
        data: {
            data: doc
        }
    })
})

