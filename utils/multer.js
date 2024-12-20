const multer = require('multer')

//memory storage for faster processing (doesn't save to disk)
const storage = multer.memoryStorage()

//allow images
const fileFilter = (req, file, cb)=>{
    if(file.mimetype.startsWith('image')){
        cb(null, true)
    }else{
        cb(new Error('Only images and videos are allowed!!'), false)
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