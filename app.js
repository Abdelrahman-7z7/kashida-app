const express = require('express')


const app = express()


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