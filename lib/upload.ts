import api from './api'; // Import the configured Axios instance

export const uploadImage = async (file: File) => {
    // Basic validation
    if (!file.type.startsWith('image/')) {
        throw new Error("Invalid file type. Only images are allowed.");
    }
    
    const formData = new FormData();
    formData.append('image', file);

    try {
        // Proxy image upload through our backend
        const response = await api.post('/api/upload/image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data', // Important for file uploads
            },
        });

        // Assuming backend returns an object with a 'url' property upon success
        if (response.data && response.data.url) {
            return response.data.url;
        } else {
            throw new Error(response.data.message || 'Image upload failed on backend');
        }
    } catch (error: any) {
        console.error("Image Upload Error:", error);
        throw new Error(error.response?.data?.message || 'Image upload failed');
    }
};