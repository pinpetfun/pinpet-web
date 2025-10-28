
import { CurveAMM } from '../../utils/curve_amm';
import { transformOrdersData, checkPriceRangeOverlap } from './stop_loss_utils';
import { PRICE_ADJUSTMENT_PERCENTAGE } from './utils';

/**
 * 模拟计算做多时的止损位 / Simulate long position stop loss calculation
 * @param {string} mint - 代币地址 / Token address
 * @param {bigint|string|number} buyTokenAmount - 准备开多买入的token数量 / Token amount to buy for long position (u64 format, precision 10^6)
 * @param {bigint|string|number} stopLossPrice - 用户希望设置的止损位 / User desired stop loss price (u128 format)
 * @param {Object|null} mintInfo - 代币信息，默认null / Token info, default null
 * @param {Object|null} ordersData - 订单数据，默认null / Orders data, default null
 * @returns {Promise<Object>} 止损分析结果 / Stop loss analysis result
 */
async function simulateLongStopLoss(mint, buyTokenAmount, stopLossPrice, mintInfo = null, ordersData = null) {
    try {
        // 参数验证 / Parameter validation
        if (!mint || !buyTokenAmount || !stopLossPrice) {
            throw new Error('缺少必要参数 / Missing required parameters');
        }

        // 获取 mintInfo / Get mintInfo
        if (!mintInfo) {
            console.log('获取代币信息中... / Getting token info...');
            mintInfo = await this.sdk.fast.mint_info(mint);
            if (!mintInfo || !mintInfo.success) {
                throw new Error('获取代币信息失败 / Failed to get token info');
            }
        }

        // 获取 ordersData / Get ordersData
        if (!ordersData) {
            console.log('获取订单数据中... / Getting orders data...');
            ordersData = await this.sdk.data.orders(mint, { type: 'down_orders' });
            if (!ordersData || !ordersData.success) {
                throw new Error('获取订单数据失败 / Failed to get orders data');
            }
        }

        // 计算当前价格 / Calculate current price
        let currentPrice;
        if (mintInfo.data.details[0].latest_price === null || mintInfo.data.details[0].latest_price === undefined) {
            console.log('当前价格为空，使用初始价格 / Current price is empty, using initial price');
            currentPrice = CurveAMM.getInitialPrice();
        } else {
            currentPrice = BigInt(mintInfo.data.details[0].latest_price);
            if (!currentPrice || currentPrice === 0n) {
                console.log('当前价格为0，使用初始价格 / Current price is 0, using initial price');
                currentPrice = CurveAMM.getInitialPrice();
            }
        }

        // 转换订单数据 / Transform orders data
        const downOrders = transformOrdersData(ordersData);
        console.log(`找到 ${downOrders.length} 个已存在的做多订单 / Found ${downOrders.length} existing long orders`);

        // 初始化止损价格 / Initialize stop loss prices
        let stopLossStartPrice = BigInt(stopLossPrice);
        let stopLossEndPrice;
        let maxIterations = 1000; // 防止无限循环 / Prevent infinite loop
        let iteration = 0;
        let finalOverlapResult = null; // 记录最终的overlap结果 / Record final overlap result
        let finalTradeAmount = 0n; // 记录最终的交易金额 / Record final trade amount

        //console.log(`开始价格: ${stopLossStartPrice}, 目标Token数量: ${buyTokenAmount} / Start price: ${stopLossStartPrice}, Target token amount: ${buyTokenAmount}`);

        // 循环调整止损价格直到无重叠 / Loop to adjust stop loss price until no overlap
        while (iteration < maxIterations) {
            iteration++;

            // 计算止损结束价格 / Calculate stop loss end price
            //console.log('当前止损起始价格 / Current stop loss start price:', stopLossStartPrice.toString());
            const tradeResult = CurveAMM.sellFromPriceWithTokenInput(stopLossStartPrice, buyTokenAmount);
            if (!tradeResult) {
                throw new Error('计算止损结束价格失败 / Failed to calculate stop loss end price');
            }

            stopLossEndPrice = tradeResult[0]; // 交易完成后的价格 / Price after trade completion
            const tradeAmount = tradeResult[1]; // SOL输出量 / SOL output amount

            //console.log(`迭代 ${iteration}: 起始价格=${stopLossStartPrice}, 结束价格=${stopLossEndPrice}, SOL输出量=${tradeAmount} / Iteration ${iteration}: Start=${stopLossStartPrice}, End=${stopLossEndPrice}, SOL output=${tradeAmount}`);

            // 检查价格区间重叠 / Check price range overlap
            const overlapResult = checkPriceRangeOverlap('down_orders', downOrders, stopLossStartPrice, stopLossEndPrice);
            
            if (overlapResult.no_overlap) {
                console.log('价格区间无重叠，可以执行 / No price range overlap, can execute');
                finalOverlapResult = overlapResult; // 记录最终的overlap结果 / Record final overlap result
                finalTradeAmount = tradeAmount; // 记录最终的交易金额 / Record final trade amount
                break;
            }

            //console.log(`发现重叠: ${overlapResult.overlap_reason} / Found overlap: ${overlapResult.overlap_reason}`);

            // 调整起始价格（减少0.5%）/ Adjust start price (decrease by 0.5%)
            // 使用方案2：直接计算 0.5% = 5/1000
            const adjustmentAmount = (stopLossStartPrice * BigInt(PRICE_ADJUSTMENT_PERCENTAGE)) / 1000n;
            stopLossStartPrice = stopLossStartPrice - adjustmentAmount;

            //console.log(`调整后起始价格: ${stopLossStartPrice} / Adjusted start price: ${stopLossStartPrice}`);

            // 安全检查：确保价格不会变成负数 / Safety check: ensure price doesn't become negative
            if (stopLossStartPrice <= 0n) {
                throw new Error('止损价格调整后变为负数，无法继续 / Stop loss price became negative after adjustment');
            }
        }

        if (iteration >= maxIterations) {
            throw new Error('达到最大迭代次数，无法找到合适的止损价格 / Reached maximum iterations, cannot find suitable stop loss price');
        }

        // 计算最终返回值 / Calculate final return values
        const executableStopLossPrice = stopLossStartPrice;
        
        // 计算止损百分比 / Calculate stop loss percentage
        let stopLossPercentage = 0;
        let leverage = 1;
        
        if (currentPrice !== executableStopLossPrice) {
            stopLossPercentage = Number((BigInt(10000) * (currentPrice - executableStopLossPrice)) / currentPrice) / 100;
            leverage = Number((BigInt(10000) * currentPrice) / (currentPrice - executableStopLossPrice)) / 10000;
        }

        console.log(`计算完成 / Calculation completed:`);
        console.log(`  可执行止损价格: ${executableStopLossPrice} / Executable stop loss price: ${executableStopLossPrice}`);
        console.log(`  SOL输出量: ${finalTradeAmount} / SOL output amount: ${finalTradeAmount}`);
        console.log(`  止损百分比: ${stopLossPercentage}% / Stop loss percentage: ${stopLossPercentage}%`);
        console.log(`  杠杆比例: ${leverage}x / Leverage: ${leverage}x`);
        console.log(`  前一个订单PDA: ${finalOverlapResult.prev_order_pda} / Previous order PDA: ${finalOverlapResult.prev_order_pda}`);
        console.log(`  下一个订单PDA: ${finalOverlapResult.next_order_pda} / Next order PDA: ${finalOverlapResult.next_order_pda}`);

        return {
            executableStopLossPrice: executableStopLossPrice, // 计算后给出合理的止损值 / Calculated reasonable stop loss value
            tradeAmount: finalTradeAmount, // SOL输出量 / SOL output amount
            stopLossPercentage: stopLossPercentage, // 相对目前价格的止损百分比 / Stop loss percentage relative to current price
            leverage: leverage, // 杠杆比例 / Leverage ratio
            currentPrice: currentPrice, // 当前价格 / Current price
            iterations: iteration, // 调整次数 / Number of adjustments
            originalStopLossPrice: BigInt(stopLossPrice), // 原始止损价格 / Original stop loss price
            prev_order_pda: finalOverlapResult.prev_order_pda, // 前一个订单PDA / Previous order PDA
            next_order_pda: finalOverlapResult.next_order_pda // 下一个订单PDA / Next order PDA
        };

    } catch (error) {
        console.error('模拟计算止损位失败 / Failed to simulate stop loss calculation:', error.message);
        throw error;
    }
}


