import { useState, useCallback } from 'react';
import { useSpinPetSdkReady } from '../contexts/SpinPetSdkContext';

/**
 * 数据查询相关的 Hook
 * 封装 SDK 的 fast 和 data 模块方法
 */
export const useSpinPetData = () => {
  const { sdk } = useSpinPetSdkReady();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 通用请求处理
  const handleRequest = useCallback(async (requestFn) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await requestFn();
      return result;
    } catch (err) {
      console.error('SpinPetData 请求失败:', err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 获取代币列表
  const getMints = useCallback(async (options = {}) => {
    return handleRequest(() => sdk.fast.mints({
      page: 1,
      limit: 10,
      sort_by: 'slot_asc',
      ...options
    }));
  }, [sdk, handleRequest]);

  // 获取代币详情
  const getMintInfo = useCallback(async (mint) => {
    return handleRequest(() => sdk.fast.mint_info(mint));
  }, [sdk, handleRequest]);

  // 获取代币价格
  const getPrice = useCallback(async (mint) => {
    return handleRequest(() => sdk.fast.price(mint));
  }, [sdk, handleRequest]);

  // 获取订单数据
  const getOrders = useCallback(async (mint, options = {}) => {
    return handleRequest(() => sdk.fast.orders(mint, {
      type: 'down_orders',
      page: 1,
      limit: 500,
      ...options
    }));
  }, [sdk, handleRequest]);

  // 获取用户订单
  const getUserOrders = useCallback(async (user, mint, options = {}) => {
    return handleRequest(() => sdk.fast.user_orders(user, mint, {
      page: 1,
      limit: 200,
      order_by: 'start_time_desc',
      ...options
    }));
  }, [sdk, handleRequest]);

  // 使用统一数据接口
  const getDataOrders = useCallback(async (mint, options = {}) => {
    return handleRequest(() => sdk.data.orders(mint, {
      type: 'down_orders',
      ...options
    }));
  }, [sdk, handleRequest]);

  const getDataPrice = useCallback(async (mint, options = {}) => {
    return handleRequest(() => sdk.data.price(mint, options));
  }, [sdk, handleRequest]);

  const getDataUserOrders = useCallback(async (user, mint, options = {}) => {
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