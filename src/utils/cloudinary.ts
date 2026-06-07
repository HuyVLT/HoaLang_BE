import { v2 as cloudinary, UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
import dotenv from 'dotenv';

// Load environment variables immediately to resolve ESM hoisting bugs
dotenv.config();

const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME || 'mock_cloud_name',
    api_key: process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_KEY || 'mock_api_key',
    api_secret: process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_SECRET || 'mock_api_secret',
  });
};

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
  configureCloudinary();
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
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

/**
 * Upload a base64 image data URI to Cloudinary
 * @param base64Str The base64 data URI string (starts with data:image)
 * @param folder The folder to store the image in Cloudinary
 * @returns A promise resolving to the secure URL of the uploaded image
 */
export const uploadBase64ToCloudinary = (
  base64Str: string,
  folder: string = 'hoalang/onboarding'
): Promise<string> => {
  configureCloudinary();
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      base64Str,
      {
        folder,
        resource_type: 'image',
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) {
          console.error('[Cloudinary] Base64 upload failed:', error);
          return reject(error);
        }
        if (!result) {
          return reject(new Error('[Cloudinary] Base64 upload returned empty result'));
        }
        resolve(result.secure_url);
      }
    );
  });
};

export default cloudinary;
