/**
 * Emoji 图片生成工具
 * 将 emoji 转换为 SVG Data URI，用于替代占位图
 */

/**
 * 创建包含 emoji 的 SVG Data URI
 * @param {string} emoji - emoji 字符，如 '🐱'
 * @param {number} width - 宽度（像素）
 * @param {number} height - 高度（像素，可选，默认等于宽度）
 * @param {string} bgColor - 背景色（十六进制）
 * @param {string} textColor - 文字颜色（十六进制）
 * @returns {string} Data URI 格式的图片地址
 */
export const createEmojiImage = (
  emoji,
  width = 80,
  height = null,
  bgColor = '#FFB6C1',
  _textColor = '#FFFFFF'
) => {
  const h = height || width;
  const fontSize = Math.min(width, h) * 0.6;

  const svg = `
    <svg width="${width}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${h}" fill="${bgColor}" rx="12"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".35em"
            font-size="${fontSize}" font-family="Arial, sans-serif">
        ${emoji}
      </text>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
};

/**
 * 创建方形 emoji 图片
 * @param {string} emoji - emoji 字符
 * @param {number} size - 尺寸
 * @param {string} bgColor - 背景色
 * @returns {string} Data URI
 */
export const createSquareEmojiImage = (emoji, size = 80, bgColor = '#FFB6C1') => {
  return createEmojiImage(emoji, size, size, bgColor, '#FFFFFF');
};

/**
 * 创建圆形 emoji 图片
 * @param {string} emoji - emoji 字符
 * @param {number} size - 尺寸
 * @param {string} bgColor - 背景色
 * @returns {string} Data URI
 */
export const createCircleEmojiImage = (emoji, size = 80, bgColor = '#FFB6C1') => {
  const fontSize = size * 0.6;

  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="${bgColor}"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".35em"
            font-size="${fontSize}" font-family="Arial, sans-serif">
        ${emoji}
      </text>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
};
