/**
 * Utility functions for file uploads
 * Ensures consistent multipart/form-data handling across the system
 */

/**
 * Creates FormData for file uploads
 * @param {Object} data - Data object containing fields and files
 * @param {Object} options - Options for FormData creation
 * @returns {FormData} FormData instance ready for upload
 */
export const createFormData = (data, options = {}) => {
  const formData = new FormData();
  const { excludeEmpty = false } = options;

  Object.keys(data).forEach(key => {
    const value = data[key];

    // Handle File objects
    if (value instanceof File) {
      formData.append(key, value);
      console.log(`[FileUpload] Added file: ${key}`, {
        name: value.name,
        size: value.size,
        type: value.type
      });
      return;
    }

    // Handle Blob objects
    if (value instanceof Blob) {
      formData.append(key, value);
      console.log(`[FileUpload] Added blob: ${key}`);
      return;
    }

    // Skip undefined/null values if excludeEmpty is true
    if (excludeEmpty && (value === undefined || value === null)) {
      return;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        formData.append(`${key}[${index}]`, item);
      });
      return;
    }

    // Handle objects (convert to JSON string)
    if (typeof value === 'object' && value !== null) {
      formData.append(key, JSON.stringify(value));
      return;
    }

    // Handle booleans
    if (typeof value === 'boolean') {
      formData.append(key, value ? '1' : '0');
      return;
    }

    // Handle all other types (convert to string)
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  // Log FormData contents for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('[FileUpload] FormData contents:');
    for (let pair of formData.entries()) {
      const value = pair[1];
      if (value instanceof File) {
        console.log(`  ${pair[0]}: [File: ${value.name}, ${(value.size / 1024).toFixed(2)} KB]`);
      } else {
        console.log(`  ${pair[0]}: ${value}`);
      }
    }
  }

  return formData;
};

/**
 * Validates file before upload
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @returns {Object} { valid: boolean, error?: string }
 */
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 2 * 1024 * 1024, // 2MB default
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
  } = options;

  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  if (!(file instanceof File)) {
    return { valid: false, error: 'Invalid file object' };
  }

  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `File size must be less than ${maxSizeMB}MB` };
  }

  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` };
  }

  // Check file extension
  if (allowedExtensions.length > 0) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      return { valid: false, error: `File extension not allowed. Allowed: ${allowedExtensions.join(', ')}` };
    }
  }

  return { valid: true };
};

/**
 * Creates a preview URL for an image file
 * @param {File} file - Image file
 * @returns {Promise<string>} Data URL for the image
 */
export const createImagePreview = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }

    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onloadend = () => {
      if (reader.result) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to create preview'));
      }
    };
    reader.readAsDataURL(file);
  });
};

export default {
  createFormData,
  validateFile,
  createImagePreview,
};











