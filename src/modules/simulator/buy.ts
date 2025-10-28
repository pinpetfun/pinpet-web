

import { CurveAMM } from '../../utils/curve_amm';
import { convertApiOrdersFormat, absoluteValue } from './utils';

/**
 * 模拟买入交易分析 / Simulate buy transaction analysis
 * @param {string} mint - 代币地址 / Token address
 * @param {bigint|string|number} buySolAmount - 购买SOL数量 / SOL amount to buy (u64 format, precision 10^9)
 * @returns {Promise<Object>} 买入分析结果 / Buy analysis result
 */
async function simulateBuy(mint, buySolAmount) {
    // 初始化返回结果 / Initialize return result
    const result = {
        success: false,
        errorCode: null,
        errorMessage: null,
        data: null
    };

    try {
        // 参数验证 / Parameter validation
        if (!mint || typeof mint !== 'string') {
            result.errorCode = 'PARAM_ERROR';
            result.errorMessage = 'mint参数无效 / Invalid mint parameter';
            return result;
        }

        if (buySolAmount === undefined || buySolAmount === null || buySolAmount <= 0) {
            result.errorCode = 'PARAM_ERROR';
            result.errorMessage = 'buySolAmount参数无效 / Invalid buySolAmount parameter';
            return result;
        }

        // 转换buySolAmount为bigint / Convert buySolAmount to bigint
        let buyingSolAmountU64 = typeof buySolAmount === 'bigint' ? buySolAmount : BigInt(buySolAmount);

        // 获取当前价格 / Get current price
        let currentPrice;
        try {
            const mintInfo = await this.sdk.fast.mint_info(mint);
            if (!mintInfo.success || !mintInfo.data || !mintInfo.data.details || mintInfo.data.details.length === 0) {
                result.errorCode = 'API_ERROR';
                result.errorMessage = '无法获取代币信息 / Unable to get token info';
                return result;
            }

            console.log("mintInfo.data.details[0].latest_price ",mintInfo.data.details[0].latest_price)
            if (!mintInfo.data.details[0].latest_price) {
                currentPrice = CurveAMM.getInitialPrice();
            }else{
                currentPrice = BigInt(mintInfo.data.details[0].latest_price);
            }
            
        } catch (error) {
            result.errorCode = 'API_ERROR';
            result.errorMessage = `获取代币信息失败 / Failed to get token info: ${error.message}`;
            return result;
        }

        // 获取做空订单列表 / Get short order list
        let shortOrderList;
        try {
            const ordersData = await this.sdk.data.orders(mint, { type: 'up_orders' });
            if (!ordersData.success || !ordersData.data || !ordersData.data.orders) {
                result.errorCode = 'API_ERROR';
                result.errorMessage = '无法获取订单信息 / Unable to get order info';
                return result;
            }
            shortOrderList = convertApiOrdersFormat(ordersData.data.orders);
        } catch (error) {
            result.errorCode = 'API_ERROR';
            result.errorMessage = `获取订单信息失败 / Failed to get order info: ${error.message}`;
            return result;
        }

        // 处理空订单列表的情况 / Handle empty order list
        if (shortOrderList.length === 0) {
            shortOrderList.push(null);
        }

        // 计算理想情况下的基准Token数量（完全无滑点） / Calculate ideal token amount without slippage
        const idealTradeResult = CurveAMM.buyFromPriceWithSolInput(currentPrice, buyingSolAmountU64);
        const idealTokenAmount = idealTradeResult ? idealTradeResult[1] : 0n;
        const idealSolAmount = buyingSolAmountU64;

        // 初始化价格区间和流动性相关变量 / Initialize price range and liquidity variables
        let maxAllowedPrice = 0n;
        let totalPriceSpan = 0n;
        let transactionCompletionRate = 0.0;
        let totalLiquiditySolAmount = 0n;
        let totalLiquidityTokenAmount = 0n;
        let targetReachedAtSegmentIndex = -1;

        // 构建价格区间分析列表 / Build price segment analysis list
        const priceSegmentAnalysisList = new Array(shortOrderList.length);

        // 遍历订单列表并计算每个价格区间的参数 / Iterate through order list and calculate parameters for each price segment
        for (let segmentIndex = 0; segmentIndex < shortOrderList.length; segmentIndex++) {
            let segmentStartPrice, segmentEndPrice;

            // 根据区间位置确定起始和结束价格 / Determine start and end prices based on segment position
            if (segmentIndex === 0) {
                // 第一个区间：从当前价格开始 / First segment: start from current price
                segmentStartPrice = currentPrice;

                if (shortOrderList[0] === null) {
                    // 如果第一个订单就是null，表示没有任何订单 / If first order is null, no orders exist
                    segmentEndPrice = CurveAMM.MAX_U128_PRICE;
                    maxAllowedPrice = CurveAMM.MAX_U128_PRICE;
                } else {
                    // 到第一个订单开始价格的前一个单位 / To one unit before first order start price
                    segmentEndPrice = BigInt(shortOrderList[0].lockLpStartPrice);
                    maxAllowedPrice = BigInt(shortOrderList[0].lockLpStartPrice);
                }
            } else if (shortOrderList[segmentIndex] === null) {
                // 当前遍历到null（链表结束） / Current iteration reaches null (end of list)
                segmentStartPrice = BigInt(shortOrderList[segmentIndex - 1].lockLpEndPrice);
                segmentEndPrice = CurveAMM.MAX_U128_PRICE;
            } else {
                // 普通情况：位于两个订单之间的空隙 / Normal case: gap between two orders
                segmentStartPrice = BigInt(shortOrderList[segmentIndex - 1].lockLpEndPrice);
                segmentEndPrice = BigInt(shortOrderList[segmentIndex].lockLpStartPrice);
            }

            // 验证价格区间的有效性 / Validate price segment validity
            if (segmentStartPrice > segmentEndPrice) {
                // 价格区间无效，跳过 / Invalid price segment, skip
                priceSegmentAnalysisList[segmentIndex] = {
                    startPrice: segmentStartPrice,
                    endPrice: segmentEndPrice,
                    requiredSolAmount: null,
                    obtainableTokenAmount: null,
                    isValid: false
                };
                continue;
            }

            if (segmentStartPrice == segmentEndPrice) {
                // 价格区间相等 / Price segments are equal
                priceSegmentAnalysisList[segmentIndex] = {
                    startPrice: segmentStartPrice,
                    endPrice: segmentEndPrice,
                    requiredSolAmount: 0n,
                    obtainableTokenAmount: 0n,
                    isValid: true
                };
                continue;
            }

            // 使用AMM计算该区间的交易参数 / Use AMM to calculate transaction parameters for this segment
            const segmentTradeResult = CurveAMM.buyFromPriceToPrice(segmentStartPrice, segmentEndPrice);

            if (!segmentTradeResult) {
                // AMM计算失败 / AMM calculation failed
                priceSegmentAnalysisList[segmentIndex] = {
                    startPrice: segmentStartPrice,
                    endPrice: segmentEndPrice,
                    requiredSolAmount: null,
                    obtainableTokenAmount: null,
                    isValid: false
                };
            } else {
                // 计算成功，保存结果 / Calculation successful, save result
                const [requiredSolAmount, obtainableTokenAmount] = segmentTradeResult;
                priceSegmentAnalysisList[segmentIndex] = {
                    startPrice: segmentStartPrice,
                    endPrice: segmentEndPrice,
                    requiredSolAmount,
                    obtainableTokenAmount,
                    isValid: true
                };
            }
        }

        // 累计计算总流动性深度 / Accumulate total liquidity depth
        for (let i = 0; i < priceSegmentAnalysisList.length; i++) {
            const segment = priceSegmentAnalysisList[i];

            if (segment.isValid && segment.requiredSolAmount !== null && segment.obtainableTokenAmount !== null) {
                totalLiquiditySolAmount += BigInt(segment.requiredSolAmount);
                totalLiquidityTokenAmount += BigInt(segment.obtainableTokenAmount);

                // 检查累计的Token数量是否已经达到理想目标 / Check if accumulated token amount has reached ideal target
                if (totalLiquidityTokenAmount >= idealTokenAmount && targetReachedAtSegmentIndex === -1) {
                    targetReachedAtSegmentIndex = i;
                }
            }
        }

        // 计算实际交易参数 / Calculate actual transaction parameters
        let actualRequiredSolAmount = 0n;
        let actualObtainableTokenAmount = 0n;

        if (targetReachedAtSegmentIndex !== -1) {
            // 可以100%完成交易 / Can complete 100% of transaction
            transactionCompletionRate = 100.0;

            for (let i = 0; i <= targetReachedAtSegmentIndex; i++) {
                const currentSegment = priceSegmentAnalysisList[i];

                if (i === targetReachedAtSegmentIndex) {
                    // 最后一个区间：可能只需要部分交易 / Last segment: may only need partial transaction
                    const remainingTokenNeeded = idealTokenAmount - actualObtainableTokenAmount;
                    const partialTradeResult = CurveAMM.buyFromPriceWithTokenOutput(
                        currentSegment.startPrice,
                        remainingTokenNeeded
                    );

                    if (partialTradeResult) {
                        const [finalPrice, requiredSolForPartial] = partialTradeResult;
                        actualRequiredSolAmount += requiredSolForPartial;
                        actualObtainableTokenAmount += remainingTokenNeeded;
                        totalPriceSpan += absoluteValue(currentSegment.startPrice - finalPrice) + 1n;
                    }
                } else {
                    // 完整使用该区间 / Use this segment completely
                    actualRequiredSolAmount += currentSegment.requiredSolAmount;
                    actualObtainableTokenAmount += currentSegment.obtainableTokenAmount;
                    totalPriceSpan += absoluteValue(currentSegment.startPrice - currentSegment.endPrice) + 1n;
                }
            }
        } else {
            // 无法完全完成交易，使用所有可用流动性 / Cannot complete transaction fully, use all available liquidity
            for (let i = 0; i < priceSegmentAnalysisList.length; i++) {
                const segment = priceSegmentAnalysisList[i];
                if (segment.isValid) {
                    actualRequiredSolAmount += segment.requiredSolAmount;
                    actualObtainableTokenAmount += segment.obtainableTokenAmount;
                    totalPriceSpan += absoluteValue(segment.startPrice - segment.endPrice) + 1n;
                }
            }

            // 计算交易完成率 / Calculate transaction completion rate
            if (idealTokenAmount > 0n) {
                transactionCompletionRate = parseFloat(
                    CurveAMM.u64ToTokenDecimal(actualObtainableTokenAmount)
                        .div(CurveAMM.u64ToTokenDecimal(idealTokenAmount))
                        .mul(100)
                        .toFixed(2)
                );
            }

            // 重新计算理论所需SOL（基于实际可获得的Token数量） / Recalculate theoretical SOL needed (based on actual obtainable token amount)
            const theoreticalTradeResult = CurveAMM.buyFromPriceWithTokenOutput(currentPrice, actualObtainableTokenAmount);
            if (theoreticalTradeResult) {
                const [, theoreticalSolNeeded] = theoreticalTradeResult;
                // 重新声明变量以允许重新赋值
                buyingSolAmountU64 = theoreticalSolNeeded;
            }
        }

        // 计算最小滑点百分比 / Calculate minimum slippage percentage
        const minimumSlippagePercentage = Math.abs(
            100.0 * (
                CurveAMM.u64ToSolDecimal(buyingSolAmountU64)
                    .minus(CurveAMM.u64ToSolDecimal(actualRequiredSolAmount))
                    .div(CurveAMM.u64ToSolDecimal(buyingSolAmountU64))
                    .toNumber()
            )
        );

        // 设置成功结果 / Set successful result
        result.success = true;
        result.data = {
            inputType: 'sol',                                    // 输入币类型 / Input currency type
            inputAmount: buyingSolAmountU64,                    // 输入数量 / Input amount
            maxAllowedPrice: maxAllowedPrice,                   // 允许的最高起始价格 / Maximum allowed start price
            totalPriceSpan: totalPriceSpan,                     // 交易价格区间 / Transaction price range
            transactionCompletionRate: transactionCompletionRate, // 理论交易完成百分比 / Theoretical transaction completion percentage
            idealTokenAmount: idealTokenAmount,                 // 理想情况下买到的Token数量 / Ideal token amount obtainable
            idealSolAmount: idealSolAmount,                     // 理想情况下需要SOL数量 / Ideal SOL amount needed
            actualRequiredSolAmount: actualRequiredSolAmount,   // 实际需要的SOL数量 / Actual SOL amount required
            actualObtainableTokenAmount: actualObtainableTokenAmount, // 实际可获得的Token数量 / Actual token amount obtainable
            theoreticalSolAmount: buyingSolAmountU64,           // 受流动池限制,无滑点下,所需SOL数量 / SOL needed under liquidity pool constraints, no slippage
            minimumSlippagePercentage: minimumSlippagePercentage, // 最小滑点百分比 / Minimum slippage percentage
            totalLiquiditySolAmount: totalLiquiditySolAmount,   // 总流动性深度SOL / Total liquidity depth SOL
            totalLiquidityTokenAmount: totalLiquidityTokenAmount // 总流动性深度Token / Total liquidity depth Token
        };

    } catch (error) {
        // 捕获未预期的错误 / Catch unexpected errors
        result.errorCode = 'DATA_ERROR';
        result.errorMessage = `计算过程中发生错误 / Error occurred during calculation: ${error.message}`;
    }

    return result;
}

export { simulateBuy };