const Follow = require('../models/followModel')
const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')

// follow user
exports.follow = catchAsync(async (req, res, next) => {
    //getting the ids of both users
    const currentUser = req.user.id;
    const targetedUser = req.params.userId;

    //checking if the current user trying to follow themselves
    if(currentUser === targetedUser){
        return next(new AppError('You cannot follow yourself', 400))
    }

    //check if the follow relationship already exists
    const existingFollow = await Follow.findOne({
        follower: currentUser,
        following: targetedUser
    })

    //if exists
    if(existingFollow){
        return next(new AppError('You have already followed this user', 400))
    }

    //create a new relationship
    const follow = await Follow.create({
        follower: currentUser,
        following: targetedUser
    })

    //increasing the currentUser's followings count and the targetedUser's followers count
    await User.findByIdAndUpdate(currentUser, { $inc: { following: 1 } });
    await User.findByIdAndUpdate(targetedUser, { $inc: { followers: 1 } });

    //send the response
    res.status(201).json({
        status:'success',
        data:{
            follow
        }
    })
})

//unfollow user
exports.unfollow = catchAsync(async (req, res, next) => {
    //getting both of the users IDs
    const currentUser = req.user.id;
    const targetedUser = req.params.userId;

    const follow = await Follow.findOneAndDelete({
        follower: currentUser,
        following: targetedUser
    })

    //if the follow relationship does not exist
    if(!follow){
        return next(new AppError('You are not following this user', 404))
    }

    //decreasing the currentUser's followings count and the targetedUser's followers count
    await User.findByIdAndUpdate(currentUser, { $inc: { following: -1 } });
    await User.findByIdAndUpdate(targetedUser, { $inc: { followers: -1 } });
    
    //sending response
    res.status(204).json({
        status: 'success',
        data: null
    })
})

//get followers of a user
exports.getFollowers = catchAsync(async (req, res, next)=> {
    const targetedUser = req.params.userId

    const followers = await Follow.find({following: targetedUser}).setOptions({ populateFollowersOnly: true });

    //sending the response
    res.status(200).json({
        status:'success',
        data:{
            followers
        }
    })
})

//get following of a user
exports.getFollowings = catchAsync(async (req, res, next)=> {
    const targetedUser = req.params.userId

    const followings = await Follow.find({follower: targetedUser}).setOptions({populateFollowingsOnly: true})

    //sending the response
    res.status(200).json({
        status:'success',
        data:{
            followings
        }
    })
})


//get my followers
exports.getMyFollowers = catchAsync(async (req, res, next)=>{
    const currentUser = req.user.id

    const followers = await Follow.find({following: currentUser}).setOptions({ populateFollowersOnly: true });
    
    //sending the response
    res.status(200).json({
        status: 'success',
        data:{
            followers
        }
    })
})


//get my followings
exports.getMyFollowings = catchAsync(async (req, res, next)=>{
    const currentUser = req.user.id

    const followings = await Follow.find({follower: currentUser}).setOptions({populateFollowingsOnly: true})

    res.status(200).json({
        status: 'success',
        data:{
            followings
        }
    })
})