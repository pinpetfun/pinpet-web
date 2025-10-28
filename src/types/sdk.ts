import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Wallet } from '@coral-xyz/anchor';
import { BN } from '@coral-xyz/anchor';

/**
 * @interface SdkOptions
 * @description SDK配置选项
 * @property {string} [defaultDataSource] - 默认数据源 ('fast' | 'chain')
 * @property {PublicKey | string} [fee_recipient] - 手续费接收者
 * @property {PublicKey | string} [base_fee_recipient] - 基础手续费接收者
 * @property {PublicKey | string} [params_account] - 参数账户
 * @property {string} [spin_fast_api_url] - 快速API URL
 * @property {string} [commitment] - 提交级别
 * @property {string} [preflightCommitment] - 预检查提交级别
 * @property {boolean} [skipPreflight] - 是否跳过预检查
 * @property {number} [maxRetries] - 最大重试次数
 */
export interface SdkOptions {
  defaultDataSource?: 'fast' | 'chain';
  fee_recipient?: PublicKey | string;
  base_fee_recipient?: PublicKey | string;
  params_account?: PublicKey | string;
  spin_fast_api_url?: string;
  commitment?: string;
  preflightCommitment?: string;
  skipPreflight?: boolean;
  maxRetries?: number;
}

/**
 * @interface OrderData
 * @description 订单数据
 * @property {string} order_pda - 订单PDA地址
 * @property {string} user - 用户地址
 * @property {string} sol_amount - SOL数量
 * @property {string} token_amount - Token数量
 * @property {string} [price] - 价格
 */
export interface OrderData {
  order_pda: string;
  user: string;
  sol_amount: string;
  token_amount: string;
  price?: string;
}

/**
 * @interface OrdersResponse
 * @description 订单响应数据
 * @property {OrderData[]} orders - 订单数组
 * @property {number} [total] - 总数
 */
export interface OrdersResponse {
  orders: OrderData[];
  total?: number;
}

/**
 * @interface ApiResponse
 * @description API响应格式
 * @template T
 * @property {boolean} success - 是否成功
 * @property {T} data - 响应数据
 * @property {string} [message] - 消息
 * @property {string} [error] - 错误信息
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

/**
 * @interface LpPair
 * @description LP配对数据
 * @property {BN} solAmount - SOL数量
 * @property {BN} tokenAmount - Token数量
 */
export interface LpPair {
  solAmount: BN;
  tokenAmount: BN;
}

/**
 * @interface PrevNextResult
 * @description 前后订单查找结果
 * @property {OrderData | null} prevOrder - 前一个订单
 * @property {OrderData | null} nextOrder - 后一个订单
 */
export interface PrevNextResult {
  prevOrder: OrderData | null;
  nextOrder: OrderData | null;
}

/**
 * @interface DataQueryOptions
 * @description 数据查询选项
 * @property {'fast' | 'chain'} [dataSource] - 数据源
 * @property {'up_orders' | 'down_orders'} [type] - 订单类型
 * @property {number} [limit] - 限制数量
 * @property {number} [offset] - 偏移量
 */
export interface DataQueryOptions {
  dataSource?: 'fast' | 'chain';
  type?: 'up_orders' | 'down_orders';
  limit?: number;
  offset?: number;
}

/**
 * @type WalletType
 * @description 钱包类型
 */
export type WalletType = Wallet | Keypair;

/**
 * @type ProgramIdType
 * @description 程序ID类型
 */
export type ProgramIdType = PublicKey | string;
