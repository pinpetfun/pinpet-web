/**
 * SpinPet SDK
 * Solana Anchor 合约的 SDK
 * 模块化设计，提供交易、代币管理等功能
 */

// 导入SDK主类
const SpinPetSdk = require('./sdk');
const spinpetIdl = require('./idl/spinpet.json');
const { PublicKey } = require('@solana/web3.js');

// 导入模块（可选，用户也可以直接通过 sdk.trading 访问）
const TradingModule = require('./modules/trading');
const TokenModule = require('./modules/token');

// 导入配置工具
const { getDefaultOptions } = require('./utils/constants');

// 导入工具类
const OrderUtils = require('./utils/orderUtils');

// 导入常量（如果需要的话）
const SPINPET_PROGRAM_ID = new PublicKey(spinpetIdl.address); // 替换为实际的程序ID

// 主要导出
module.exports = {
  // SDK主类
  SpinPetSdk,
  
  // 常量
  SPINPET_PROGRAM_ID,
  
  // 配置工具
  getDefaultOptions,

  // 工具类
  OrderUtils,
};

// 默认导出SDK类
module.exports.default = SpinPetSdk;
