

// 流动性预留比例 liquidity_reservation 相对于上个锁定的流动性,需要留空出多少流动性
const LIQUIDITY_RESERVATION = 100;  // 100%

// 价格调整比例 / Price adjustment percentage
const PRICE_ADJUSTMENT_PERCENTAGE = 5; //  5就是 0.5%


/**
 * 转换API订单格式为计算函数期望的格式 / Convert API order format to expected format
 * @param {Array} apiOrders - API返回的订单列表 / Orders returned from API
 * @returns {Array} 转换后的订单列表 / Converted order list
 */
function convertApiOrdersFormat(apiOrders) {
    if (!apiOrders || !Array.isArray(apiOrders)) {
        return [];
    }

    return apiOrders.map(order => ({
        ...order,
        lockLpStartPrice: order.lock_lp_start_price,
        lockLpEndPrice: order.lock_lp_end_price
    }));
}


/**
 * 处理BigInt的绝对值函数 / Handle BigInt absolute value
 * @param {BigInt} value - 需要计算绝对值的BigInt数 / BigInt value to calculate absolute value
 * @returns {BigInt} 绝对值结果 / Absolute value result
 */
function absoluteValue(value) {
    return value < 0n ? -value : value;
}



export { convertApiOrdersFormat, absoluteValue, LIQUIDITY_RESERVATION, PRICE_ADJUSTMENT_PERCENTAGE };