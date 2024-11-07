const mongoose = require('mongoose')
const dotenv = require('dotenv')


//accessing config file
dotenv.config({path: './config.env'});
//importing the app
const app = require('./app')

//connect to mongodb
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)

mongoose.connect(DB).then(
    ()=> {
        console.log('Connected to MongoDB...')
    }
)

// ## Starting the Server

//initiating the port
const port = process.env.PORT || 3000;
const server = app.listen(port, ()=> {
    console.log(`app running on ${port}`)
})