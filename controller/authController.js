const AppError = require('../utils/appError')
const catchAsync = require('../utils/catchAsync')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const {promisify} = require('util')

//import model
const User = require('../models/userModel')

//signup jwt function
const signToken = id => {
    // 1) setting the payload === id
    // 2) setting the token with the secret_key
    // 3) setting the expiration date of the jwt
    return jwt.sign(
        {id},
        process.env.JWT_SECRET,
        process.env.JWT_EXPIRES_IN
    ) 
}

//create the token
const createSendToken = (user, statusCode, res) => {
    // 1) signToken to a variable
    const token = signToken(user._id)

    // 2) creating the cookies options
    const cookieOptions = {
        // 1) setting the expiry date of the cookie
        expires: new Date(
            //converting to milliseconds
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        // 2) prevent accessing to document.cookie to reduce the risk of XXS (Cross-site-scripting) 
        httpOnly: true,
        // 3) in production mode, set secure option to true, ensure that the cookie can only be sent over HTTPS
        secure: process.env.NODE_ENV.trim() === 'production'? true: false
    }

    // 4) sending the cookie along with the token
    res.cookie('jwt', token, cookieOptions);

    // 5) set the password to undefined to the response only
    user.password = undefined;

    // 6) send the response with the user and status code
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    })
    
}

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm
    })

    // create a token and send it back to the client
    createSendToken(newUser, 201, res)
})


exports.login = catchAsync(async (req, res, next) => {
    const {email, password} = req.body;

    // 1) check if password and email exists
    if(!email || !password){
        return next(new AppError('Provide a valid email and password!!', 400))
    }

    // 2) check if the user exists and sent the password select property to true
    const user = await User.findOne({email}).select('+password')

    // 3) check if the user password and the candidate password is correct
    // ## create correct password in the schema as an instance method for validating the password
    if(!user || !(await user.correctPassword(password, user.password))){
        return next(new AppError('Incorrect email or password!!', 401))
    }
    
    // 4) if everything is ok create and send the token to the client
    const token = signToken(user._id)

    res.status(200).json({
        status: 'success',
        token
    })
    createSendToken(user, 200, res);
})


//Middleware function for protecting other route from being exposed when the jwt is not found
exports.protect = catchAsync(async (req, res, next) => {
    // 1) getting token 
    let token;

    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        // the token stored like that authorization: 'Bearer kl41rgw5545er48'
        token = req.headers.authorization.split(' ')[1];
    }

    // 2) checking if it is there
    if(!token){
        return next(new AppError('You are not logged in. Please Login...'))
    }

    // 3) verifying the token
    
    //we don't want to break the concept of promises so we will use promisify from util library
    // promisify() making the function and then () called it to be run
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)

    // 4) using payload to find the user
    const currentUser = await User.findById(decoded.id)

    // 5) checking if the user exists
    if(!currentUser){
        return next(new AppError('The user belonging to this token does no longer exists', 401))
    }

    // 6) implementing instance method in the user model for validating if the user changed the password before or not
    if(currentUser.changedPasswordAfter(decoded.iat)){
        return next(new AppError('User recently changed password! Please Login again...', 401))
    }

    // 7) grant access to protected route - sending the user in the req.user to other route
    req.user = currentUser;
    next();
})
