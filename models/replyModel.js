const mongoose = require('mongoose')

const replySchema = new mongoose.Schema({
    reply: {
        type: String,
        required: [true, 'a replay can not be empty']
    },
    likes: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        // required: [true, 'A reply must belong to user']
    },
    comment: {
        type: mongoose.Schema.ObjectId,
        ref: 'Comment',
        required: [true, 'A reply must belong to a comment']
    },
    likes: {
        type: Number,
        default: 0
    }
})

const Reply = mongoose.model('Reply', replySchema);
module.exports = Reply;