import { useState, useEffect, useCallback, useRef } from 'react';
import { usePinPetSdk } from '../contexts/PinPetSdkContext';
import { useWalletContext } from '../contexts/WalletContext';
import { Connection, PublicKey } from '@solana/web3.js';
import { config } from '../config';

/**
 * @interface TradingDataOptions
 * @description 交易数据Hook选项接口
 */
interface TradingDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  maxRetries?: number;
  retryDelay?: number;
  minInterval?: number;
  userActionMinInterval?: number;
  [key: string]: any;
}

/**
 * @interface RetryState
 * @description 重试状态接口
 */
interface RetryState {
  count: number;
  isBlocked: boolean;
  lastErrorTime: number | null;
  lastRequestTime: number | null;
}

/**
 * @interface TradingDataResult
 * @description 交易数据Hook返回结果接口
 */
interface TradingDataResult {
  downOrders11: any;
  upOrders11: any;
  downOrders1000: any;
  upOrders1000: any;
  lastPrice: any;
  solBalance: number;
  balanceLoading: boolean;
  balanceError: Error | null;
  tokenBalance: number;
  tokenBalanceLoading: boolean;
  tokenBalanceError: Error | null;
  mintInfo: any;
  mintInfoLoading: boolean;
  mintInfoError: Error | null;
  walletAddress?: string;
  walletConnected: boolean;
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  retryCount: number;
  isBlocked: boolean;
  canRetry: boolean;
  refreshData: () => void;
  forceRefresh: () => void;
  forceRefreshWithBalance: () => void;
  userActionRefresh: () => void;
  clearRefreshTimer: () => void;
  fetchSolBalance: (walletAddr: string) => Promise<void>;
  fetchTokenBalance: (walletAddr: string, mintAddr: string) => Promise<void>;
  fetchMintInfo: (mintAddr: string) => Promise<any>;
  hasData: boolean;
  isDataStale: boolean;
  sdkReady: boolean;
  sdkError: boolean;
  debugInfo: any;
  // 添加缺少的属性
  _refreshData?: () => void;
  _lastUpdated?: Date | null;
  _sdkReady?: boolean;
  _balanceLoading?: boolean;
  _fetchSolBalance?: (walletAddr: string) => Promise<void>;
  _tokenBalanceLoading?: boolean;
  _fetchTokenBalance?: (walletAddr: string, mintAddr: string) => Promise<void>;
  _walletAddress?: string;
}

/**
 * @hook useTradingData
 * @description 交易数据管理Hook，统一管理交易相关的订单数据和价格数据
 * @param {string | undefined} mintAddress - 代币地址
 * @param {TradingDataOptions} options - 配置选项
 * @returns {TradingDataResult} 交易数据Hook结果
 */
