const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError")
const statusCode = require("../utils/statusCode");
const { Model } = require("mongoose");

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

//if the performance of the update method slowed down a lot take the like functionality out to a different functions (likeOne, unlikeOne)
exports.updateOne = (Model, action) => catchAsync( async (req, res, next)=> {
    let updatedData = req.body;

    if (action === 'increment') {
        // Increment like
        updatedData = {}
        updatedData.$inc = { likes: 1 };
        req.body = {}
    } else if (action === 'decrement') {
        updatedData = {}
        // Decrement like
        updatedData.$inc = { likes: -1 };
        req.body = {}
    }else if(action != 'increment' && action != 'decrement' && action != null){
        return next(new AppError('Invalid action for likes modification', statusCode.BAD_REQUEST));
    }

    //new: true ==> means that we want this method to return a new document 
    //takes the id of the doc and the modified fields from the body
    const doc = await Model.findByIdAndUpdate(req.params.id, updatedData, {
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

exports.likeOne = Model => catchAsync( async (req, res, next)=> {

    let updatedData = {}
    updatedData.$inc = { likes: 1 };
    req.body = {}

    //new: true ==> means that we want this method to return a new document 
    //takes the id of the doc and the modified fields from the body
    const doc = await Model.findByIdAndUpdate(req.params.id, updatedData, {
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


exports.unlikeOne = Model => catchAsync( async (req, res, next)=> {

    let updatedData = {}
    
    updatedData.$inc = { likes: -1 };
    req.body = {}

    //new: true ==> means that we want this method to return a new document 
    //takes the id of the doc and the modified fields from the body
    const doc = await Model.findByIdAndUpdate(req.params.id, updatedData, {
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

// exports.likeOne = Model => catchAsync(async (req, res, next) => {
//     const doc = Model.findByIdAndUpdate(req.params.id, )

//     if(!doc){
//         next(new AppError('No document found with that Id', statusCode.NOT_FOUND))
//     }

//     res.status(statusCode.SUCCESS).json({
//         status: "success",
//         data: {
//             data: doc
//         }
//     })
// })

