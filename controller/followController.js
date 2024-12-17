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
    const currentUser = req.user.id

    //1) fetch followers
    const followers = await Follow.find({following: targetedUser}).setOptions({ populateFollowersOnly: true });
    
    //2) collect all followers IDs
    const followersIds = followers.map(follower => follower.follower._id);

    //3) check if the current user is following any of these followers
    const followStatus = await Follow.find({follower: currentUser, following: {$in: followersIds}})

    // 4) create a map for follow status
    const followingsSet = new Set(followStatus.map(follow => follow.following._id.toString()))

    // 5) Map over followers and add follow status
    const followersWithStatus = followers.map(followerDoc =>({
        ...followerDoc.toObject(),
        isFollowing: followingsSet.has(followerDoc.follower._id.toString())
        
    }))
    

    //sending the response
    res.status(200).json({
        status:'success',
        data:{
            followersWithStatus
        }
    })
})

//get following of a user
exports.getFollowings = catchAsync(async (req, res, next)=> {
    const targetedUser = req.params.userId
    const currentUser = req.user.id

    //1) fetch the followings
    const followings = await Follow.find({follower: targetedUser}).setOptions({populateFollowingsOnly: true})
    
    //2) collect all the followingsIds
    const followingsIds = followings.map(following => following.following._id)

    //3) check if the logged in user is following any of these followings
    const followStatus = await Follow.find({follower: currentUser, following: {$in: followingsIds}})

    //4) create map of follow status
    const followingsSet = new Set(followStatus.map(follow => follow.following._id.toString()));

    //5) add follow status to each following
    const followingsWithStatus = followings.map(followingDoc => ({
        ...followingDoc.toObject(),
        isFollowing: followingsSet.has(followingDoc.following._id.toString())
    }))

    
    //sending the response
    res.status(200).json({
        status:'success',
        data:{
            followingsWithStatus
        }
    })
})


//get my followers
exports.getMyFollowers = catchAsync(async (req, res, next)=>{
    const currentUser = req.user.id
    
    //1) fetch my followers
    const followers = await Follow.find({following: currentUser}).setOptions({ populateFollowersOnly: true });
    
    //2) collect all followersIDs 
    const followersIds = followers.map(follower => follower.follower._id)

    //3) check if the current user is following any of these followers
    const followBackStatus = await Follow.find({follower: currentUser, following: {$in: followersIds}})

    //4) create a map of follow-back status 
    const followingBackSet = new Set(followBackStatus.map(follow => follow.following._id.toString())) 

    //5) add follow-back status to followers
    const followersWithStatus = followers.map(followerDoc => ({
        ...followerDoc.toObject(),
        isFollowing: followingBackSet.has(followerDoc.follower._id.toString())
    }))


    //sending the response
    res.status(200).json({
        status: 'success',
        data:{
            followersWithStatus
        }
    })
})


//get my followings
exports.getMyFollowings = catchAsync(async (req, res, next)=>{
    const currentUser = req.user.id
    
    const followings = await Follow.find({follower: currentUser}).setOptions({populateFollowingsOnly: true})
    
    // Add the isFollowing field as true to each following
    const followingsWithStatus = followings.map(follow => ({
        ...follow.toObject(),
        isFollowing: true, // Since the current user is following these users
    }));

    res.status(200).json({
        status: 'success',
        data:{
            followingsWithStatus
        }
    })
})


// const followersWithStatus = followings.map(follower => ({
//     ...follower.toObject(),
//     isFollowing: follower.checkIfFollowing(req.user.id)
// }))
// const followersWithStatus = followers.map(follower => ({
//     ...follower.toObject(),
//     isFollowing: follower.checkIfFollowing(req.user.id)
// }))