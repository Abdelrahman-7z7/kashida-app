const AppError = require('../utils/appError')
const factory = require('./handlerFactory')
const Category = require('../models/categoryModel')
const catchAsync = require('../utils/catchAsync')
const imageProcess = require('../utils/imageUpload')

exports.getAllCategories = factory.getAll(Category)


exports.createCategory = catchAsync(async (req, res, next)=>{
    //1) check if files are uploaded
    if(!req.files || Object.keys(req.files).length === 0) {
        return next(new AppError('No files were uploaded.', 400))
    }
    
    //initialize variables for the uploaded images URLs
    let followedImg = null
    let unfollowedImg = null
    let logo = null
    
    console.log(req.files)
    
    //upload the images if they exists
    if(req.files.followedImg){
        followedImg = await imageProcess.uploadImagesToCloudinary(req.files.followedImg)
    }
    
    if(req.files.unfollowedImg){
        unfollowedImg = await imageProcess.uploadImagesToCloudinary(req.files.unfollowedImg)
    }
    
    if(req.files.logo){
        logo = await imageProcess.uploadImagesToCloudinary(req.files.logo)
    }
    
    const category = await Category.create({
        name: req.body.name,
        followedImg: followedImg,
        unfollowedImg: unfollowedImg,
        logo: logo
    })
    
    //sending response
    res.status(201).json({
        status:'success',
        data: {
            category
        }
    })
})


exports.deleteCategory = catchAsync(async (req, res, next)=>{
    const category = await Category.findById(req.params.id)
    
    if(!category) return next(new AppError('no category found with that id', 404));
    
    if(category.followedImg?.length){
        await imageProcess.deleteImagesFromCloudinary(category.followedImg)
    }
    
    if(category.unfollowedImg?.length){
        await imageProcess.deleteImagesFromCloudinary(category.unfollowedImg)
    }
    
    if(category.logo?.length){
        await imageProcess.deleteImagesFromCloudinary(category.logo)
    }

    await category.deleteOne()
    
    res.status(204).json({
        status:'success',
        data: null
    })
})

// exports.updateCategory = factory.updateOne(Category)
exports.updateCategory = catchAsync(async (req, res, next)=>{
    const category = await Category.findById(req.params.id)
    
    if(!category) return next(new AppError('no category found with that id', 404));

    if(req.files.followedImg){
        await imageProcess.deleteImagesFromCloudinary(category.followedImg)
        category.followedImg = await imageProcess.uploadImagesToCloudinary(req.files.followedImg)
    }
    
    if(req.files.unfollowedImg){
        await imageProcess.deleteImagesFromCloudinary(category.unfollowedImg)
        category.unfollowedImg = await imageProcess.uploadImagesToCloudinary(req.files.unfollowedImg)
    }
    
    if(req.files.logo){
        await imageProcess.deleteImagesFromCloudinary(category.logo)
        category.logo = await imageProcess.uploadImagesToCloudinary(req.files.logo)
    }
    
    category.set({
        name: req.body.name || category.name,
        logo: category.logo,
        followedImg: category.followedImg,
        unfollowedImg: category.unfollowedImg     
    })

    await category.save()
    
    res.status(200).json({
        status:'success',
        data: {
            category
        }
    })
})