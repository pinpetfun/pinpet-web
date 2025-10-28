/**
 * Emoji 图片配置
 * 预定义常用的 emoji 和背景色组合
 */

import { createEmojiImage, createCircleEmojiImage } from '../utils/emojiImage';

// Emoji 类型映射
export const EMOJI_MAP = {
  cat: { emoji: '🐱', bg: '#FFB6C1' },       // 粉色猫咪
  dog: { emoji: '🐶', bg: '#87CEEB' },       // 天蓝色狗狗
  coin: { emoji: '🪙', bg: '#FFD700' },      // 金色硬币
  rocket: { emoji: '🚀', bg: '#FF6B6B' },    // 红色火箭
  token: { emoji: '💰', bg: '#FFA500' },     // 橙色代币
  chart: { emoji: '📊', bg: '#4ECDC4' },     // 青色图表
  fire: { emoji: '🔥', bg: '#FF4757' },      // 红色火焰
  star: { emoji: '⭐', bg: '#FFD93D' },      // 黄色星星
  default: { emoji: '❓', bg: '#CCCCCC' },   // 灰色问号
  loading: { emoji: '⏳', bg: '#CCCCCC' },   // 加载中
};

/**
 * 获取预定义的 emoji 图片
 * @param {string} type - emoji 类型（如 'cat', 'dog', 'default'）
 * @param {number} width - 宽度
 * @param {number} height - 高度（可选）
 * @returns {string} Data URI
 */
export const getEmojiImage = (type, width = 80, height = null) => {
  const config = EMOJI_MAP[type] || EMOJI_MAP.default;
  return createEmojiImage(config.emoji, width, height, config.bg);
};

/**
 * 获取圆形 emoji 图片
 * @param {string} type - emoji 类型
 * @param {number} size - 尺寸
 * @returns {string} Data URI
 */
export const getCircleEmojiImage = (type, size = 40) => {
  const config = EMOJI_MAP[type] || EMOJI_MAP.default;
  return createCircleEmojiImage(config.emoji, size, config.bg);
};

/**
 * 根据代币符号生成 emoji 图片
 * @param {string} symbol - 代币符号（如 'BTC', 'ETH'）
 * @param {number} width - 宽度
 * @param {number} height - 高度
 * @param {string} bgColor - 背景色（可选）
 * @returns {string} Data URI
 */
export const getTokenEmojiImage = (symbol, width = 80, height = null, bgColor = null) => {
  const firstChar = symbol ? symbol.charAt(0).toUpperCase() : '?';
  const bg = bgColor || EMOJI_MAP.token.bg;
  return createEmojiImage(firstChar, width, height, bg);
};
