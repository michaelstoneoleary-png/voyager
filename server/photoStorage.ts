/**
 * Photo storage provider abstraction.
 * Swap this file to migrate from Cloudinary to S3 or another provider.
 * All callers use the exported `photoProvider` interface only.
 */

import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  publicId: string;
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
}

export interface PhotoProvider {
  upload(buffer: Buffer, filename: string, folder: string): Promise<UploadResult>;
  delete(publicId: string): Promise<void>;
  getThumbnailUrl(url: string, width?: number, height?: number): string;
}

const cloudinaryProvider: PhotoProvider = {
  async upload(buffer: Buffer, filename: string, folder: string): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: `${Date.now()}-${filename.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_")}`,
          resource_type: "image",
          // Auto-convert HEIC/HEIF (iPhone photos) to JPEG
          format: "jpg",
          // Strip sensitive EXIF (we extract GPS ourselves before uploading)
          exif: false,
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) return reject(error ?? new Error("Upload failed"));
          resolve({
            publicId: result.public_id,
            url: result.secure_url,
            thumbnailUrl: cloudinaryProvider.getThumbnailUrl(result.secure_url, 400, 300),
            width: result.width,
            height: result.height,
          });
        }
      );
      uploadStream.end(buffer);
    });
  },

  async delete(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  },

  getThumbnailUrl(url: string, width = 400, height = 300): string {
    // Insert Cloudinary transformation into the URL
    return url.replace("/upload/", `/upload/w_${width},h_${height},c_fill,q_auto,f_auto/`);
  },
};

export const photoProvider = cloudinaryProvider;
