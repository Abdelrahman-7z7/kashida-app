const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
    name:{
        type: String,
        required: [true, 'the category must have a name'],
        unique: true,
        trim: true,
        minlength: [3, 'the category name must be at least 3 characters long'],
        maxlength: [20, 'the category name must be at most 50 characters long']
    },
    createdAt:{
        type: Date,
        default: Date.now
    }
})

const Category = mongoose.model('Category', categorySchema)

module.exports = Category