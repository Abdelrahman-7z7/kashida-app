const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError")
const statusCode = require("../utils/statusCode");
const { Model } = require("mongoose");
const User = require('../models/userModel');
const APIFeatures = require("../utils/apiFeatures");

exports.getAll = (Model, popOptions) => catchAsync(async (req, res, next) => {
    
    let filter = {}
    //allowing for nested routes
    if(req.params.postId) filter = {post: req.params.postId }

     // Check if there are any query parameters to filter by
     if (Object.keys(req.query).length > 0) {
        const features = new APIFeatures(Model.find(filter), req.query)
            .filter()
            .sort()
            .limitFields()
            .pagination();

        // Only apply population if required
        if (popOptions) {
            features.query = features.query.populate(popOptions);
        }

        const doc = await features.query;

        return res.status(statusCode.SUCCESS).json({
            status: "success",
            result: doc.length,
            data: {
                data: doc,
            },
        });
    } else {
        // If no query params, just return the basic filtered data
        const doc = await Model.find(filter);
        return res.status(statusCode.SUCCESS).json({
            status: "success",
            result: doc.length,
            data: {
                data: doc,
            },
        });
    }
})
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

