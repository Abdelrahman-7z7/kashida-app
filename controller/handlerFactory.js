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

