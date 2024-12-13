const cloudinary = require('./cloudinary')
const AppError = require('./appError')
const catchAsync = require('./catchAsync')

const uploadImagesToCloudinary = async (files) => {
    const uploadedImages = [];
    const resizeOptions = { width: 500, crop: 'scale', quality: 'auto:best', fetch_format: 'auto' };

    // Loop through files and upload to Cloudinary
    for (const file of files) {
        if (!file.mimetype.startsWith('image')) {
            throw new AppError('Only image files are allowed', 400);
        }

        // Upload image to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'image',
                    transformation: [resizeOptions],
                },
                (error, result) => {
                    if (error) reject(new AppError('Error uploading image to Cloudinary', 500));
                    else resolve(result);
                }
            );

            uploadStream.end(file.buffer); // Use file.buffer for memory storage
        });

        // Store the uploaded image URL
        uploadedImages.push(result.secure_url);
    }

    return uploadedImages;
};

module.exports = uploadImagesToCloudinary;