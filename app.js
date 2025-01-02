const express = require('express')
const morgan = require('morgan')
const globalErrorHandling = require('./controller/errorController')
const helmet = require('helmet')
const xss = require('xss-clean')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const hpp = require('hpp')
const csurf = require('csurf')

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
    windowMs: 60* 1000, // 1 minute interval
    max: 100,   // 100 requests per user
    message: "Too many requests, please try again later",
    headers: true
})

app.use('/api', limiter)

//Middleware to prevent HTTP Parameter Pollution.
app.use(hpp())

// Set up csrf protection middleware
const csrfProtection = csrf({ cookie: true });

// Use it in routes that need CSRF protection
app.use(csrfProtection);

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
//         methods: ['GET', 'POST', 'PATCH', 'DELETE']
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