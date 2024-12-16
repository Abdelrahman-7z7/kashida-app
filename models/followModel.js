const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
    follower: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    following:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt:{
        type: Date,
        default: Date.now
    }
},{
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
})


//enhancing the schema search by adding indexes 
followSchema.index({follower: 1, following: 1}, {unique: true})

//populate the user info using query middleware
followSchema.pre(/^find/, function(next){
    this.populate({
        path: 'user',
        select: 'username photo'
    })
    next();
})

// //using document middleware to increase the # follow and following for both users
// followSchema.pre('save', function(next){
//     const doc = this;

//     //ensure this is a new doc
//     if(!doc.isNew){
//         return next()
//     }
// })

const Follow = mongoose.model('Follow', followSchema)

module.exports = Follow;
