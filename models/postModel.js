const mongoose = require('mongoose');

//build the post schema

const postSchema = new mongoose.Schema({
    photos: {
        type: Array,
        required: [true, "Post must have a picture"],
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
        required: [true, "Post must at least select one categories"],
        enum: {
            values: ['Naskh' , 'Thuluth', 'Diwani', 'Ruqa`ah', 'Kufic', 'Maghribi', 'Farsi', 'Ta`liq' , 'Shikasta', 'Suls', 'Hafs'],
            message: 'the categories can only be at least one of the main categories of Arabic calligraphy'
        }
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
    likes: {
        type: Number,
        default: 0
    },
    user:{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
        //required: [true, 'a post must have a user']
    }
},{
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
})

//turned on when we implement the user model
// populate the user (Using a document middleware) pre save to be stored with the post
// postSchema.pre(/^find/, function(next){
//     this.populate({
//         path: 'user',
//         select: 'username photo'
//     });
//     next();
// } )


//build the post schema
const Post = mongoose.model('Post', postSchema);
module.exports = Post;
