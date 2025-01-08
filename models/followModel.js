const mongoose = require('mongoose');
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')

const followSchema = new mongoose.Schema({
    follower: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    following:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: () => new Date().toISOString(), //ISO 8601 format in UTC
    }
},{
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
})


//enhancing the schema search by adding indexes 
followSchema.index({follower: 1, following: 1}, {unique: true})
followSchema.index({follower:1})
followSchema.index({following: 1})

//populate the user info using query middleware
followSchema.pre(/^find/, function(next){
    if(this.options.populateFollowersOnly === true){
        this.populate({
            path: 'follower',
            select: 'username photo'
        })
    }else if(this.options.populateFollowingsOnly === true){
        this.populate({
            path: 'following',
            select: 'username photo'
        })
    }else{
        this.populate({
            path: 'follower',
            select: 'username photo'
        }).populate({
            path: 'following',
            select: 'username photo'
        })
    }
    next();
})

const Follow = mongoose.model('Follow', followSchema)

module.exports = Follow;
