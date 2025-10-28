import { useState, useCallback } from 'react';
import { useSpinPetSdkReady } from '../contexts/SpinPetSdkContext';

/**
 * 模拟器相关的 Hook
 * 封装 SDK 的 simulator 模块方法
 */
export const useSpinPetSimulator = () => {
  const { sdk } = useSpinPetSdkReady();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 通用模拟处理
  const handleSimulation = useCallback(async (simulationFn) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await simulationFn();
      return result;
    } catch (err) {
      console.error('SpinPetSimulator 模拟失败:', err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 模拟代币买入
  const simulateTokenBuy = useCallback(async (mint, buyTokenAmount, passOrder = null) => {
    return handleSimulation(async () => {
      return await sdk.simulator.simulateTokenBuy(mint, buyTokenAmount, passOrder);
    });
  }, [sdk, handleSimulation]);

  // 模拟代币卖出
  const simulateTokenSell = useCallback(async (mint, sellTokenAmount, passOrder = null) => {
    return handleSimulation(async () => {
      return await sdk.simulator.simulateTokenSell(mint, sellTokenAmount, passOrder);
    });
  }, [sdk, handleSimulation]);

  // 模拟做多止损
  const simulateLongStopLoss = useCallback(async (mint, buyTokenAmount, stopLossPrice, mintInfo = null, ordersData = null) => {
    return handleSimulation(async () => {
      return await sdk.simulator.simulateLongStopLoss(mint, buyTokenAmount, stopLossPrice, mintInfo, ordersData);
    });
  }, [sdk, handleSimulation]);

  // 模拟做空止损
  const simulateSellStopLoss = useCallback(async (mint, sellTokenAmount, stopLossPrice, mintInfo = null, ordersData = null) => {
    return handleSimulation(async () => {
      return await sdk.simulator.simulateSellStopLoss(mint, sellTokenAmount, stopLossPrice, mintInfo, ordersData);
    });
  }, [sdk, handleSimulation]);

  // 批量模拟（便捷方法）
  const batchSimulate = useCallback(async (simulations) => {
    setLoading(true);
    setError(null);

    try {
      const results = await Promise.allSettled(simulations.map(sim => sim()));
      
      const successResults = [];
      const errorResults = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successResults.push({ index, data: result.value });
        } else {
          errorResults.push({ index, error: result.reason });
        }
      });

      return {
        success: successResults,
        errors: errorResults,
        total: simulations.length,
        successCount: successResults.length,
        errorCount: errorResults.length
      };

    } catch (err) {
      console.error('批量模拟失败:', err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 分析买卖完整度
  const analyzeTradeCompletion = useCallback((simulationResult) => {
    const completion = parseFloat(simulationResult.completion);
    const slippage = parseFloat(simulationResult.slippage);

    return {
      canFullyComplete: completion === 100.0,
      completionPercentage: completion,
      slippagePercentage: slippage,
      isHighSlippage: slippage > 5.0,
      suggestedTokenAmount: simulationResult.suggestedTokenAmount,
      suggestedSolAmount: simulationResult.suggestedSolAmount,
      analysis: {
        liquidity: completion > 95 ? 'excellent' : completion > 80 ? 'good' : completion > 50 ? 'limited' : 'poor',
        slippageRisk: slippage < 1 ? 'low' : slippage < 3 ? 'medium' : slippage < 5 ? 'high' : 'very_high',
        recommendation: completion === 100 && slippage < 3 ? 'proceed' : completion > 80 ? 'proceed_with_caution' : 'consider_smaller_amount'
      }
    };
  }, []);

  // 格式化模拟结果
  const formatSimulationResult = useCallback((result, tokenDecimals = 6, solDecimals = 9) => {
    return {
      ...result,
      formatted: {
        completion: `${result.completion}%`,
        slippage: `${result.slippage}%`,
        suggestedTokenAmount: `${(Number(result.suggestedTokenAmount) / Math.pow(10, tokenDecimals)).toFixed(2)} tokens`,
        suggestedSolAmount: `${(Number(result.suggestedSolAmount) / Math.pow(10, solDecimals)).toFixed(4)} SOL`,
        liqResult: {
          freeTokenAmount: (Number(result.liqResult.free_lp_token_amount_sum) / Math.pow(10, tokenDecimals)).toFixed(2),
          freeSolAmount: (Number(result.liqResult.free_lp_sol_amount_sum) / Math.pow(10, solDecimals)).toFixed(4),
          lockTokenAmount: (Number(result.liqResult.lock_lp_token_amount_sum) / Math.pow(10, tokenDecimals)).toFixed(2),
          lockSolAmount: (Number(result.liqResult.lock_lp_sol_amount_sum) / Math.pow(10, solDecimals)).toFixed(4),
          idealSolAmount: (Number(result.liqResult.ideal_lp_sol_amount) / Math.pow(10, solDecimals)).toFixed(4),
          realSolAmount: (Number(result.liqResult.real_lp_sol_amount) / Math.pow(10, solDecimals)).toFixed(4)
        }
      }
    };
  }, []);

  return {
    // 状态
    loading,
    error,

    // 模拟方法
    simulateTokenBuy,
    simulateTokenSell,
    simulateLongStopLoss,
    simulateSellStopLoss,

    // 批量和分析方法
    batchSimulate,
    analyzeTradeCompletion,
    formatSimulationResult,

    // 工具方法
    clearError: () => setError(null)
  };
};