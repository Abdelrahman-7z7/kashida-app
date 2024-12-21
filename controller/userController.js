const User = require('../models/userModel')
const factory = require('./handlerFactory')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const APIFeatures = require('../utils/apiFeatures')
const imageProcess = require('../utils/imageUpload')

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


// Middleware: to catch the current user's information
// this middleware will be ran first before any of the next lines be run
exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
}

//current user update his/her data by
exports.updateMe = catchAsync( async (req, res, next) => {
    
    // 1) Create error if user POSTs(update) password data
    if(req.body.password || req.body.passwordConfirm){
        return next(new AppError('This route is not for password updates. Please use /updateMyPassword', 400))
    } else if(req.body.email){
        return next(new AppError('this route is not for email update. Please user /updateEmail', 400))
    }

    // 2) using the filterObj method to filter the req.body data
    const filteredBody = filterObj(req.body, 'name', 'username', 'bio', 'photo')

    // 3) Handle image deletion and upload
    if (req.files && req.files[0]?.fieldname === 'photo') {
        const user = await User.findById(req.user.id);
        if (user.photo) {
            await imageProcess.deleteImagesFromCloudinary(user.photo); // Delete existing photo
        }
        const uploadedImages = await imageProcess.uploadImagesToCloudinary(req.files);
        filteredBody.photo = uploadedImages[0]; // Assign the first URL
    }

    // 4) update the user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {new: true, runValidators: true})

    // 5) send the response
    res.status(200).json({
        status: 'success',
        message: 'User update successfully',
        data:{
            user: updatedUser
        }
    })
})

// delete current user's account
exports.deleteMe = catchAsync(async (req, res, next) => {
    //just setting the active to false
    await User.findByIdAndUpdate(req.user.id, {active: false})
    res.status(204).json({
        status: 'success',
        data: null
    })
})




exports.getAllUser = factory.getAll(User);
exports.getUserById = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

exports.createNewUser = (req, res) => {
    res.status(500).json({
        status: 'fail',
        message: 'Server Error - this route will never be defined. Please use /signup instead'
    })
};

//search for user by name or username
//ex: api/users/search/ah?page=1&limit=2 
//we can limit the search of the users by pa
exports.searchForUser = catchAsync(async (req, res, next)=>{
    //fetch the searchTerm parameter
    const {searchTerm} = req.params; // searchTerm == username or name 

    //check parameter availability
    if(!searchTerm){
        return next(new AppError('Please provide a username to search for.', 400))
    }

    //APIFeatures
    const features = new APIFeatures(User.find({
        $or: [
            {username: {$regex: `${searchTerm}`, $options: 'i'}}, //search in username (case insensitive)
            {name: {$regex: `${searchTerm}`, $options: 'i'}} //search in name (case insensitive)
        ]
    }), req.query)
    .filter()
    .sort()
    .limitFields()
    .pagination();

    const users = await features.query;

    //response with the found users and it can be empty determine that no user is found
    res.status(200).json({
        status: 'success',
        result: users.length,
        data:{
            users
        }
    })
})

