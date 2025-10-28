/**
 * @file SpinPet SDK
 * @description Solana Anchor 合约的 SDK，模块化设计，提供交易、代币管理等功能
 */

// 导入SDK主类
import * as SpinPetSdkModule from './sdk';
import spinpetIdl from './idl/spinpet.json';
import { PublicKey } from '@solana/web3.js';

// 导入模块（可选，用户也可以直接通过 sdk.trading 访问）
import { TradingModule } from './modules/trading';
import { TokenModule } from './modules/token';

// 导入配置工具
import { getDefaultOptions } from './utils/constants';

// 导入工具类
import * as OrderUtilsModule from './utils/orderUtils';

// 导入常量（如果需要的话）
const SPINPET_PROGRAM_ID = new PublicKey(spinpetIdl.address); // 替换为实际的程序ID

// 主要导出
export {
  // SDK主类
  SpinPetSdkModule as SpinPetSdk,

  // 常量
  SPINPET_PROGRAM_ID,

  // 配置工具
  getDefaultOptions,

  // 工具类
  OrderUtilsModule as OrderUtils,

  // 模块
  TradingModule,
  TokenModule,
};

// 默认导出SDK类
export default SpinPetSdkModule;
