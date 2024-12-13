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

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {fileSize: 10* 1024* 1024} //optional: Increase file size(e.g. 10MB)
}).array('photos', 10) //allows up to 10 photos per request


module.exports = upload;