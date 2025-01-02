const express = require('express')
const morgan = require('morgan')
const globalErrorHandling = require('./controller/errorController')
const helmet = require('helmet')
const xss = require('xss-clean')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const hpp = require('hpp')
// const csrf = require('csurf')
// const cookieParser = require('cookie-parser');

//Routes
const postRoute = require('./routes/postRoute')
const commentRoute = require('./routes/commentRoute')
const replyRoute = require('./routes/replyRoute')
const userRoute = require('./routes/userRoute')
const LikedByRoute = require('./routes/likedByRoute')
const followRoute = require('./routes/followRoute')
const categoryRoute = require('./routes/categoryRoute')

// Express app setup
const app = express()

/** ==================
 *   SECURITY MIDDLEWARE
 * ================== */

//A collection of middleware to set HTTP headers for security
app.use(helmet())

//middleware for sanitizing user inputs to prevent XSS attacks
app.use(xss())

//To limit the number of requests a client can make in a given time frame. (protecting against server denial attacks)
//TODO:applying redis later
const limiter = rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW_MS, // interval
    max: process.env.RATE_LIMIT_MAX,   // max requests per user
    message: "Too many requests, please try again later",
    headers: true
})

app.use('/api', limiter)

//Middleware to prevent HTTP Parameter Pollution.
app.use(hpp())

//Prevent the app from being embedded in iframes to protect against clickjacking attacks
app.use(helmet.frameguard({action: 'deny'}))

app.use(helmet({
    noCache: true, //Prevent caching of sensitive data
    dnsPrefetchControl: {allow: false}, //Prevent DNS prefetching
    xContentTypeOptions: true //Prevent MIME sniffing attacks
}))

//Enforcing a referred policy to limit the information sent with external requests
app.use(helmet.referrerPolicy({policy: 'no-referrer'}))

//TODO: to be added later
// //parse cookies
// app.use(cookieParser())

// // Set up csrf protection middleware
// const csrfProtection = csrf({ cookie: true });

// // Use it in routes that need CSRF protection
// app.use(csrfProtection);

/** ==================
 *   GENERAL MIDDLEWARE
 * ================== */

//middleware to parse JSON request bodies
app.use(express.json())

//For configuring Cross-Origin Resource Sharing (CORS) policies to restrict API access
//TODO: we should apply this when we have the front-end-domain available
// app.use(cors(
//     {
//         origin: 'https://your-frontend-domain.com',
//         methods: ['GET', 'POST', 'PATCH', 'DELETE'],
//         credentials: true,  // Allows cookies to be sent across different origins
//     }
// ))

//logging middleware
if(process.env.NODE_ENV.trim() === 'development'){
    app.use(morgan('dev'))
}


//testing purposes
// app.get('/', (req, res, next)=>{
//     res.json({ message: 'Welcome to the Express API!' })
//     next();
// })



// app.all('*', (req, res, next) => {
//     res.header('Access-Control-Allow-Origin', '*')
//     res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
//     res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
//     next();
// })


/** ==================
 *   ROUTES
 * ================== */

app.use('/api/k1/posts', postRoute);
app.use('/api/k1/comments', commentRoute);
app.use('/api/k1/replies', replyRoute);
app.use('/api/k1/users', userRoute);
app.use('/api/k1/', LikedByRoute);
app.use('/api/k1/follow', followRoute);
app.use('/api/k1/category', categoryRoute);

/** ==================
 *   ERROR HANDLING
 * ================== */

//reaching this point refers to having an error
// ## using global-error-handler from errorController ##
app.use(globalErrorHandling);

module.exports = app;