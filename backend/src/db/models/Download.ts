import mongoose from 'mongoose';

export interface IDownload {
  _id: mongoose.Types.ObjectId;
  product: string;         // 'token-g' | 'raider'
  version: string;         // e.g. "2.4.1"
  url: string;             // Dropbox direct download link
  size: string;            // e.g. "42.3 MB"
  checksum: string;        // SHA-256 hash
  releaseNotes: string;    // markdown or plain text
  published: boolean;
  updatedAt: Date;
  createdAt: Date;
}

const downloadSchema = new mongoose.Schema<IDownload>({
  product:      { type: String, required: true },
  version:      { type: String, required: true },
  url:          { type: String, required: true },
  size:         { type: String, default: '' },
  checksum:     { type: String, default: '' },
  releaseNotes: { type: String, default: '' },
  published:    { type: Boolean, default: false },
  updatedAt:    { type: Date, default: Date.now },
  createdAt:    { type: Date, default: Date.now },
});

export const Download = mongoose.model<IDownload>('Download', downloadSchema);
