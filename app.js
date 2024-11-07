const express = require('express')
const morgan = require('morgan')


const app = express()

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


module.exports = app;