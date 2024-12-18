const express = require('express')
const morgan = require('morgan')
const globalErrorHandling = require('./controller/errorController')

//Routes
const postRoute = require('./routes/postRoute')
const commentRoute = require('./routes/commentRoute')
const replyRoute = require('./routes/replyRoute')
const userRoute = require('./routes/userRoute')
const LikedByRoute = require('./routes/likedByRoute')
const followRoute = require('./routes/followRoute')

// Express app setup
const app = express()


//middleware to parse JSON request bodies
app.use(express.json())

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

app.use('/api/k1/posts', postRoute);
app.use('/api/k1/comments', commentRoute);
app.use('/api/k1/replies', replyRoute);
app.use('/api/k1/users', userRoute);
app.use('/api/k1/', LikedByRoute);
app.use('/api/k1/follow', followRoute);

//reaching this point refers to having an error
// ## using global-error-handler from errorController ##
app.use(globalErrorHandling);

module.exports = app;