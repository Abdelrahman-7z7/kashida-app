const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'A user must have a username'],
        unique: [true, 'A user must have a unique username'],
        trim: true,
        validate: {
            validator: function(username) {
                return /^[a-z0-9._-]+$/.test(username);  // Only lowercase letters, numbers, ., _, and -
            },
            message: 'Username can only contain lowercase letters, numbers, underscores (_), hyphens (-), or dots (.) without spaces'
        }
    },
    email: {
        type: String,
        required: [true, 'A user must have an email'],
        unique: [true, 'A user must have a unique email'],
        lowercase: true,
        trim: true,
        validate: [validator.isEmail, 'Please provide a valid email...']
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
    passwordResetToken: String,
    passwordResetExpires: Date,
    name: {
        type: String
    },
    photo: {
        type: Array
    },
    bio: {
        type: String,
        default: ""
    },
    role: {
        type: String,
        enum: ['admin', 'student', 'teacher'],
        default: 'student'
    },
    active: {
        type: Boolean,
        default: true,
        select: false
    },
    createdAt: {
        type: Date,
        default: () => new Date().toISOString(), //ISO 8601 format in UTC
    },
    followers: {
        type: Number,
        default: 0
    },
    following: {
        type: Number,
        default: 0
    },
    posts:{
        type: Number,
        default: 0
    },
    birthday:{
        type: Date,
        validate: {
            validator: function(birthday){
                //Ensure the date is valid
                const isValid = !isNaN(new Date(birthday).getTime())

                //Ensure the date is not in the future
                const isNotInFuture = new Date(birthday) <= Date.now()

                //ensure it is a valid date and not in the future
                return isValid && isNotInFuture
            },
            message: "Please provide a valid birthday in the format of YYYY-MM-DD and ensure it is not in the future"
        },
        required: false,
    },
    phoneNumber:{
        type: String,
        validate: {
            validator: function(phone){
                return /^\+[1-9]\d{1,14}$/.test(phone);
            },
            message: 'Please provide a valid phone number'
        },
        required: false
    },
    isEmailVerified:{
        type: Boolean,
        default: false
    },
    emailVerificationCode: String,
    emailVerificationExpires: Date,
    pendingEmail: String,
    joinedSpaces:{
        type: [
            {
                name: {type: String, required: true}
            }
        ],
        default: []
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

//Middleware: setting the default for name
userSchema.pre('save', function(next){
    if(!this.name){
        this.name = this.username
    }
    next();
})

//Middleware: eliminating the inactive users from being listed out in the get all users
userSchema.pre(/^find/, function(next){
    this.find({active: {$ne: false}})
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

// instance method => generate random reset token
userSchema.methods.createPasswordResetToken = function(){
    // 1) generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // 2) using sha256 algorithm for hashing to be stored securely in the database
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // 3) setting the expiry date after 5 minutes
    this.passwordResetExpires = Date.now() + 5 * 60 * 1000;

    // 4) testing if the resetToken stored as a hashed token
    console.log({resetToken}, this.passwordResetToken);

    // 5) return the resetToken
    return resetToken;
}

const User = mongoose.model('User', userSchema);
module.exports = User;