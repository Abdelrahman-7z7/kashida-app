const cloudinary = require('./cloudinary')
const AppError = require('./appError')
const catchAsync = require('./catchAsync')

exports.uploadImagesToCloudinary = async (files) => {
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

// Function to extract public IDs from Cloudinary URLs
const extractPublicIds = (urls) => {
    return urls.map(url => {
        const parts = url.split('/');
        const publicIdWithExtension = parts[parts.length - 1];
        return publicIdWithExtension.split('.')[0]; // Remove file extension
    });
};

// Function to delete images from Cloudinary
exports.deleteImagesFromCloudinary = async (urls) => {

    // Check if the array is empty or invalid
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
        console.log('No images to delete.');
        return; // Exit the function early
    }

    const publicIds = extractPublicIds(urls);

    try {
        await Promise.all(
            publicIds.map(publicId =>
                cloudinary.uploader.destroy(publicId, { resource_type: 'image' })
            )
        );
    } catch (error) {
        throw new AppError('Error deleting images from Cloudinary', 500);
    }
};