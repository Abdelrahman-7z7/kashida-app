const AppError = require('../utils/appError')
const catchAsync = require('../utils/catchAsync')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const {promisify} = require('util')
const Email = require('../utils/email')
const validator = require('validator')
const bcrypt = require('bcryptjs')

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

// //resetting password by sending a request to sendEmail message contains verification code
// // works as well for "resending verification code"
// exports.forgotPassword = catchAsync(async (req, res, next) => {

//     // 1) get user passed on the POSTed email
//     const user = await User.findOne({email: req.body.email})
    
//     // 2) verify if the user does exist
//     if(!user){
//         return next(new AppError('No user were found!!', 404))
//     }
    
//     // 3) generate verification token
//     const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
//     const verificationCodeExpires = Date.now() + 60 * 1000; // 1 minute

//     // 3) Hash the verification code
//     const hashedCode = await bcrypt.hash(verificationCode, 12);

//     // 4) Store the code and expiration in the database
//     user.VerificationCode = hashedCode;
//     user.VerificationExpiresAt = verificationCodeExpires;
//     await user.save({ validateBeforeSave: false });
    
//     try{
//         // 5) Send the verification code via email
//         await new Email(user).sendVerificationCode(verificationCode);

//         // 6) Respond to the client
//         res.status(200).json({
//             status: 'success',
//             message: 'Verification code sent to your email.',
//         });

//     } catch (err) {
//         // 10) in the catch block => set the passwordResetToken to undefined
//         user.VerificationCode = undefined;

//         // 11) set the passwordResetExpires to undefined
//         user.VerificationExpiresAt = undefined;

//         // 12) await for the save with setting the validateBeforeSave: false option
//         await user.save({validateBeforeSave: false})
        
//         // 13) returning the error
//         return next(new AppError('There was an error sending the email. Please try again later!!', 500))
//     }
// })

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError('No user found with this email.', 404));
    }

    // 2) Generate verification token
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpires = Date.now() + 60 * 1000; // 1 minute
    console.log('Generated verification code:', verificationCode);

    // 3) Hash the verification code
    const hashedCode = await bcrypt.hash(verificationCode, 12);
    console.log('Hashed verification code:', hashedCode);

    // 4) Save the code and expiration to the user
    user.VerificationCode = hashedCode;
    user.VerificationExpiresAt = verificationCodeExpires;
    await user.save({ validateBeforeSave: false });

    // 5) Send the email
    try {
        console.log('Attempting to send verification email...');
        await new Email(user).sendResetPasswordCode(verificationCode);
        console.log('Verification email sent successfully.');

        res.status(200).json({
            status: 'success',
            message: 'Verification code sent to your email.',
        });
    } catch (err) {
        console.error('Error sending verification email:', err);

        user.VerificationCode = undefined;
        user.VerificationExpiresAt = undefined;
        await user.save({ validateBeforeSave: false });

        return next(
            new AppError('There was an error sending the email. Please try again later.', 500)
        );
    }
});


//verify password reset code
exports.verifyPasswordResetCode = catchAsync(async (req, res, next)=>{
    const {email, verificationCode} = req.body

    //verify the user exists
    const user = await User.findOne({email})
    if(!user){
        return next(new AppError('No user found with this email address', 404))
    }

    //check if the code is valid
    const isValidCode = await bcrypt.compare(verificationCode, user.VerificationCode);

    if(!isValidCode || user.VerificationExpiresAt < Date.now()){
        return next(new AppError('Invalid or expired verification code', 400))
    }

    user.VerificationCode = undefined;
    user.VerificationExpiresAt = undefined;
    user.isValidCode = true;

    await user.save({validateBeforeSave: false});

    res.status(200).json({
        status: 'success',
        message: 'Verification code is valid. You may now reset your password.',
    });
})

