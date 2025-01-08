const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema({
    photo: {
        type: Array
    },
    comment: {
        type: String,
        required: [true, 'A comment must have a caption']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'A comment must belong to a user']
    },
    post: {
        type: mongoose.Schema.ObjectId, 
        ref: 'Post',
        required: [true, 'A comment must belong to a post']
    },
    createdAt: {
        type: Date,
        default: () => new Date().toISOString(), //ISO 8601 format in UTC
    },
    updatedAt:{
        type: Date,
        default: () => new Date().toISOString(), //ISO 8601 format in UTC
    },
    likes: {
        type: Number,
        default: 0
    },
    reply:{
        type: Number,
        default: 0
    }
})

// populate user using pre save middleware
commentSchema.pre(/^find/, function(next) {
    // this.updatedAt = Date.now();
    this.populate({
        path: 'user',
        select: 'username photo'
    })
    next();
})

//handling the updating timestamps
commentSchema.pre('findOneAndUpdate', async function(next){
    const docToUpdate = await this.model.findOne(this.getQuery())
    if(docToUpdate) this.set({updatedAt: new Date()})
    next();
})


const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;