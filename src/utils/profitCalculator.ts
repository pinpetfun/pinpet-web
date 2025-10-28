/**
 * 盈亏百分比计算工具
 * 用于计算 Long 和 Short 仓位的盈亏百分比
 * 使用 decimal.js 进行高精度计算，支持28位精度的价格数据
 */

import Decimal from 'decimal.js';

/**
 * 计算 Long 仓位的盈亏百分比和净收益
 * @param {Object} sdk - SDK 实例，需要包含 curve 模块
 * @param {Object} position - 仓位数据
 * @param {number} position.latest_price - 当前价格 (28位精度整数)
 * @param {number} position.lock_lp_start_price - 锁定开始价格 (28位精度整数)
 * @param {number} position.lock_lp_token_amount - 锁定的代币数量 (6位精度整数)
 * @param {number} position.margin_sol_amount - 保证金 (9位精度整数，lamports)
 * @param {number} position.borrow_amount - 借款金额 (9位精度整数，lamports)
 * @returns {Object|null} {grossProfit: 毛利收益sol, netProfit: 净收益sol, profitPercentage: 盈亏百分比, stopLossPercentage: 止损位百分比}，失败返回 null
 */
export const calculateLongProfitPercentage = (sdk, position) => {
  try {
    if (!sdk || !sdk.curve || !position) {
      console.warn('[profitCalculator] Missing SDK, curve, or position data');
      return null;
    }

    const {
      latest_price,
      lock_lp_start_price,
      lock_lp_token_amount,
      margin_sol_amount,
      borrow_amount,
      realized_sol_amount,
      mint
    } = position;

    // 验证必要数据
    if (!latest_price || !lock_lp_start_price || !lock_lp_token_amount || !margin_sol_amount || borrow_amount === undefined || !mint) {
      console.warn('[profitCalculator] Missing required fields for Long calculation');
      return null;
    }

    // 打印原始数据以便调试
    console.log('[profitCalculator] Long raw data:', {
      latest_price,
      lock_lp_start_price,
      lock_lp_token_amount,
      margin_sol_amount,
      borrow_amount,
      realized_sol_amount
    });

    try {
      // 使用 Decimal.js 进行高精度计算
      // latest_price: 28位精度的整数
      // lock_lp_token_amount: 6位精度的整数
      // margin_sol_amount: 9位精度的整数 (lamports)
      // borrow_amount: 9位精度的整数 (lamports)
      
      const price = new Decimal(latest_price.toString());
      const startPrice = new Decimal(lock_lp_start_price.toString());
      const tokenAmount = new Decimal(lock_lp_token_amount.toString());
      const marginSol = new Decimal(margin_sol_amount.toString());
      const borrowSol = new Decimal(borrow_amount.toString());
      const realizedSol = realized_sol_amount ? new Decimal(realized_sol_amount.toString()) : new Decimal(0);

      console.log('[profitCalculator] Long Decimal values:', {
        price: price.toString(),
        startPrice: startPrice.toString(),
        tokenAmount: tokenAmount.toString(),
        marginSol: marginSol.toString(),
        borrowSol: borrowSol.toString(),
        realizedSol: realizedSol.toString()
      });

      // 数据有效性检查
      if (marginSol.lte(0) || tokenAmount.lte(0) || startPrice.lte(0)) {
        console.warn('[profitCalculator] Invalid margin, token amount, or start price');
        return null;
      }

      // Long 仓位计算逻辑：
      // 1. 用 sdk.curve.sellFromPriceWithTokenInput(latest_price, lock_lp_token_amount) 得到: 平仓当前收入sol
      console.log('[profitCalculator] Calling sdk.curve.sellFromPriceWithTokenInput with:', {
        latest_price: latest_price,
        lock_lp_token_amount: lock_lp_token_amount
      });
      
      const sellResult = sdk.curve.sellFromPriceWithTokenInput(latest_price, lock_lp_token_amount);
      
      if (!sellResult) {
        console.error('[profitCalculator] sdk.curve.sellFromPriceWithTokenInput returned null');
        return null;
      }

      console.log('[profitCalculator] sellFromPriceWithTokenInput result:', sellResult);
      
      // sellResult 可能是一个数组 [price, solAmount] 或者单个值
      let currentSellIncomeSol;
      if (Array.isArray(sellResult)) {
        currentSellIncomeSol = new Decimal(sellResult[1].toString()); // 取 SOL 数量
      } else {
        currentSellIncomeSol = new Decimal(sellResult.toString());
      }

      console.log('[profitCalculator] Current sell income SOL:', currentSellIncomeSol.toString());

      // 2. 毛利收益sol  
      const grossProfitSol = currentSellIncomeSol.plus(marginSol).minus(borrowSol);

      // 3. 净收益sol  
      const netProfitSol = grossProfitSol.minus(marginSol).plus(realizedSol);

      // 4. 用 (净收益sol / margin_sol_amount(保证金)) * 100.0 = 盈亏百分比
      const profitPercentage = netProfitSol.div(marginSol).mul(100);

      // 5. 计算止损位百分比: (latest_price - lock_lp_start_price) / lock_lp_start_price * 100
      const stopLossPercentage = price.minus(startPrice).div(startPrice).mul(100);

      console.log('[profitCalculator] Long calculation steps:', {
        currentSellIncomeSol: currentSellIncomeSol.toString(),
        grossProfitSol: grossProfitSol.toString(),
        netProfitSol: netProfitSol.toString(),
        profitPercentage: profitPercentage.toString(),
        stopLossPercentage: stopLossPercentage.toString(),
        realizedSol: realizedSol.toString()
      });

      // 返回4个值：毛利收益sol、净收益sol、盈亏百分比 和 止损位百分比, 已实现收益sol
      return {
        grossProfit: grossProfitSol.toNumber(),
        netProfit: netProfitSol.toNumber(),
        profitPercentage: profitPercentage.toNumber(),
        stopLossPercentage: parseFloat(stopLossPercentage.toFixed(1)),
        realizedSol: realizedSol.toNumber()
      };

    } catch (calculationError) {
      console.error('[profitCalculator] Long calculation error:', calculationError);
      return null;
    }

  } catch (error) {
    console.error('[profitCalculator] Long profit calculation error:', error);
    return null;
  }
};

