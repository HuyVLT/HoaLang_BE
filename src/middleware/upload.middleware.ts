import multer from 'multer';
import { AppError } from './error.middleware';

// Memory storage is ideal since we stream directly to Cloudinary
const storage = multer.memoryStorage();

// Limit file types to images
const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
) => {
  if (file.mimetype.startsWith('image/')) {
    callback(null, true);
  } else {
    callback(new AppError('Only image files are allowed!', 400) as any);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export default upload;
