const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')

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
    name: {
        type: String,
        default: ""
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

// middleware: hashing password before saving
userSchema.pre('save', async function(next){
    //only run this function if the password was actually modified
    if(!this.isModified('password')) return next();
    
    //hash the password with cost 12 (CPU intensive) and replace the plain text password with the hashed one
    this.password = await bcrypt.hash(this.password, 12)

    // deleting the passwordConfirm, only need it for the validation above
    this.passwordConfirm = undefined;
    next();
})

// instance method => validating the Password
userSchema.methods.correctPassword = async function(candidatePassword, userPassword){
    //since we selected the password fields to false, we cannot user "this.password", so we need to pass it as a parameter
    return await bcrypt.compare(candidatePassword, userPassword); 
}

// instance method => checking if the password changed after creating the jwt
userSchema.methods.changedPasswordAfter = function(JWTTimestamp){
    if(this.passwordChangedAt){
        //converting to milliseconds
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        //checking the both
        // console.log(changedTimestamp, JWTTimestamp)

        return JWTTimestamp < changedTimestamp;
    }

    //false => DID NOT CHANGE
    return false;
}

const User = mongoose.model('User', userSchema);
module.exports = User;