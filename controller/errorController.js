//accessing the appError handling class
const AppError = require('../utils/appError')


//handling castError
const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
}

const handleValidationErrorDB = err => {
    //can be multiple validations error so we need to map it into a nice message
    const errors = Object.values(err.errors).map(el => el.message);
    //joining the whole messages in one message
    const message = `Invalid input data. ${errors.join('. ')}`
    return new AppError(message, 400);
}

//handling duplicated fields
const handlingDuplicatedFieldsDB = err => {
    //obtained from stackOverflow to get the value of the error
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicated field value: ${value}. Please use another value!!`
    return new AppError(message, 400);
}

//handling invalid signature
const handlingJWTError = () => {
    const message = 'Invalid token, Please login again...'
    return (new AppError(message, 401))
}

//handling token expired
const handlingJWTExpiredError = () => {
    const message = 'Token expired, Please login again...'
    return (new AppError(message, 401));
}


//handling production env error
const sendErrorProd = (err, res) => {
    //user perspective: sending the error only if it was operational NOT programming error or unknown error
    if(err.isOperational){
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        })
    }else{
        // 1) logging error to the console
        console.log('Error 💥', err)

        // 2) send generic message
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        })
    }
}

//handling development env error
const sendErrorDev = (err, res) =>{
    res.status(err.statusCode).json({
        status: err.status,
        error: err, //error info tree
        message: err.message,
        stack: err.stack
    })
}

//implementing global-error-handling
module.exports = (err, req, res, next) => {
    // console.log('i am in')
    // console.log(err)
    console.log(process.env.NODE_ENV);

    //setting the error statusCode and status => either programmer code error or internal server error
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    //distinguishing the error information either in the development OR production mode (NODE_ENV)
    if(process.env.NODE_ENV.trim() === 'development'){
        sendErrorDev(err, res);
    }else if(process.env.NODE_ENV.trim() === 'production'){
        //copying the error to follow the encapsulation concept
        let error = {...err};

        //copying some fields which sometimes be undefined without hard copying
        error.name = err.name;
        error.message = err.message;
        error.errmsg  = err.errmsg;

        //handling data type miss matching
        if(error.name === 'CastError') error = handleCastErrorDB(err, res);

        //handling Validation error
        if(error.name === 'ValidationError') error = handleValidationErrorDB(err, res);

        //handling duplicated fields
        if(error.code === 11000 ) error = handlingDuplicatedFieldsDB(err, res);

        //handling invalid signature
        if(error.name === "JsonWebTokenError") error = handlingJWTError(err, res);

        //handling expires token
        if(error.name === "TokenExpiredError") error = handlingJWTExpiredError(err, res);
        
        //sending the caught error from production mode
        sendErrorProd(error, res)
    }

    
    //Don't need it since it will be the last step that we go through if we caught an error
    // next();
}

//we have to call it in the app.js as a global middleware 