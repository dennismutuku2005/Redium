import fs from 'fs';
import path from 'path';
import { writeFile, unlink, mkdir } from 'fs/promises';

const STORAGE_DRIVER = process.env.STORAGE_DRIVER || 'local';
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

/**
 * Storage adapter interface for handling image uploads, deletions, and URLs
 */
class LocalStorageAdapter {
  constructor() {
    this.uploadDir = UPLOAD_DIR;
  }

  async ensureDirectory() {
    if (!fs.existsSync(this.uploadDir)) {
      await mkdir(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Save a buffer or file to local disk
   * @param {Buffer} buffer
   * @param {string} filename
   * @param {string} mimeType
   * @returns {Promise<{url: string, path: string}>}
   */
  async upload(buffer, filename, mimeType) {
    await this.ensureDirectory();
    
    // Sanitize filename and create unique timestamped name
    const ext = path.extname(filename) || '.jpg';
    const cleanBase = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '');
    const uniqueName = `${Date.now()}-${cleanBase || 'photo'}${ext}`;
    const filePath = path.join(this.uploadDir, uniqueName);

    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${uniqueName}`;
    return {
      url: publicUrl,
      path: filePath,
      filename: uniqueName,
    };
  }

  /**
   * Delete a file from disk
   * @param {string} publicUrl
   * @returns {Promise<boolean>}
   */
  async delete(publicUrl) {
    try {
      if (!publicUrl || !publicUrl.startsWith('/uploads/')) return false;
      const filename = path.basename(publicUrl);
      const filePath = path.join(this.uploadDir, filename);
      if (fs.existsSync(filePath)) {
        await unlink(filePath);
      }
      return true;
    } catch (err) {
      console.error('Failed to delete file:', err);
      return false;
    }
  }
}

/**
 * Placeholder / Ready adapter for S3 (can be enabled via STORAGE_DRIVER=s3)
 */
class S3StorageAdapter {
  async upload(buffer, filename, mimeType) {
    // S3 upload implementation using AWS SDK v3 when configured
    throw new Error('S3 Storage driver not configured. Set AWS credentials in .env');
  }

  async delete(url) {
    throw new Error('S3 Storage driver not configured.');
  }
}

/**
 * Placeholder / Ready adapter for Cloudinary (can be enabled via STORAGE_DRIVER=cloudinary)
 */
class CloudinaryStorageAdapter {
  async upload(buffer, filename, mimeType) {
    // Cloudinary upload implementation
    throw new Error('Cloudinary Storage driver not configured. Set CLOUDINARY credentials in .env');
  }

  async delete(url) {
    throw new Error('Cloudinary Storage driver not configured.');
  }
}

// Factory function to get active adapter
function getStorageAdapter() {
  switch (STORAGE_DRIVER.toLowerCase()) {
    case 's3':
      return new S3StorageAdapter();
    case 'cloudinary':
      return new CloudinaryStorageAdapter();
    case 'local':
    default:
      return new LocalStorageAdapter();
  }
}

export const storage = getStorageAdapter();
