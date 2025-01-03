const AppError = require('../utils/appError')
const catchAsync = require('../utils/catchAsync')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const {promisify} = require('util')
const Email = require('../utils/email')
const validator = require('validator')

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
        {expiresIn: process.env.JWT_EXPIRES_IN}
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
        // secure: process.env.NODE_ENV.trim() === 'production'? true: false
        secure: process.env.NODE_ENV === 'production'
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

    // Send a welcome email
    //TODO: try to figure out the real welcome page or the actual application url 
    const url = `${req.protocol}://${req.get('host')}/welcome`; // Or the actual welcome URL
    await new Email(newUser, url).sendWelcome();

    //testing the NODE_ENV
    // console.log(process.env.NODE_ENV === 'production')
    // console.log(process.env.NODE_ENV)

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

//Middleware for restricting some operation based on the role
exports.restrictTo = (...roles) => {
    return (req, res, next) =>{
        //roles: ['admin', 'user, 'teacher', 'student']
        if(!roles.includes(req.user.role)){
            return next(new AppError('You do not have permission to perform this action', 403))
        }
        next();
    }
}

//resetting password by sending a request to sendEmail message that contains a random token NOT a jsonWebToken
exports.forgotPassword = catchAsync(async (req, res, next) => {

    // 1) get user passed on the POSTed email
    const user = await User.findOne({email: req.body.email}).select('+password')
    
    // 2) verify if the user does exist
    if(!user){
        return next(new AppError('No user were found!!', 404))
    }
    
    // 3) generate random reset token => by using instance method in the user model
    const resetToken = user.createPasswordResetToken();
    
    // 4) saving the user and giving the option: {validateBeforeSave: false}
    await user.save({validateBeforeSave: false})
    
    // 5) generate the resetURL
    const resetURL = `${req.protocol}://${req.get('host')}/api/k1/users/resetPassword/${resetToken}`;

    // 6) open try/catch block
    try{
        // 7) generate the sendEmail function in the util package
        // 8) await for the email to sent
        const resetURL = `${req.protocol}://${req.get('host')}/api/k1/users/resetPassword/${resetToken}`;
        await new Email(user, resetURL).sendPasswordReset();


        // 9) generate the response 
        res.status(200).json({
            status: 'success',
            message: 'Token Sent to email'
        })

    } catch (err) {
        // 10) in the catch block => set the passwordResetToken to undefined
        user.passwordResetToken = undefined;

        // 11) set the passwordResetExpires to undefined
        user.passwordResetExpires = undefined;

        // 12) await for the save with setting the validateBeforeSave: false option
        await user.save({validateBeforeSave: false})
        
        // 13) returning the error
        return next(new AppError('There was an error sending the email. Please try again later!!', 500))
    }
})


// resetting password
exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1) get the token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
    
    // 2) get the user by the token
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: {$gt: Date.now()}
    })

    // 3) check if the user exists
    if(!user){
        return next(new AppError('Token is invalid or has expired', 400))
    }
    
    // 4) get the user password and password confirm
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    
    // 5) set the passwordResetToken & passwordResetExpires to undefined
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // 6) save user
    await user.save()

    // 7) create the token
    createSendToken(user, 200, res)
})

// updating the logged in user's password without needing to forgot it in the first place
exports.updatePassword = catchAsync(async (req, res, next)=> {
    // 1) getting the current user => using the req.user coming from the protected route
    const user = await User.findById(req.user.id).select('+password')

    // 2) Check if the POSTed current password is correct
    if(!(await user.correctPassword(req.body.passwordCurrent, user.password))){
        return next(new AppError('Incorrect current password', 401))
    }
    
    // 3) if so update the user
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;

    // 4) save the changes
    await user.save()

    // 5) create and send the token => log user in and sent JWT 
    createSendToken(user, 200, res)
})

//for updating the email since it is a sensitive data where the hacker can change it and reach to the forgotPassword method
exports.updateEmail = catchAsync(async (req, res, next) => {

    // 1) getting the current user => using the req.user coming from the protected route
    const user = await User.findById(req.user.id).select('+password')

    // 2) check if the current password POSTed in the request is correct
    if(!(await user.correctPassword(req.body.passwordCurrent, user.password))){
        return next(new AppError('Incorrect current password', 401))
    }

    // 3) update the user's email
    user.email = req.body.email;
    
    // 4) validate the email before sending since we want to escape passwordConfirm by the validateBeforeSave: false
    if (!/^\S+@\S+\.\S+$/.test(user.email)) {
        return next(new AppError('Please provide a valid email address', 400));
    }

    // 5) save the changes
    await user.save({validateBeforeSave: false});

    // 6) create and send the token => log user in and sent JWT
    createSendToken(user, 200, res);
})

//verifying email
exports.verifyEmail = catchAsync(async (req, res, next) => {
    // 1) fetch the user data
    // 2) check the user Id
    // 3) throw an error if !user
    // 4) get the email address 
    // 5) send an email message with the token involved
    // 6) check if the token is valid and not expired
    // 7) if so then we update the email address and set the token and the expiration to undefined
    // 8) save the user and send the response
})