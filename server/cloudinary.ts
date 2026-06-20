import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import path from 'path';
import fs from 'fs';

const isCloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_KEY !== 'your_api_key' &&
  process.env.CLOUDINARY_API_SECRET &&
  process.env.CLOUDINARY_API_SECRET !== 'your_api_secret';

let upload: multer.Multer;

if (isCloudinaryConfigured) {
  // Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  // Setup Cloudinary storage for Multer
  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
      const isAudio = file.mimetype.startsWith('audio/');
      return {
        folder: 'karaokehub',
        resource_type: isAudio ? 'video' : 'image', // Cloudinary handles audio files under resource_type 'video'
        allowed_formats: isAudio ? ['mp3', 'wav', 'ogg', 'm4a'] : ['jpg', 'jpeg', 'png', 'webp'],
        public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
      };
    },
  });

  upload = multer({
    storage: storage,
    limits: {
      fileSize: 15 * 1024 * 1024, // 15MB file size limit
    },
  });
  console.log('☁️ Cloudinary file storage initialized successfully.');
} else {
  // Setup Local storage as robust fallback
  console.warn('⚠️ Cloudinary is not configured. Falling back to local file storage.');
  
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const localStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  });

  upload = multer({
    storage: localStorage,
    limits: {
      fileSize: 15 * 1024 * 1024, // 15MB file size limit
    },
  });
  console.log('📁 Local directory storage initialized successfully at /uploads.');
}

// Helper to extract file URL depending on upload type
export const getFileUrl = (req: any, file: Express.Multer.File): string => {
  if (isCloudinaryConfigured) {
    // In Cloudinary, Multer-Storage-Cloudinary sets the path/url in file.path
    return file.path;
  } else {
    // Local storage path: serve from backend server static files
    const host = req.get('host') || 'localhost:5000';
    const protocol = req.protocol || 'http';
    return `${protocol}://${host}/uploads/${file.filename}`;
  }
};

export { upload, isCloudinaryConfigured };
