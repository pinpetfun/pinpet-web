// @ts-nocheck

import * as anchor from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { TradingModule } from './modules/trading';
import { TokenModule } from './modules/token';
import { ParamModule } from './modules/param';
import { FastModule } from './modules/fast';
import { SimulatorModule } from './modules/simulator';
import { ChainModule } from './modules/chain';
import { OrderUtils } from './utils/orderUtils';
import spinpetIdl from './idl/spinpet.json';

/**
 * SpinPet SDK 主类
 * 提供模块化的接口来与 SpinPet 协议交互
 */
class SpinPetSdk {
  /**
   * 构造函数
   * @param {Connection} connection - Solana 连接实例
   * @param {Wallet|Keypair} wallet - 钱包实例
   * @param {PublicKey|string} programId - 程序 ID
   * @param {Object} options - 配置选项（可选）
   */
  constructor(connection, wallet, programId, options = {}) {
    // 保存配置选项
    this.options = options;

    // 验证 defaultDataSource 配置
    if (options.defaultDataSource && !['fast', 'chain'].includes(options.defaultDataSource)) {
      throw new Error('defaultDataSource 必须是 "fast" 或 "chain"');
    }
    this.defaultDataSource = options.defaultDataSource || 'fast';
    console.log('数据源获取方式:', this.defaultDataSource);

    // 基础配置
    this.connection = connection;
    this.wallet = wallet instanceof anchor.Wallet ? wallet : new anchor.Wallet(wallet);
    this.programId = typeof programId === 'string' ? new PublicKey(programId) : programId;

    // 使用配置初始化账户配置
    this.feeRecipient = this._parsePublicKey(this.options.fee_recipient);
    this.baseFeeRecipient = this._parsePublicKey(this.options.base_fee_recipient);
    this.paramsAccount = this._parsePublicKey(this.options.params_account);
    this.spinFastApiUrl = this.options.spin_fast_api_url;

    // 对应合约里的最大一次处得的定单数量
    this.MAX_ORDERS_COUNT = 10
    // 在查询时需要最大数量的获取订单
    this.FIND_MAX_ORDERS_COUNT = 1000

    // 初始化 Anchor 程序
    this.program = this._initProgram(this.options);

    // 初始化各个功能模块
    this.trading = new TradingModule(this);
    this.token = new TokenModule(this);
    this.param = new ParamModule(this);
    this.fast = new FastModule(this);
    this.simulator = new SimulatorModule(this);
    this.chain = new ChainModule(this);

    // 初始化统一数据接口
    this.data = {
      orders: (mint, options = {}) => this._getDataWithSource('orders', [mint, options]),
      price: (mint, options = {}) => this._getDataWithSource('price', [mint, options])
    };
  }

  /**
   * 解析 PublicKey
   * @private
   * @param {PublicKey|string|null} key - 要解析的键
   * @returns {PublicKey|null}
   */
  _parsePublicKey(key) {
    if (!key) return null;
    return typeof key === 'string' ? new PublicKey(key) : key;
  }

  /**
   * 初始化 Anchor 程序实例
   * @private
   */
  _initProgram(options = {}) {
    const provider = new anchor.AnchorProvider(
      this.connection,
      this.wallet,
      {
        commitment: options.commitment,
        preflightCommitment: options.preflightCommitment,
        skipPreflight: options.skipPreflight || false,
        maxRetries: options.maxRetries,
        ...options
      }
    );

    anchor.setProvider(provider);

    // 使用导入的 IDL 创建程序实例
    return new anchor.Program(spinpetIdl, this.programId);
  }

  // ========== 订单处理工具方法 Order Processing Utility Methods ==========

  /**
   * 构建 LP 配对数组（用于交易）
   * Build LP Pairs Array (for trading)
   *
   * @param {Array} orders - 订单数组 Order array
   * @param {string} direction - 方向 'up_orders' (做空订单) 或 'down_orders' (做多订单) Direction: 'up_orders' (short orders) or 'down_orders' (long orders)
   * @param {bigint|string|number} price - 当前价格 Current price (u128 format)
   * @returns {Array} LP配对数组，格式: [{ solAmount: BN, tokenAmount: BN }, ...]
   *
   * @example
   * const ordersData = await sdk.fast.orders(mint, { type: 'down_orders' });
   * const currentPrice = await sdk.fast.price(mint);
   * const lpPairs = sdk.buildLpPairs(ordersData.data.orders, 'down_orders', currentPrice);
   * // 返回: [
   * //   { solAmount: new anchor.BN("63947874"), tokenAmount: new anchor.BN("65982364399") },
   * //   { solAmount: new anchor.BN("1341732020"), tokenAmount: new anchor.BN("1399566720549") },
   * //   ...
   * // ]
   */
  buildLpPairs(orders, direction, price) {
    return OrderUtils.buildLpPairs(orders, direction, price, this.MAX_ORDERS_COUNT);
  }

  /**
   * 构建订单账户数组（用于交易）
   * Build Order Accounts Array (for trading)
   *
   * @param {Array} orders - 订单数组 Order array
   * @returns {Array} 订单账户地址数组，格式: [string, string, ..., null, null]
   *
   * @example
   * const ordersData = await sdk.fast.orders(mint, { type: 'down_orders' });
   * const orderAccounts = sdk.buildOrderAccounts(ordersData.data.orders);
   * // 返回: [
   * //   "4fvsPDNoRRacSzE3PkEuNQeTNWMaeFqGwUxCnEbR1Dzb",
   * //   "G4nHBYX8EbrP8r35pk5TfpvJZfGNyLnd4qsfT7ru5vLd",
   * //   ...
   * //   null, null
   * // ]
   */
  buildOrderAccounts(orders) {
    return OrderUtils.buildOrderAccounts(orders, this.MAX_ORDERS_COUNT);
  }

  /**
   * 查找订单的前后节点
   * Find Previous and Next Order
   *
   * @param {Array} orders - 订单数组 Order array
   * @param {string} findOrderPda - 要查找的订单PDA地址 Target order PDA address
   * @returns {Object} 返回 { prevOrder: Object|null, nextOrder: Object|null }
   *
   * @example
   * const ordersData = await sdk.fast.orders(mint, { type: 'down_orders' });
   * const result = sdk.findPrevNext(ordersData.data.orders, 'E2T72D4wZdxHRjELN5VnRdcCvS4FPcYBBT3UBEoaC5cA');
   * // 返回格式:
   * // {
   * //   prevOrder: { order_pda: "...", user: "...", ... } | null,
   * //   nextOrder: { order_pda: "...", user: "...", ... } | null
   * // }
   */
  findPrevNext(orders, findOrderPda) {
    return OrderUtils.findPrevNext(orders, findOrderPda);
  }

  // ========== 统一数据接口路由方法 Unified Data Interface Routing Method ==========

  /**
   * 根据配置选择数据来源
   * Route data requests based on configuration
   *
   * @private
   * @param {string} method - 方法名 Method name
   * @param {Array} args - 参数数组 Arguments array
   * @returns {Promise} 返回对应模块方法的结果 Returns result from corresponding module method
   */
  _getDataWithSource(method, args) {
    // 提取最后一个参数中的 dataSource 配置
    const lastArg = args[args.length - 1] || {};
    const dataSource = lastArg.dataSource || this.defaultDataSource;

    // 根据数据源路由到对应模块
    const module = dataSource === 'chain' ? this.chain : this.fast;

    if (!module[method]) {
      throw new Error(`方法 ${method} 在 ${dataSource} 模块中不存在`);
    }

    return module[method](...args);
  }

}

module.exports = SpinPetSdk;
