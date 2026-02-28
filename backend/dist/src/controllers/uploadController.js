import axios from 'axios';
import FormData from 'form-data';
import logger from '../lib/logger.ts'; // Import shared logger
// IMGBB_API_KEY should always be loaded from environment variables in production.
// For development, it can be provided via .env
const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
export const uploadImage = async (req, res, next) => {
    try {
        if (!IMGBB_API_KEY) {
            logger.error('IMGBB_API_KEY is not set in environment variables.');
            return res.status(500).json({ message: 'Server configuration error: Image upload service not configured.' });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }
        // Authentication is handled by authenticateFirebaseToken middleware
        // We can directly access req.firebaseUser here if needed, but not explicitly used in upload logic itself
        // The presence of req.firebaseUser ensures the user is authenticated
        const formData = new FormData();
        formData.append('image', req.file.buffer.toString('base64'));
        const imgbbResponse = await axios.post(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, formData, {
            headers: formData.getHeaders(),
        });
        if (imgbbResponse.data.success) {
            res.status(200).json({ url: imgbbResponse.data.data.url });
        }
        else {
            logger.warn('Image upload to ImgBB failed.', { imgbbError: imgbbResponse.data.error?.message, imgbbStatus: imgbbResponse.status });
            return res.status(imgbbResponse.status).json({ message: imgbbResponse.data.error?.message || 'Image upload to ImgBB failed.' });
        }
    }
    catch (error) {
        logger.error('Backend image upload error:', error);
        // Standardize error format passed to next()
        next({ statusCode: error.response?.status || 500, message: error.response?.data?.error?.message || 'Failed to upload image.' });
    }
};
//# sourceMappingURL=uploadController.js.map