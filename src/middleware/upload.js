import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;  
const MAX_FILES = 8;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/properties'),
  filename: (req, file, cb) => {
    const unique = crypto.randomBytes(16).toString('hex');
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
  }
  cb(null, true);
}

export const uploadPropertyImages = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
}).array('images', MAX_FILES);