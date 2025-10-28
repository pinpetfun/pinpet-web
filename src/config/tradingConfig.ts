// 交易相关配置
export const defaultSlippageSettings = {
  slippage: 15, // 默认 15%
  speed: 'Turbo', // 暂时禁用
  frontRunningProtection: false, // 暂时禁用
  tipAmount: 0.003 // 暂时禁用
};

export const SLIPPAGE_CONFIG = {
  MIN: 0.1,
  MAX: 99.9,
  DEFAULT: 15,
  STORAGE_KEY: 'pinpet_slippage_settings'
};

export const SPEED_OPTIONS = ['Fast', 'Turbo', 'Ultra'];

// 获取滑点设置
export const getSlippageSettings = () => {
  try {
    const stored = localStorage.getItem(SLIPPAGE_CONFIG.STORAGE_KEY);
    if (stored) {
      return { ...defaultSlippageSettings, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('获取滑点设置失败:', error);
  }
  return defaultSlippageSettings;
};

// 保存滑点设置
export const saveSlippageSettings = (settings) => {
  try {
    localStorage.setItem(SLIPPAGE_CONFIG.STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('保存滑点设置失败:', error);
    return false;
  }
};

// 验证滑点值
export const validateSlippage = (value) => {
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  return num >= SLIPPAGE_CONFIG.MIN && num <= SLIPPAGE_CONFIG.MAX;
};

// 获取实际使用的滑点（在用户设置基础上增加50个百分点）
export const getActualSlippage = (userSlippage) => {
  const actualSlippage = userSlippage + 50;
  return Math.min(actualSlippage, 99); // 最大不超过99%
};