/**
 * 模拟计算做空时的止损位 / Simulate short position stop loss calculation
 * @param {string} mint - 代币地址 / Token address
 * @param {bigint|string|number} sellTokenAmount - 准备开空卖出的token数量 / Token amount to sell for short position (u64 format, precision 10^6)
 * @param {bigint|string|number} stopLossPrice - 用户希望设置的止损位 / User desired stop loss price (u128 format)
 * @param {Object|null} mintInfo - 代币信息，默认null / Token info, default null
 * @param {Object|null} ordersData - 订单数据，默认null / Orders data, default null
 * @returns {Promise<Object>} 止损分析结果 / Stop loss analysis result
 */
async function simulateSellStopLoss(mint, sellTokenAmount, stopLossPrice, mintInfo = null, ordersData = null) {
    try {
        // 参数验证 / Parameter validation
        if (!mint || !sellTokenAmount || !stopLossPrice) {
            throw new Error('缺少必要参数 / Missing required parameters');
        }

        // 获取 mintInfo / Get mintInfo
        if (!mintInfo) {
            console.log('获取代币信息中... / Getting token info...');
            mintInfo = await this.sdk.fast.mint_info(mint);
            if (!mintInfo || !mintInfo.success) {
                throw new Error('获取代币信息失败 / Failed to get token info');
            }
        }

        // 获取 ordersData / Get ordersData
        if (!ordersData) {
            console.log('获取订单数据中... / Getting orders data...');
            ordersData = await this.sdk.data.orders(mint, { type: 'up_orders' });
            if (!ordersData || !ordersData.success) {
                throw new Error('获取订单数据失败 / Failed to get orders data');
            }
        }

        // 计算当前价格 / Calculate current price
        let currentPrice = BigInt(mintInfo.data.details[0].latest_price);
        if (!currentPrice || currentPrice === 0n) {
            console.log('当前价格为空，使用初始价格 / Current price is empty, using initial price');
            currentPrice = CurveAMM.getInitialPrice();
        }

        // 转换订单数据 / Transform orders data
        const upOrders = transformOrdersData(ordersData);
        console.log(`找到 ${upOrders.length} 个已存在的做空订单 / Found ${upOrders.length} existing short orders`);

        // 初始化止损价格 / Initialize stop loss prices
        let stopLossStartPrice = BigInt(stopLossPrice);
        let stopLossEndPrice;
        let maxIterations = 1000; // 防止无限循环 / Prevent infinite loop
        let iteration = 0;
        let finalOverlapResult = null; // 记录最终的overlap结果 / Record final overlap result
        let finalTradeAmount = 0n; // 记录最终的交易金额 / Record final trade amount

        console.log(`开始价格: ${stopLossStartPrice}, 目标Token数量: ${sellTokenAmount} / Start price: ${stopLossStartPrice}, Target token amount: ${sellTokenAmount}`);

        // 循环调整止损价格直到无重叠 / Loop to adjust stop loss price until no overlap
        while (iteration < maxIterations) {
            iteration++;

            // 计算止损结束价格 / Calculate stop loss end price
            const tradeResult = CurveAMM.buyFromPriceWithTokenOutput(stopLossStartPrice, sellTokenAmount);
            if (!tradeResult) {
                throw new Error('计算止损结束价格失败 / Failed to calculate stop loss end price');
            }

            stopLossEndPrice = tradeResult[0]; // 交易完成后的价格 / Price after trade completion
            const tradeAmount = tradeResult[1]; // SOL输入量 / SOL input amount

            //console.log(`迭代 ${iteration}: 起始价格=${stopLossStartPrice}, 结束价格=${stopLossEndPrice}, SOL输入量=${tradeAmount} / Iteration ${iteration}: Start=${stopLossStartPrice}, End=${stopLossEndPrice}, SOL input=${tradeAmount}`);

            // 检查价格区间重叠 / Check price range overlap
            const overlapResult = checkPriceRangeOverlap('up_orders', upOrders, stopLossStartPrice, stopLossEndPrice);
            
            if (overlapResult.no_overlap) {
                console.log('价格区间无重叠，可以执行 / No price range overlap, can execute');
                finalOverlapResult = overlapResult; // 记录最终的overlap结果 / Record final overlap result
                finalTradeAmount = tradeAmount; // 记录最终的交易金额 / Record final trade amount
                break;
            }

            //console.log(`发现重叠: ${overlapResult.overlap_reason} / Found overlap: ${overlapResult.overlap_reason}`);

            // 调整起始价格（增加0.5%）/ Adjust start price (increase by 0.5%)
            // 使用方案2：直接计算 0.5% = 5/1000
            const adjustmentAmount = (stopLossStartPrice * BigInt(PRICE_ADJUSTMENT_PERCENTAGE)) / 1000n;
            stopLossStartPrice = stopLossStartPrice + adjustmentAmount;

            //console.log(`调整后起始价格: ${stopLossStartPrice} / Adjusted start price: ${stopLossStartPrice}`);

            // 安全检查：确保价格不会超过最大值 / Safety check: ensure price doesn't exceed maximum
            if (stopLossStartPrice >= CurveAMM.MAX_U128_PRICE) {
                throw new Error('止损价格调整后超过最大值，无法继续 / Stop loss price exceeded maximum after adjustment');
            }
        }

        if (iteration >= maxIterations) {
            throw new Error('达到最大迭代次数，无法找到合适的止损价格 / Reached maximum iterations, cannot find suitable stop loss price');
        }

        // 计算最终返回值 / Calculate final return values
        const executableStopLossPrice = stopLossStartPrice;
        
        // 计算止损百分比 / Calculate stop loss percentage
        // 做空时，止损价格高于当前价格，所以是正百分比
        const stopLossPercentage = Number((BigInt(10000) * (executableStopLossPrice - currentPrice)) / currentPrice) / 100;
        
        // 计算杠杆比例 / Calculate leverage ratio
        // 做空时，杠杆 = 当前价格 / (止损价格 - 当前价格)
        const leverage = Number((BigInt(10000) * currentPrice) / (executableStopLossPrice - currentPrice)) / 10000;

        console.log(`计算完成 / Calculation completed:`);
        console.log(`  可执行止损价格: ${executableStopLossPrice} / Executable stop loss price: ${executableStopLossPrice}`);
        console.log(`  SOL输入量: ${finalTradeAmount} / SOL input amount: ${finalTradeAmount}`);
        console.log(`  止损百分比: ${stopLossPercentage}% / Stop loss percentage: ${stopLossPercentage}%`);
        console.log(`  杠杆比例: ${leverage}x / Leverage: ${leverage}x`);
        console.log(`  前一个订单PDA: ${finalOverlapResult.prev_order_pda} / Previous order PDA: ${finalOverlapResult.prev_order_pda}`);
        console.log(`  下一个订单PDA: ${finalOverlapResult.next_order_pda} / Next order PDA: ${finalOverlapResult.next_order_pda}`);

        return {
            executableStopLossPrice: executableStopLossPrice, // 计算后给出合理的止损值 / Calculated reasonable stop loss value
            tradeAmount: finalTradeAmount, // SOL输入量 / SOL input amount
            stopLossPercentage: stopLossPercentage, // 相对目前价格的止损百分比 / Stop loss percentage relative to current price
            leverage: leverage, // 杠杆比例 / Leverage ratio
            currentPrice: currentPrice, // 当前价格 / Current price
            iterations: iteration, // 调整次数 / Number of adjustments
            originalStopLossPrice: BigInt(stopLossPrice), // 原始止损价格 / Original stop loss price
            prev_order_pda: finalOverlapResult.prev_order_pda, // 前一个订单PDA / Previous order PDA
            next_order_pda: finalOverlapResult.next_order_pda // 下一个订单PDA / Next order PDA
        };

    } catch (error) {
        console.error('模拟计算做空止损位失败 / Failed to simulate short position stop loss calculation:', error.message);
        throw error;
    }
}









export { simulateLongStopLoss, simulateSellStopLoss };