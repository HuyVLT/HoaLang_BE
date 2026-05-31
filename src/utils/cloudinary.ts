import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME || 'mock_cloud_name',
  api_key: process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_KEY || 'mock_api_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_SECRET || 'mock_api_secret',
});

/**
 * Upload a file buffer to Cloudinary
 * @param fileBuffer The file buffer from multer
 * @param folder The folder to store the image in Cloudinary
 * @returns A promise resolving to the secure URL of the uploaded image
 */
export const uploadToCloudinary = (
  fileBuffer: Buffer,
  folder: string = 'hoalang/avatars'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary] Upload failed:', error);
          return reject(error);
        }
        if (!result) {
          return reject(new Error('[Cloudinary] Upload returned empty result'));
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export default cloudinary;
