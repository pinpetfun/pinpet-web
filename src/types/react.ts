import { ReactNode } from 'react';
import { Connection } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';

/**
 * @interface BaseComponentProps
 * @description 基础组件属性
 * @property {ReactNode} [children] - 子元素
 * @property {string} [className] - CSS类名
 */
export interface BaseComponentProps {
  children?: ReactNode;
  className?: string;
}

/**
 * @interface LayoutProps
 * @description 布局组件属性
 * @extends BaseComponentProps
 */
export interface LayoutProps extends BaseComponentProps {}

/**
 * @interface HeaderProps
 * @description 头部组件属性
 * @property {boolean} [showWallet] - 是否显示钱包连接
 */
export interface HeaderProps {
  showWallet?: boolean;
}

/**
 * @interface SearchProps
 * @description 搜索组件属性
 * @property {string} [placeholder] - 占位符文本
 * @property {(value: string) => void} [onSearch] - 搜索回调
 * @property {string} [value] - 搜索值
 */
export interface SearchProps {
  placeholder?: string;
  onSearch?: (value: string) => void;
  value?: string;
}

/**
 * @interface CardProps
 * @description 卡片组件属性
 * @extends BaseComponentProps
 * @property {string} [title] - 标题
 * @property {boolean} [loading] - 加载状态
 */
export interface CardProps extends BaseComponentProps {
  title?: string;
  loading?: boolean;
}

/**
 * @interface WalletContextValue
 * @description 钱包上下文值
 * @property {WalletContextState} wallet - 钱包状态
 * @property {Connection | null} connection - Solana连接
 * @property {boolean} connected - 是否已连接
 */
export interface WalletContextValue {
  wallet: WalletContextState;
  connection: Connection | null;
  connected: boolean;
}

/**
 * @interface WebSocketContextValue
 * @description WebSocket上下文值
 * @property {WebSocket | null} socket - WebSocket实例
 * @property {boolean} connected - 是否已连接
 * @property {(data: any) => void} send - 发送数据
 * @property {() => void} connect - 连接
 * @property {() => void} disconnect - 断开连接
 */
export interface WebSocketContextValue {
  socket: WebSocket | null;
  connected: boolean;
  send: (data: any) => void;
  connect: () => void;
  disconnect: () => void;
}

/**
 * @interface TradingData
 * @description 交易数据
 * @property {number} price - 价格
 * @property {number} volume - 成交量
 * @property {number} change - 变化
 * @property {number} changePercent - 变化百分比
 */
export interface TradingData {
  price: number;
  volume: number;
  change: number;
  changePercent: number;
}

/**
 * @interface ChartData
 * @description 图表数据
 * @property {number} time - 时间戳
 * @property {number} value - 数值
 * @property {number} [open] - 开盘价
 * @property {number} [high] - 最高价
 * @property {number} [low] - 最低价
 * @property {number} [close] - 收盘价
 * @property {number} [volume] - 成交量
 */
export interface ChartData {
  time: number;
  value: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
}