export const useTradingData = (mintAddress?: string, options: TradingDataOptions = {}): TradingDataResult => {
  const { sdk, isReady, isError, error: sdkContextError } = usePinPetSdk();
  const { walletAddress, connected } = useWalletContext();

  // 数据状态
  const [downOrders11, setDownOrders11] = useState<any>(null);
  const [upOrders11, setUpOrders11] = useState<any>(null);
  const [downOrders1000, setDownOrders1000] = useState<any>(null);
  const [upOrders1000, setUpOrders1000] = useState<any>(null);
  const [lastPrice, setLastPrice] = useState<any>(null);

  // SOL 余额状态
  const [solBalance, setSolBalance] = useState<number>(0);
  const [balanceLoading, setBalanceLoading] = useState<boolean>(false);
  const [balanceError, setBalanceError] = useState<Error | null>(null);

  // Token 余额状态
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [tokenBalanceLoading, setTokenBalanceLoading] = useState<boolean>(false);
  const [tokenBalanceError, setTokenBalanceError] = useState<Error | null>(null);

  // Mint 信息状态
  const [mintInfo, setMintInfo] = useState<any>(null);
  const [mintInfoLoading, setMintInfoLoading] = useState<boolean>(false);
  const [mintInfoError, setMintInfoError] = useState<Error | null>(null);

  // 加载和错误状态
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // 错误重试状态 - 使用 useRef 避免依赖循环
  const retryState = useRef<RetryState>({
    count: 0,
    isBlocked: false,
    lastErrorTime: null,
    lastRequestTime: null // 添加最后请求时间
  });

  // UI 状态（用于显示）
  const [uiRetryCount, setUiRetryCount] = useState<number>(0);
  const [uiIsBlocked, setUiIsBlocked] = useState<boolean>(false);

  // 自动刷新配置
  const {
    autoRefresh = false,
    refreshInterval = 30000, // 30秒刷新一次
    maxRetries = 10, // 最大重试次数
    retryDelay = 60000, // 错误后等待60秒
    minInterval = 10000, // 最小请求间隔10秒（非用户操作）
    userActionMinInterval = 400, // 用户操作时的最小间隔400ms
    ...otherOptions
  } = options;

  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 获取 SOL 余额
  const fetchSolBalance = useCallback(async (walletAddr: string): Promise<void> => {
    if (!walletAddr || !config.solana.rpcUrl) {
      console.log('[TradingData] No wallet address or RPC URL for balance fetch');
      setSolBalance(0);
      return;
    }

    try {
      setBalanceLoading(true);
      setBalanceError(null);

      console.log(`[TradingData] Fetching SOL balance for wallet: ${walletAddr}`);

      const connection = new Connection(config.solana.rpcUrl, 'confirmed');
      const publicKey = new PublicKey(walletAddr);
      const balance = await connection.getBalance(publicKey);

      // 转换为 SOL（1 SOL = 10^9 lamports）
      const solAmount = balance / 1000000000;

      console.log(`[TradingData] SOL balance: ${solAmount} SOL (${balance} lamports)`);
      setSolBalance(solAmount);

    } catch (err) {
      console.error('获取 SOL 余额失败:', err);
      setBalanceError(err as Error);
      setSolBalance(0);
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  // 获取 Token 余额
  const fetchTokenBalance = useCallback(async (walletAddr: string, mintAddr: string): Promise<void> => {
    if (!walletAddr || !mintAddr || !config.solana.rpcUrl) {
      console.log('[TradingData] No wallet address, mint address or RPC URL for token balance fetch');
      setTokenBalance(0);
      return;
    }

    try {
      setTokenBalanceLoading(true);
      setTokenBalanceError(null);

      console.log(`[TradingData] Fetching token balance for wallet: ${walletAddr}, mint: ${mintAddr}`);

      const connection = new Connection(config.solana.rpcUrl, 'confirmed');
      const ownerPublicKey = new PublicKey(walletAddr);
      const mintPublicKey = new PublicKey(mintAddr);

      // 获取该钱包地址的所有 token 账户
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        ownerPublicKey,
        { mint: mintPublicKey }
      );

      if (tokenAccounts.value.length === 0) {
        console.log(`[TradingData] No token accounts found for mint: ${mintAddr}`);
        setTokenBalance(0);
        return;
      }

      // 计算总余额（可能有多个 token 账户）
      let totalBalance = 0;
      for (const account of tokenAccounts.value) {
        const accountData = account.account.data.parsed;
        const balance = accountData.info.tokenAmount.uiAmount || 0;
        totalBalance += balance;
        console.log(`[TradingData] Token account ${account.pubkey.toString()}: ${balance}`);
      }

      console.log(`[TradingData] Total token balance: ${totalBalance}`);
      setTokenBalance(totalBalance);

    } catch (err) {
      console.error('获取 Token 余额失败:', err);
      setTokenBalanceError(err as Error);
      setTokenBalance(0);
    } finally {
      setTokenBalanceLoading(false);
    }
  }, []);

  // 获取 Mint 信息
  const fetchMintInfo = useCallback(async (mintAddr: string): Promise<any> => {
    if (!mintAddr || !config.pinpetApiUrl) {
      console.log('[TradingData] No mint address or API URL for mint info fetch');
      setMintInfo(null);
      return Promise.resolve(null);
    }

    try {
      setMintInfoLoading(true);
      setMintInfoError(null);

      console.log(`[TradingData] Fetching mint info for mint: ${mintAddr}`);

      const response = await fetch(`${config.pinpetApiUrl}/api/details`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mints: [mintAddr]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data && result.data.details && result.data.details.length > 0) {
        const mintData = result.data.details[0];
        console.log(`[TradingData] Mint info fetched successfully:`, mintData);
        setMintInfo(mintData);
        return mintData;
      } else {
        console.warn(`[TradingData] No mint info found for: ${mintAddr}`);
        setMintInfo(null);
        return null;
      }

    } catch (err) {
      console.error('获取 Mint 信息失败:', err);
      setMintInfoError(err as Error);
      setMintInfo(null);
      return Promise.reject(err);
    } finally {
      setMintInfoLoading(false);
    }
  }, []);

  // 检查是否应该跳过请求（因为错误太多或太频繁）
  const shouldSkipRequest = useCallback((force: boolean = false, isUserAction: boolean = false): boolean => {
    // 如果是强制刷新，跳过所有检查
    if (force) {
      console.log('[TradingData] Force refresh: skipping all limitations');
      return false;
    }

    const { isBlocked, lastErrorTime, lastRequestTime } = retryState.current;
    const now = Date.now();

    // 如果已被阻止，不发送请求
    if (isBlocked) {
      console.log('[TradingData] Skipping request: blocked due to max retries');
      return true;
    }

    // 根据是否为用户操作选择不同的最小间隔
    const effectiveMinInterval = isUserAction ? userActionMinInterval : minInterval;

    // 检查最小请求间隔（不管成功还是失败）
    if (lastRequestTime && now - lastRequestTime < effectiveMinInterval) {
      const waitTime = Math.ceil((effectiveMinInterval - (now - lastRequestTime)) / 1000);
      console.log(`[TradingData] Skipping request: minimum interval (${isUserAction ? 'user' : 'auto'}) not reached, waiting ${waitTime}s`);
      return true;
    }

    // 如果刚发生错误且还没到重试时间，跳过请求
    if (lastErrorTime && now - lastErrorTime < retryDelay) {
      const waitTime = Math.ceil((retryDelay - (now - lastErrorTime)) / 1000);
      console.log(`[TradingData] Skipping request: waiting ${waitTime}s before retry after error`);
      return true;
    }

    return false;
  }, [retryDelay, minInterval, userActionMinInterval]);

  // 获取所有交易数据
  const fetchTradingData = useCallback(async (mint: string, force: boolean = false, isUserAction: boolean = false): Promise<void> => {
    console.log('[TradingData] fetchTradingData called with:', {
      mint,
      force,
      isUserAction,
      isReady,
      hasSdk: !!sdk,
      shouldSkip: shouldSkipRequest(force, isUserAction)
    });

    if (!mint) {
      console.log('[TradingData] No mint address provided');
      setDownOrders11(null);
      setUpOrders11(null);
      setDownOrders1000(null);
      setUpOrders1000(null);
      setLastPrice(null);
      setMintInfo(null);
      return;
    }

    if (!isReady) {
      console.log('[TradingData] SDK not ready');
      setDownOrders11(null);
      setUpOrders11(null);
      setDownOrders1000(null);
      setUpOrders1000(null);
      setLastPrice(null);
      setMintInfo(null);
      return;
    }

    if (!sdk) {
      console.log('[TradingData] SDK not available');
      setDownOrders11(null);
      setUpOrders11(null);
      setDownOrders1000(null);
      setUpOrders1000(null);
      setLastPrice(null);
      setMintInfo(null);
      return;
    }

    if (shouldSkipRequest(force, isUserAction)) {
      console.log('[TradingData] Request skipped due to rate limiting');
      return;
    }

    // 如果是强制刷新，重置错误状态
    if (force) {
      console.log('[TradingData] Force refresh: resetting error state');
      retryState.current.count = 0;
      retryState.current.isBlocked = false;
      retryState.current.lastErrorTime = null;
      setUiRetryCount(0);
      setUiIsBlocked(false);
      setError(null);
    }

    try {
      setLoading(true);
      setError(null);

      // 记录请求开始时间
      retryState.current.lastRequestTime = Date.now();

      console.log(`[TradingData] Fetching data for mint: ${mint}, retry count: ${retryState.current.count}, force: ${force}, userAction: ${isUserAction}`);

      // 并发请求所有数据
      const [downOrdersResult, upOrdersResult, priceResult, mintInfoResult] = await Promise.allSettled([
        sdk.data.orders(mint, { 
          type: 'down_orders', 
          page: 1, 
          limit: 1000,
          ...otherOptions 
        }),
        sdk.data.orders(mint, { 
          type: 'up_orders', 
          page: 1, 
          limit: 1000,
          ...otherOptions 
        }),
        sdk.data.price(mint, otherOptions),
        fetchMintInfo(mint)
      ]);

      // 处理 down_orders 结果
      if (downOrdersResult.status === 'fulfilled') {
        console.log('[TradingData] downOrdersResult:', downOrdersResult.value);
        const fullData = downOrdersResult.value;
        setDownOrders1000(fullData); // 全部1000个数据
        
        // 提取前11个数据
        if (fullData && Array.isArray(fullData.data)) {
          const first11 = { ...fullData, data: fullData.data.slice(0, 11) };
          setDownOrders11(first11);
        } else {
          setDownOrders11(fullData);
        }
      } else {
        console.error('获取 down_orders 失败:', downOrdersResult.reason);
      }

      // 处理 up_orders 结果
      if (upOrdersResult.status === 'fulfilled') {
        console.log('[TradingData] upOrdersResult:', upOrdersResult.value);
        const fullData = upOrdersResult.value;
        setUpOrders1000(fullData); // 全部1000个数据
        
        // 提取前11个数据
        if (fullData && Array.isArray(fullData.data)) {
          const first11 = { ...fullData, data: fullData.data.slice(0, 11) };
          setUpOrders11(first11);
        } else {
          setUpOrders11(fullData);
        }
      } else {
        console.error('获取 up_orders 失败:', upOrdersResult.reason);
      }

      // 处理价格结果
      if (priceResult.status === 'fulfilled') {
        console.log('[TradingData] priceResult:', priceResult.value);
        setLastPrice(priceResult.value);
      } else {
        console.error('获取价格失败:', priceResult.reason);
      }

      // 处理 mintInfo 结果
      if (mintInfoResult.status === 'fulfilled') {
        console.log('[TradingData] mintInfoResult:', mintInfoResult.value);
        // mintInfo 已经在 fetchMintInfo 中设置了，这里不需要重复设置
      } else {
        console.error('获取 mintInfo 失败:', mintInfoResult.reason);
      }

      // 检查是否有任何请求失败
      const failedRequests = [downOrdersResult, upOrdersResult, priceResult, mintInfoResult]
        .filter(result => result.status === 'rejected');

      if (failedRequests.length > 0) {
        const errorMessage = failedRequests.map((req: any) => req.reason?.message || 'Network error').join(', ');
        const newError = new Error(`Data fetch failed: ${errorMessage}`);

        // 增加重试计数
        retryState.current.count += 1;
        retryState.current.lastErrorTime = Date.now();

        // 更新UI状态
        setUiRetryCount(retryState.current.count);

        // 检查是否超过最大重试次数
        if (retryState.current.count >= maxRetries) {
          retryState.current.isBlocked = true;
          setUiIsBlocked(true);
          console.error(`[TradingData] Max retries (${maxRetries}) reached. Stopping requests.`);
          newError.message = `Max retries reached. Requests stopped after ${maxRetries} failures.`;
        } else {
          console.warn(`[TradingData] Request failed (${retryState.current.count}/${maxRetries}). Will retry in ${retryDelay/1000}s`);
        }

        setError(newError);
      } else {
        // 请求成功，重置错误计数
        retryState.current.count = 0;
        retryState.current.lastErrorTime = null;
        retryState.current.isBlocked = false;

        // 更新UI状态
        setUiRetryCount(0);
        setUiIsBlocked(false);
        setLastUpdated(new Date());
        console.log(`[TradingData] Data fetched successfully`);
      }

    } catch (err) {
      console.error('获取交易数据失败:', err);

      // 增加重试计数
      retryState.current.count += 1;
      retryState.current.lastErrorTime = Date.now();

      // 更新UI状态
      setUiRetryCount(retryState.current.count);

      if (retryState.current.count >= maxRetries) {
        retryState.current.isBlocked = true;
        setUiIsBlocked(true);
        (err as Error).message = `Max retries reached. Requests stopped after ${maxRetries} failures.`;
        console.error(`[TradingData] Max retries (${maxRetries}) reached. Stopping requests.`);
      }

      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [sdk, isReady, otherOptions, shouldSkipRequest, maxRetries, retryDelay, fetchMintInfo]);

  // 手动刷新数据
  const refreshData = useCallback((): void => {
    if (mintAddress) {
      fetchTradingData(mintAddress);
    }
  }, [mintAddress, fetchTradingData]);

  // 强制刷新数据（跳过所有限制）
  const forceRefresh = useCallback((): void => {
    if (mintAddress) {
      console.log('[TradingData] Force refresh triggered for mint:', mintAddress);
      fetchTradingData(mintAddress, true, false);
    }
  }, [mintAddress, fetchTradingData]);

  // 强制刷新数据和余额（交易后使用）
  const forceRefreshWithBalance = useCallback((): void => {
    if (mintAddress) {
      console.log('[TradingData] Force refresh with balance triggered for mint:', mintAddress);
      // 强制刷新交易数据
      fetchTradingData(mintAddress, true, false);

      // 强制刷新余额数据
      if (connected && walletAddress) {
        console.log('[TradingData] Force refreshing balances for wallet:', walletAddress);
        fetchSolBalance(walletAddress);
        fetchTokenBalance(walletAddress, mintAddress);
      }
    }
  }, [mintAddress, fetchTradingData, connected, walletAddress, fetchSolBalance, fetchTokenBalance]);

  // 用户操作触发的快速刷新（400ms间隔）
  const userActionRefresh = useCallback((): void => {
    if (mintAddress) {
      console.log('[TradingData] User action refresh triggered for mint:', mintAddress);
      fetchTradingData(mintAddress, false, true); // 不强制，但标记为用户操作

      // 同时刷新余额
      if (connected && walletAddress) {
        fetchSolBalance(walletAddress);
        fetchTokenBalance(walletAddress, mintAddress);
      }
    }
  }, [mintAddress, fetchTradingData, connected, walletAddress, fetchSolBalance, fetchTokenBalance]);

  // 清理自动刷新定时器
  const clearRefreshTimer = useCallback((): void => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  // 设置自动刷新
  const setupAutoRefresh = useCallback((): void => {
    if (autoRefresh && mintAddress && refreshInterval > 0) {
      clearRefreshTimer();
      refreshTimerRef.current = setInterval(() => {
        fetchTradingData(mintAddress, false); // 自动刷新不强制
      }, refreshInterval);
    }
  }, [autoRefresh, mintAddress, refreshInterval, fetchTradingData, clearRefreshTimer]);

  // 监听 mintAddress 变化
  useEffect(() => {
    // 如果mintAddress改变了，重置状态但仍要遵守间隔
    console.log('[TradingData] useEffect triggered with mintAddress:', mintAddress);
    if (mintAddress) {
      fetchTradingData(mintAddress, false); // 正常刷新不强制
    }
  }, [mintAddress, fetchTradingData]);

  // 监听钱包地址变化，获取 SOL 余额和 Token 余额
  useEffect(() => {
    console.log('[TradingData] Wallet state changed:', { walletAddress, connected, mintAddress });
    if (connected && walletAddress) {
      fetchSolBalance(walletAddress);
      if (mintAddress) {
        fetchTokenBalance(walletAddress, mintAddress);
      }
    } else {
      setSolBalance(0);
      setBalanceError(null);
      setTokenBalance(0);
      setTokenBalanceError(null);
    }
  }, [connected, walletAddress, mintAddress, fetchSolBalance, fetchTokenBalance]);

  // 监听自动刷新配置变化
  useEffect(() => {
    setupAutoRefresh();
    return clearRefreshTimer;
  }, [setupAutoRefresh, clearRefreshTimer]);

  // 组件卸载时清理定时器
  useEffect(() => {
    return clearRefreshTimer;
  }, [clearRefreshTimer]);


  return {
    // 核心数据
    downOrders11,
    upOrders11,
    downOrders1000,
    upOrders1000,
    lastPrice,
    
    // SOL 余额数据
    solBalance,
    balanceLoading,
    balanceError,
    
    // Token 余额数据
    tokenBalance,
    tokenBalanceLoading,
    tokenBalanceError,
    
    // Mint 信息数据
    mintInfo,
    mintInfoLoading,
    mintInfoError,
    
    // 钱包状态
    walletAddress,
    walletConnected: connected,
    
    // 状态
    loading: loading || !isReady,
    error: error || sdkContextError,
    lastUpdated,
    
    // 错误重试状态
    retryCount: uiRetryCount,
    isBlocked: uiIsBlocked,
    canRetry: !retryState.current.isBlocked && (!retryState.current.lastErrorTime || Date.now() - retryState.current.lastErrorTime >= retryDelay),
    
    // 工具方法
    refreshData,
    forceRefresh,
    forceRefreshWithBalance,
    userActionRefresh, // 新增：用户操作刷新
    clearRefreshTimer,
    fetchSolBalance,
    fetchTokenBalance,
    fetchMintInfo,
    
    // 便捷状态检查
    hasData: !!(downOrders11 || upOrders11 || downOrders1000 || upOrders1000 || lastPrice || mintInfo),
    isDataStale: lastUpdated && (Date.now() - lastUpdated.getTime()) > refreshInterval * 2,
    
    // SDK 状态
    sdkReady: isReady,
    sdkError: isError,
    
    // 调试信息
    debugInfo: {
      mintAddress,
      autoRefresh,
      refreshInterval,
      hasTimer: !!refreshTimerRef.current,
      sdkReady: isReady,
      sdkError: isError,
      retryCount: retryState.current.count,
      isBlocked: retryState.current.isBlocked,
      lastErrorTime: retryState.current.lastErrorTime,
      lastRequestTime: retryState.current.lastRequestTime,
      maxRetries,
      minInterval
    }
  };
};

export default useTradingData;