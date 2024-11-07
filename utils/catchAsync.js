// catchAsync is a higher-order function that wraps an async function to automatically catch errors and pass them to the error handling middleware (next).
// It takes an async function (fn) and returns a new function that calls fn and handles any errors by invoking next(err).

exports.catchAsync = fn => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    }
}