/**
 * 计算 Short 仓位的盈亏百分比和净收益
 * @param {Object} sdk - SDK 实例，需要包含 curve 模块
 * @param {Object} position - 仓位数据
 * @param {number} position.latest_price - 当前价格 (28位精度整数)
 * @param {number} position.lock_lp_start_price - 锁定开始价格 (28位精度整数)
 * @param {number} position.lock_lp_token_amount - 锁定的代币数量 (6位精度整数)
 * @param {number} position.margin_sol_amount - 保证金 (9位精度整数，lamports)
 * @returns {Object|null} {grossProfit: 毛利收益sol, netProfit: 净收益sol, profitPercentage: 盈亏百分比, stopLossPercentage: 止损位百分比}，失败返回 null
 */
export const calculateShortProfitPercentage = (sdk, position) => {
  try {
    if (!sdk || !sdk.curve || !position) {
      console.warn('[profitCalculator] Missing SDK, curve, or position data');
      return null;
    }

    const {
      latest_price,
      lock_lp_start_price,
      lock_lp_token_amount,
      margin_sol_amount,
      realized_sol_amount,
      margin_init_sol_amount,
      mint
    } = position;

    // 验证必要数据
    if (!latest_price || !lock_lp_start_price || !lock_lp_token_amount || !margin_sol_amount || !mint) {
      console.warn('[profitCalculator] Missing required fields for Short calculation');
      return null;
    }

    // 打印原始数据以便调试
    console.log('[profitCalculator] Short raw data:', {
      latest_price,
      lock_lp_start_price,
      lock_lp_token_amount,
      margin_sol_amount,
      realized_sol_amount,
      margin_init_sol_amount
    });

    try {
      // 使用 Decimal.js 进行高精度计算
      // latest_price: 28位精度的整数
      // lock_lp_start_price: 28位精度的整数
      // lock_lp_token_amount: 6位精度的整数
      // margin_sol_amount: 9位精度的整数 (lamports)
      
      const currentPrice = new Decimal(latest_price.toString());
      const startPrice = new Decimal(lock_lp_start_price.toString());
      const tokenAmount = new Decimal(lock_lp_token_amount.toString());
      const marginSol = new Decimal(margin_sol_amount.toString());
      const marginInitSol = new Decimal(margin_init_sol_amount.toString());
      const realizedSol = realized_sol_amount ? new Decimal(realized_sol_amount.toString()) : new Decimal(0);

      console.log('[profitCalculator] Short Decimal values:', {
        currentPrice: currentPrice.toString(),
        startPrice: startPrice.toString(),
        tokenAmount: tokenAmount.toString(),
        marginSol: marginSol.toString(),
        realizedSol: realizedSol.toString()
      });

      // 数据有效性检查
      if (marginSol.lte(0) || tokenAmount.lte(0)) {
        console.warn('[profitCalculator] Invalid margin or token amount for Short');
        return null;
      }

      // Short 仓位计算逻辑：
      // 价格对比分析
      console.log('[profitCalculator]1 Short price analysis:', {
        开仓价格_lock_lp_start_price: startPrice.toString(),
        当前价格_latest_price: currentPrice.toString(),
        价格变化: startPrice.gt(currentPrice) ? '价格下跌（Short盈利）' : '价格上涨（Short亏损）',
        价格差值: startPrice.minus(currentPrice).toString()
      });
      
      // 1. 用 sdk.curve.buyFromPriceWithTokenOutput(latest_price, lock_lp_token_amount) 得到: 平仓需要付出的sol
      console.log('[profitCalculator] Calling sdk.curve.buyFromPriceWithTokenOutput for current price with:', {
        latest_price: latest_price,
        lock_lp_token_amount: lock_lp_token_amount
      });
      
      const currentBuyResult = sdk.curve.buyFromPriceWithTokenOutput(latest_price, lock_lp_token_amount);
      
      if (!currentBuyResult) {
        console.error('[profitCalculator] sdk.curve.buyFromPriceWithTokenOutput (current price) returned null');
        return null;
      }

      console.log('[profitCalculator]1 A buyFromPriceWithTokenOutput (current price) result:', currentBuyResult);

      // 2. 用 sdk.curve.buyFromPriceWithTokenOutput(lock_lp_start_price, lock_lp_token_amount) 得到: 解除锁定得到的sol
      console.log('[profitCalculator] Calling sdk.curve.buyFromPriceWithTokenOutput for start price with:', {
        lock_lp_start_price: lock_lp_start_price,
        lock_lp_token_amount: lock_lp_token_amount
      });
      
      const unlockBuyResult = sdk.curve.buyFromPriceWithTokenOutput(lock_lp_start_price, lock_lp_token_amount);
      
      if (!unlockBuyResult) {
        console.error('[profitCalculator] sdk.curve.buyFromPriceWithTokenOutput (start price) returned null');
        return null;
      }

      console.log('[profitCalculator]1 B buyFromPriceWithTokenOutput (start price) result:', unlockBuyResult);
      
      // 处理返回值格式 - 可能是数组 [price, solAmount] 或者单个值
      let currentBuyCostSol;
      if (Array.isArray(currentBuyResult)) {
        currentBuyCostSol = new Decimal(currentBuyResult[1].toString()); // 取 SOL 数量
      } else {
        currentBuyCostSol = new Decimal(currentBuyResult.toString());
      }

      let unlockSol;
      if (Array.isArray(unlockBuyResult)) {
        unlockSol = new Decimal(unlockBuyResult[1].toString()); // 取 SOL 数量
      } else {
        unlockSol = new Decimal(unlockBuyResult.toString());
      }

      console.log('[profitCalculator] Processed SOL amounts:', {
        currentBuyCostSol: currentBuyCostSol.toString(),
        unlockSol: unlockSol.toString()
      });

      // 3. 毛利收益sol 
      const grossProfitSol = unlockSol.minus(currentBuyCostSol);

      // 4. 净收益sol
      const netProfitSol = grossProfitSol.minus(marginInitSol);

      // 5. 用 (总收益sol / margin_sol_amount(保证金)) * 100.0 = 盈亏百分比
      const profitPercentage =  (realizedSol.plus(netProfitSol)).div(marginInitSol).mul(100);


      // 6. 计算止损位百分比: (lock_lp_start_price - latest_price) / lock_lp_start_price * 100
      const stopLossPercentage = startPrice.minus(currentPrice).div(startPrice).mul(100);

      console.log('[profitCalculator] Short calculation steps:', {
        currentBuyCostSol: currentBuyCostSol.toString(),
        unlockSol: unlockSol.toString(),
        grossProfitSol: grossProfitSol.toString(),
        netProfitSol: netProfitSol.toString(),
        profitPercentage: profitPercentage.toString(),
        stopLossPercentage: stopLossPercentage.toString()
      });

      // 返回4个值：毛利收益sol、净收益sol、盈亏百分比 和 止损位百分比 , 已实现sol收益
      return {
        grossProfit: grossProfitSol.toNumber(),
        netProfit: netProfitSol.toNumber(),
        profitPercentage: profitPercentage.toNumber(),
        stopLossPercentage: parseFloat(stopLossPercentage.toFixed(1)),
        realizedSol: realizedSol.toNumber()
      };

    } catch (calculationError) {
      console.error('[profitCalculator] Short calculation error:', calculationError);
      return null;
    }

  } catch (error) {
    console.error('[profitCalculator] Short profit calculation error:', error);
    return null;
  }
};

