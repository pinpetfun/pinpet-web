import { CurveAMM } from '../utils/curve_amm';
import { simulateLongStopLoss, simulateSellStopLoss } from './simulator/long_shrot_stop';
import { simulateBuy } from './simulator/buy';
import { simulateSell } from './simulator/sell';




/**
 * Simulator 模块类 / Simulator module class
 */
class SimulatorModule {
    private sdk: any;
    private LIQUIDITY_RESERVATION: number;
    private PRICE_ADJUSTMENT_PERCENTAGE: number;

    constructor(sdk: any) {
        this.sdk = sdk;

        // 流动性预留比例 liquidity_reservation 相对于上个锁定的流动性,需要留空出多少流动性
        this.LIQUIDITY_RESERVATION = 100; // 100%;
        // 价格调整比例 / Price adjustment percentage
        this.PRICE_ADJUSTMENT_PERCENTAGE = 0.5; // 0.5%
    }

    /**
     * 模拟买入交易分析 / Simulate buy transaction analysis
     * @param {string} mint - 代币地址 / Token address
     * @param {bigint|string|number} buySolAmount - 购买SOL数量 / SOL amount to buy (u64 format, precision 10^9)
     * @returns {Promise<Object>} 买入分析结果 / Buy analysis result
     */
    async simulateBuy(mint, buySolAmount) {
        return simulateBuy.call(this, mint, buySolAmount);
    }

    /**
     * 模拟卖出交易分析 / Simulate sell transaction analysis
     * @param {string} mint - 代币地址 / Token address
     * @param {bigint|string|number} sellTokenAmount - 卖出Token数量 / Token amount to sell (u64 format, precision 10^6)
     * @returns {Promise<Object>} 卖出分析结果 / Sell analysis result
     */
    async simulateSell(mint, sellTokenAmount) {
        return simulateSell.call(this, mint, sellTokenAmount);
    }

    /**
     * 模拟计算做多时的止损位 / Simulate long position stop loss calculation
     * @param {string} mint - 代币地址 / Token address
     * @param {bigint|string|number} buyTokenAmount - 准备开多买入的token数量 / Token amount to buy for long position (u64 format, precision 10^6)
     * @param {bigint|string|number} stopLossPrice - 用户希望设置的止损位 / User desired stop loss price (u128 format)
     * @param {Object|null} mintInfo - 代币信息，默认null / Token info, default null
     * @param {Object|null} ordersData - 订单数据，默认null / Orders data, default null
     * @returns {Promise<Object>} 止损分析结果 / Stop loss analysis result
     */
    async simulateLongStopLoss(mint, buyTokenAmount, stopLossPrice, mintInfo = null, ordersData = null) {
        return simulateLongStopLoss.call(this, mint, buyTokenAmount, stopLossPrice, mintInfo, ordersData);
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
    async simulateSellStopLoss(mint, sellTokenAmount, stopLossPrice, mintInfo = null, ordersData = null) {
        return simulateSellStopLoss.call(this, mint, sellTokenAmount, stopLossPrice, mintInfo, ordersData);
    }



    
}

export { SimulatorModule };
