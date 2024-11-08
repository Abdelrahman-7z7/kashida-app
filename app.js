const express = require('express')
const morgan = require('morgan')

//Routes
const postRoute = require('./routes/postRoute')

const app = express()

//middleware to parse JSON request bodies
app.use(express.json())

//logging middleware
if(process.env.NODE_ENV.trim() === 'development'){
    app.use(morgan('dev'))
}


//testing purposes
app.get('/', (req, res, next)=>{
    res.json({ message: 'Welcome to the Express API!' })
    next();
})



// app.all('*', (req, res, next) => {
//     res.header('Access-Control-Allow-Origin', '*')
//     res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
//     res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
//     next();
// })

app.use('/api/k1/posts', postRoute);
// app.use('/api/k1/user');
// app.use('/api/k1/comment');

module.exports = app;