import { PublicKey } from '@solana/web3.js';

/**
 * @interface BaseProject
 * @description 项目基础信息
 * @property {number} id - 项目ID
 * @property {string} name - 项目名称
 * @property {string} marketCap - 市值
 * @property {string} progress - 进度
 * @property {string} contractAddress - 合约地址
 * @property {string} image - 项目图片
 */
export interface BaseProject {
  id: number;
  name: string;
  marketCap: string;
  progress: string;
  contractAddress: string;
  image: string;
}

/**
 * @interface HotProject
 * @description 热门项目信息
 * @extends BaseProject
 * @property {boolean} [isHot] - 是否为热门项目
 */
export interface HotProject extends BaseProject {
  isHot?: boolean;
}

/**
 * @interface FeaturedProject
 * @description 精选项目信息
 * @extends BaseProject
 * @property {string} [status] - 项目状态
 * @property {string} [timeAgo] - 发布时间
 */
export interface FeaturedProject extends BaseProject {
  status?: string;
  timeAgo?: string;
}

/**
 * @interface Order
 * @description 订单信息
 * @property {PublicKey} order_pda - 订单PDA地址
 * @property {PublicKey} user - 用户地址
 * @property {number} sol_amount - SOL数量
 * @property {number} token_amount - Token数量
 */
export interface Order {
  order_pda: PublicKey;
  user: PublicKey;
  sol_amount: number;
  token_amount: number;
}

