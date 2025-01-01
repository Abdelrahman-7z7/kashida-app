const multer = require('multer')
const winston = require('winston')
const AppError = require('./appError')


//winston logger setup
const logger = winston.createLogger({
    level: 'info',
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({filename: 'upload-logs.log'})
    ],
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({timestamp, level, message})=>{
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
    )
})


//memory storage for faster processing (doesn't save to disk)
const storage = multer.memoryStorage()

//allow images
const fileFilter = (req, file, cb)=>{
    if(file.mimetype.startsWith('image')){
        logger.info(`File accepted: ${file.originalname} (${file.mimetype})`)
        cb(null, true)
    }else{
        const errorMessage = `Rejected file: ${file.originalname} (${file.mimetype}) - Only images are allowed`
        logger.warn(errorMessage)
        cb(new AppError(errorMessage, 400));
    }
}

// Create a reusable function
const configureMulter = (fieldName, maxCount) => {
    return multer({
        storage: storage,
        fileFilter: fileFilter,
        limits: { fileSize: 10 * 1024 * 1024 }, // Optional: Max file size (e.g., 10MB)
    }).array(fieldName, maxCount); // Allows dynamic field name and file count
};

module.exports = configureMulter;