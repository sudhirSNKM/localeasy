import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export const storageService = {
  /**
   * Upload an image to Firebase Storage
   * @param path The path in storage (e.g., 'businesses/logo.png')
   * @param file The file object from input
   * @returns The download URL
   */
  async uploadImage(path: string, file: File): Promise<string> {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  },

  /**
   * Convenience method for business logos
   */
  async uploadBusinessLogo(bizId: string, file: File): Promise<string> {
    return this.uploadImage(`businesses/${bizId}/logo_${Date.now()}`, file);
  },

  /**
   * Convenience method for business covers
   */
  async uploadBusinessCover(bizId: string, file: File): Promise<string> {
    return this.uploadImage(`businesses/${bizId}/cover_${Date.now()}`, file);
  }
};
