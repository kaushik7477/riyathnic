// Cloudinary image optimization utilities

/**
 * Adds f_auto and q_auto parameters to Cloudinary URLs for automatic format and quality optimization
 * @param {string} url - Original Cloudinary URL
 * @returns {string} - Optimized URL with f_auto,q_auto
 */
export const getOptimizedUrl = (url) => {
  if (!url) return "";
  // Insert f_auto,q_auto after /upload/
  return url.replace("/upload/", "/upload/f_auto,q_auto/");
};

/**
 * Gets thumbnail URL with optimization and resizing to 500px width
 * @param {string} url - Original Cloudinary URL
 * @returns {string} - Optimized thumbnail URL
 */
export const getThumbnailUrl = (url) => {
  if (!url) return "";
  // Adds auto-format, auto-quality, AND resizes to 500px width
  return url.replace("/upload/", "/upload/f_auto,q_auto,w_500,c_scale/");
};

/**
 * Gets medium-sized image URL with optimization and resizing to 800px width
 * @param {string} url - Original Cloudinary URL
 * @returns {string} - Optimized medium URL
 */
export const getMediumUrl = (url) => {
  if (!url) return "";
  // Adds auto-format, auto-quality, AND resizes to 800px width
  return url.replace("/upload/", "/upload/f_auto,q_auto,w_800,c_scale/");
};

export const getLargeUrl = (url) => {
  if (!url) return "";
  // Adds auto-format, auto-quality, AND resizes to 1200px width
  return url.replace("/upload/", "/upload/f_auto,q_auto,w_1200,c_scale/");
};

/**
 * Gets optimized video URL with auto-format and auto-quality
 * @param {string} url - Original Cloudinary URL
 * @returns {string} - Optimized video URL
 */
export const getVideoUrl = (url) => {
  if (!url) return "";
  return url.replace("/upload/", "/upload/f_auto,q_auto/");
};

/**
 * Gets low-bitrate optimized video URL for fast initial loading in gallery
 * @param {string} url - Original Cloudinary URL
 * @returns {string} - Optimized video URL (q_auto:eco)
 */
export const getInstaVideoUrl = (url) => {
  if (!url) return "";
  // Using q_auto:eco for aggressive compression on gallery videos
  return url.replace("/upload/", "/upload/f_auto,q_auto:eco/");
};