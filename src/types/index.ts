/**
 * @file 类型声明文件入口
 * @description 导出所有类型声明
 */

// 通用类型
export * from './common';

// SDK相关类型
export * from './sdk';

// React相关类型
export * from './react';

// 全局类型声明
declare global {
  interface Window {
    solana?: any;
    phantom?: any;
  }
}

/**
 * @type Nullable
 * @description 可为空的类型
 * @template T
 */
export type Nullable<T> = T | null;

/**
 * @type Optional
 * @description 可选的类型
 * @template T
 */
export type Optional<T> = T | undefined;

/**
 * @type DeepPartial
 * @description 深度可选类型
 * @template T
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * @type StringOrNumber
 * @description 字符串或数字类型
 */
export type StringOrNumber = string | number;

/**
 * @type Callback
 * @description 回调函数类型
 * @template T
 * @template R
 */
export type Callback<T = void, R = void> = (arg: T) => R;

/**
 * @type AsyncCallback
 * @description 异步回调函数类型
 * @template T
 * @template R
 */
export type AsyncCallback<T = void, R = void> = (arg: T) => Promise<R>;

/**
 * @type EventHandler
 * @description 事件处理函数类型
 * @template T
 */
export type EventHandler<T = Event> = (event: T) => void;

/**
 * @type ComponentType
 * @description 组件类型
 */
export type ComponentType = 'button' | 'input' | 'select' | 'textarea' | 'div' | 'span';

/**
 * @type Theme
 * @description 主题类型
 */
export type Theme = 'light' | 'dark';

/**
 * @type Size
 * @description 尺寸类型
 */
export type Size = 'small' | 'medium' | 'large';

/**
 * @type Status
 * @description 状态类型
 */
export type Status = 'idle' | 'loading' | 'success' | 'error';

/**
 * @type Direction
 * @description 方向类型
 */
export type Direction = 'up' | 'down' | 'left' | 'right';

/**
 * @type OrderType
 * @description 订单类型
 */
export type OrderType = 'buy' | 'sell';

/**
 * @type DataSource
 * @description 数据源类型
 */
export type DataSource = 'fast' | 'chain';
