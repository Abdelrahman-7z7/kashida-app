const mongoose = require('mongoose');
const User = require('../models/userModel')

//build the post schema
const postSchema = new mongoose.Schema({
    photos: {
        type: Array,
        // required: [true, "Post must have a picture"],
    },
    title: {
        type: String,
        required: [true, "Post must have a title"]
    },
    description: {
        type: String,
        required: [true, "Post must have a description"]
    },
    categories: {
        type: String,
        required: [true, "Post must at least select one categories"]
        // enum: {
        //     values: ['Naskh' , 'Thuluth', 'Diwani', 'Ruqa`ah', 'Kufic', 'Maghribi', 'Farsi', 'Ta`liq' , 'Shikasta', 'Suls', 'Hafs'],
        //     message: 'the categories can only be at least one of the main categories of Arabic calligraphy'
        // }
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
    updatedAt: {
        type: Date,
        default: Date.now()
    },
    likes: {
        type: Number,
        default: 0
    },
    comments:{
        type: Number, 
        default: 0
    },
    user:{
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'A post must belong to a user']
    }
    },{
        toJSON: {virtuals: true},
        toObject: {virtuals: true}
    })

//turned on when we implement the user model
// populate the user (Using a document middleware) pre save to be stored with the post
postSchema.pre(/^find/, function(next){
    this.populate({
        path: 'user',
        select: 'username photo'
    });
    next();
})

//Ensure that the user id is saved and handling user posts count
postSchema.pre('save', async function(next){
    const doc = this;

    // Ensure this is a new document
    if (!doc.isNew) return next();

    // Find the user by the ID in `doc.user`
    const user = await User.findById(doc.user);

    if (!user) {
        return next(new Error('User not found')); // Handle cases where the user is missing
    }

    // Increment the user's posts count
    user.set({ posts: user.posts + 1 });
    await user.save({ validateBeforeSave: false });
    
    next();
})

//handling the updating timestamps
postSchema.pre('findOneAndUpdate', async function(next){
    // Check if incrementLikes or decrementLikes is in the query or body
    const updateData = this._update;

    if (updateData?.$inc) {
        // Skip updating the updatedAt field if incrementLikes or decrementLikes is true
        return next();
    }

    // console.log('i am in 1')
    const docToUpdate = await this.model.findOne(this.getQuery())
    if(docToUpdate) this.set({updatedAt: new Date()})
    next();
})


//build the post schema
const Post = mongoose.model('Post', postSchema);
module.exports = Post;
