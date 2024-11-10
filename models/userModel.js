const mongoose = require('mongoose')
const validator = require('validator')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'A user must have a username'],
        unique: [true, 'A user must have a unique username'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'A user must have an email'],
        unique: [true, 'A user must have a unique email'],
        lowercase: true,
        trim: true,
        validate: [validator.isEmail]
    },
    password: {
        type: String,
        required: [true, 'A user must have a password'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'a password must match the confirm password'],
        validate: {
            validator: function(password){
                return this.password === password
            },
            message: 'passwords do not match'
        }
    },
    passwordChangedAt: {
        type: Date,
        default: Date.now()
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'student', 'teacher'],
        default: 'user'
    },
    active: {
        type: Boolean,
        default: true,
        select: false
    }
})

const User = mongoose.model('User', userSchema);
module.exports = User;