/**
 * 计算仓位盈亏百分比 (统一入口)
 * @param {Object} sdk - SDK 实例
 * @param {Object} position - 仓位数据
 * @returns {number|null} 盈亏百分比，失败返回 null
 */
export const calculatePositionProfitPercentage = (sdk, position) => {
  try {
    if (!position || !position.order_type) {
      return null;
    }

    if (position.order_type === 1) {
      // Long 仓位 - 返回对象格式
      const longResult = calculateLongProfitPercentage(sdk, position);
      return longResult ? longResult.profitPercentage : null;
    } else if (position.order_type === 2) {
      // Short 仓位 - 现在也返回对象格式
      const shortResult = calculateShortProfitPercentage(sdk, position);
      return shortResult ? shortResult.profitPercentage : null;
    } else {
      console.warn('[profitCalculator] Unknown order_type:', position.order_type);
      return null;
    }
  } catch (error) {
    console.error('[profitCalculator] Position profit calculation error:', error);
    return null;
  }
};

/**
 * 格式化盈亏百分比显示
 * @param {number|null} percentage - 盈亏百分比
 * @returns {string} 格式化后的显示字符串
 */
export const formatProfitPercentage = (percentage) => {
  if (percentage === null || percentage === undefined || isNaN(percentage)) {
    return '--';
  }
  
  // 检查是否是异常值
  if (Math.abs(percentage) > 10000) {
    console.warn('[profitCalculator] Abnormal percentage value:', percentage);
    return '--';
  }
  
  // 显示1位小数，保留符号
  const formattedValue = percentage.toFixed(1);
  
  if (percentage > 0) {
    return `+${formattedValue}%`;
  } else {
    return `${formattedValue}%`;
  }
};