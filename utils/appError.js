class AppError extends Error{
    constructor(message, statusCode){
        super(message)

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith(4)? 'fail' : 'error';
        this.isOperational = true;

        // captureStackTrace provides the stack trace for the current error, 
        // starting from the point where the error was captured (this.constructor), 
        // rather than from the top-level error handler (the default behavior).
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;