// resetting password
exports.resetPassword = catchAsync(async (req, res, next) => {
    const {email, password, passwordConfirm} = req.body;

    // 1) verify if the user exists
    const user = await User.findOne({email})
    if(!user){
        return next(new AppError('No user found with this email address', 404))
    }
    if(user.isValidCode === false){
        return next(new AppError('Verification code is not been confirmed', 400))
    }

    //update the password
    user.password = password;
    user.passwordConfirm = passwordConfirm;
    user.isValidCode = false;

    await user.save();

    res.status(200).json({
        status: 'success',
        message: 'the password was updated successfully',
    });
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

//verifying the email comes in two stages:
// 1) requesting the verification code
// 2) verify the code that has been entered

// //update email for the current user
// exports.updateEmail = catchAsync(async (req, res, next)=>{
//     const user = req.user
//     const {newEmail, passwordCurrent} = req.body;

//     //1) check if the current password is correct
//     if(!(await user.correctPassword(passwordCurrent, user.password))){
//         return next(new AppError('Incorrect current password', 401))
//     }

//     //2) validate the new email format
//     if(!/^\S+@\S+\.\S+$/.test(newEmail)){
//         return next(new AppError('Please provide a valid email address', 400))
//     }

//     //3) check if the new email is already in use
//     const existingUser = await User.findOne({email: newEmail})

//     if(existingUser){
//         return next(new AppError('Email address already exists', 400))
//     }

//     //4) Generate a verification code and expiration time
//     const verificationCode = Math.floor(10000 + Math.random() * 90000).toString();
//     const emailVerificationExpires = Date.now() + 60 * 1000; // 1 min

//     //5) hash the verification code
//     const hashedCode = await bcrypt.hash(verificationCode, 12);

//     //6) temporarily store the new email and verification details
//     user.pendingEmail = newEmail;
//     user.emailVerificationCode = hashedCode;
//     user.emailVerificationExpires = emailVerificationExpires;

//     await user.save({validateBeforeSave: false})

//     //7) send the verification email
//     await new Email(user).sendEmailVerification(verificationCode)

//     //8) send the response
//     res.status(200).json({
//         status: 'success',
//         message: 'A verification code has been sent to your new email.'
//     })
// })

// //verify update email
// exports.verifyUpdatedEmail = catchAsync(async (req, res, next)=>{
//     const user = req.user
//     const {verificationCode} = req.body

//     //1) check if there's pending email update
//     if(!user.pendingEmail){
//         return next(new AppError('No email update request found.', 400));
//     }

//     //2) verify the hashed code
//     const isValidCode = await bcrypt.compare(verificationCode, user.emailVerificationCode)

//     if(!isValidCode){
//         return next(new AppError('Incorrect verification code', 400))
//     }

//     //3) check if the code has expired
//     if(user.emailVerificationExpires < Date.now()){
//         return next(new AppError('Verification code has expired', 400))
//     }

//     //4) finalize the email update
//     user.email = user.pendingEmail
//     user.pendingEmail = undefined // clear the pending email
//     user.emailVerificationCode = undefined // clear the verification code
//     user.emailVerificationExpires = undefined // clear the expiration time

//     await user.save({validateBeforeSave: false})

//     res.status(200).json({
//         status: 'success',
//         message: 'Your email has been updated and verified successfully'
//     })
// })


// //resend the verification code
// // Resend verification code for updating email
// exports.resendVerificationCode = catchAsync(async (req, res, next) => {
//     const user = req.user;
  
//     // 1) Check if there's a pending email update
//     if (!user.pendingEmail) {
//       return next(new AppError('No email update request found.', 400));
//     }
  
//     // 2) Generate a new verification code and expiration time
//     const verificationCode = Math.floor(10000 + Math.random() * 90000).toString();
//     const emailVerificationExpires = Date.now() + 60 * 1000; // 1 min
  
//     // 3) Hash the new verification code
//     const hashedCode = await bcrypt.hash(verificationCode, 12);
  
//     // 4) Update the user's email verification fields
//     user.emailVerificationCode = hashedCode;
//     user.emailVerificationExpires = emailVerificationExpires;
  
//     await user.save({ validateBeforeSave: false });
  
//     // 5) Resend the verification email
//     await new Email(user).sendEmailVerification(verificationCode);
  
//     // 6) Send the response
//     res.status(200).json({
//       status: 'success',
//       message: 'A new verification code has been sent to your email.',
//     });
// });
  