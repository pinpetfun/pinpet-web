import { useState, useCallback } from 'react';
import { usePinPetSdkReady } from '../contexts/PinPetSdkContext';
import type { PublicKey } from '@solana/web3.js';

/**
 * @interface PinPetDataOptions
 * @description PinPetData查询选项接口
 */
interface PinPetDataOptions {
  page?: number;
  limit?: number;
  sort_by?: string;
  type?: string;
  order_by?: string;
  dataSource?: 'fast' | 'chain';
  [key: string]: any;
}

/**
 * @interface PinPetDataHookResult
 * @description PinPetData Hook返回结果接口
 */
interface PinPetDataHookResult {
  loading: boolean;
  error: Error | null;
  getMints: (options?: PinPetDataOptions) => Promise<any>;
  getMintInfo: (mint: string | PublicKey) => Promise<any>;
  getPrice: (mint: string | PublicKey) => Promise<any>;
  getOrders: (mint: string | PublicKey, options?: PinPetDataOptions) => Promise<any>;
  getUserOrders: (user: string | PublicKey, mint: string | PublicKey, options?: PinPetDataOptions) => Promise<any>;
  getDataOrders: (mint: string | PublicKey, options?: PinPetDataOptions) => Promise<any>;
  getDataPrice: (mint: string | PublicKey, options?: PinPetDataOptions) => Promise<any>;
  getDataUserOrders: (user: string | PublicKey, mint: string | PublicKey, options?: PinPetDataOptions) => Promise<any>;
  clearError: () => void;
}

/**
 * @hook usePinPetData
 * @description 数据查询相关的Hook，封装SDK的fast和data模块方法
 * @returns {PinPetDataHookResult} PinPetData Hook结果
 */
export const usePinPetData = (): PinPetDataHookResult => {
  const { sdk } = usePinPetSdkReady();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // 通用请求处理
  const handleRequest = useCallback(async <T>(requestFn: () => Promise<T>): Promise<T> => {
    setLoading(true);
    setError(null);

    try {
      const result = await requestFn();
      return result;
    } catch (err) {
      console.error('PinPetData 请求失败:', err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 获取代币列表
  const getMints = useCallback(async (options: PinPetDataOptions = {}): Promise<any> => {
    return handleRequest(() => sdk.fast.mints({
      page: 1,
      limit: 10,
      sort_by: 'slot_asc',
      ...options
    }));
  }, [sdk, handleRequest]);

  // 获取代币详情
  const getMintInfo = useCallback(async (mint: string | PublicKey): Promise<any> => {
    return handleRequest(() => sdk.fast.mint_info(mint));
  }, [sdk, handleRequest]);

  // 获取代币价格
  const getPrice = useCallback(async (mint: string | PublicKey): Promise<any> => {
    return handleRequest(() => sdk.fast.price(mint));
  }, [sdk, handleRequest]);

  // 获取订单数据
  const getOrders = useCallback(async (mint: string | PublicKey, options: PinPetDataOptions = {}): Promise<any> => {
    return handleRequest(() => sdk.fast.orders(mint, {
      type: 'down_orders',
      page: 1,
      limit: 500,
      ...options
    }));
  }, [sdk, handleRequest]);

  // 获取用户订单
  const getUserOrders = useCallback(async (user: string | PublicKey, mint: string | PublicKey, options: PinPetDataOptions = {}): Promise<any> => {
    return handleRequest(() => sdk.fast.user_orders(user, mint, {
      page: 1,
      limit: 200,
      order_by: 'start_time_desc',
      ...options
    }));
  }, [sdk, handleRequest]);

  // 使用统一数据接口
  const getDataOrders = useCallback(async (mint: string | PublicKey, options: PinPetDataOptions = {}): Promise<any> => {
    return handleRequest(() => sdk.data.orders(mint, {
      type: 'down_orders',
      ...options
    }));
  }, [sdk, handleRequest]);

  const getDataPrice = useCallback(async (mint: string | PublicKey, options: PinPetDataOptions = {}): Promise<any> => {
    return handleRequest(() => sdk.data.price(mint, options));
  }, [sdk, handleRequest]);

  const getDataUserOrders = useCallback(async (user: string | PublicKey, mint: string | PublicKey, options: PinPetDataOptions = {}): Promise<any> => {
    return handleRequest(() => sdk.data.user_orders(user, mint, {
      page: 1,
      limit: 200,
      order_by: 'start_time_desc',
      ...options
    }));
  }, [sdk, handleRequest]);

  return {
    // 状态
    loading,
    error,

    // Fast API 方法
    getMints,
    getMintInfo,
    getPrice,
    getOrders,
    getUserOrders,

    // 统一数据接口方法
    getDataOrders,
    getDataPrice,
    getDataUserOrders,

    // 工具方法
    clearError: () => setError(null)
  };
};