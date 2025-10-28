
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { CurveAMM } from '../utils/curve_amm';

/**
 * 链上数据模块 Chain Module
 * 在没有辅助服务器的情况下, 直接调用链上数据拿到交易所需的参数
 * 缺点是在交易高峰期, 链上数据可能会有延迟, 导致交易失败
 * 提供从 Solana 链上读取账户数据的功能
 */
class ChainModule {
  private sdk: any;

  constructor(sdk: any) {
    this.sdk = sdk;
  }

  /**
   * 获取 curve_account (BorrowingBondingCurve) 的完整数据
   * Get complete curve_account (BorrowingBondingCurve) data
   * 
   * 从链上读取指定代币的借贷流动池账户数据，包括所有相关账户的地址和余额信息。
   * 该函数会自动计算相关的 PDA 地址并并发查询所有余额，提供完整的流动池状态。
   * 
   * @param {string|PublicKey} mint - 代币铸造账户地址 Token mint account address
   * 
   * @returns {Promise<Object>} 完整的 BorrowingBondingCurve 账户数据对象 Complete BorrowingBondingCurve account data object
   * 
   * @returns {Promise<Object>} 返回对象包含以下完整字段 Return object contains following complete fields:
   * 
   * **核心储备数据 Core Reserve Data:**
   * @returns {bigint} returns.lpTokenReserve - LP Token 储备量，流动性提供者代币的总储备
   * @returns {bigint} returns.lpSolReserve - LP SOL 储备量，流动性池中的 SOL 储备 
   * @returns {bigint} returns.price - 当前代币价格，基于 AMM 算法计算
   * @returns {bigint} returns.borrowTokenReserve - 借贷 Token 储备量，可借贷的代币储备
   * @returns {bigint} returns.borrowSolReserve - 借贷 SOL 储备量，可借贷的 SOL 储备
   * 
   * **费用和参数配置 Fee and Parameter Configuration:**
   * @returns {number} returns.swapFee - 交换费率，以基点表示 (如 100 = 1%)
   * @returns {number} returns.borrowFee - 借贷费率，以基点表示
   * @returns {boolean} returns.feeDiscountFlag - 费用折扣标志，是否启用费用优惠
   * @returns {number} returns.feeSplit - 费用分配比例，决定费用如何在不同接收方间分配
   * @returns {number} returns.borrowDuration - 借贷期限，以秒为单位
   * @returns {number} returns.bump - curve_account PDA 的 bump seed
   * 
   * **账户地址 Account Addresses:**
   * @returns {string} returns.baseFeeRecipient - 基础费用接收地址，接收基础交易费用
   * @returns {string} returns.feeRecipient - 费用接收地址，接收额外费用收入
   * @returns {string} returns.mint - 代币铸造账户地址
   * @returns {string|null} returns.upHead - 上行订单链表头部账户地址，如果无则为 null
   * @returns {string|null} returns.downHead - 下行订单链表头部账户地址，如果无则为 null
   * @returns {string} returns.poolTokenAccount - 流动池代币账户地址，存储流动池中的代币
   * @returns {string} returns.poolSolAccount - 流动池 SOL 账户地址，存储流动池中的原生 SOL
   * 
   * **余额信息 Balance Information:**
   * @returns {number} returns.baseFeeRecipientBalance - 基础费用接收地址的 SOL 余额 (lamports)
   * @returns {number} returns.feeRecipientBalance - 费用接收地址的 SOL 余额 (lamports)
   * @returns {bigint} returns.poolTokenBalance - 流动池代币账户的代币余额
   * @returns {number} returns.poolSolBalance - 流动池 SOL 账户的 SOL 余额 (lamports)
   * 
   * **元数据 Metadata:**
   * @returns {Object} returns._metadata - 额外的元数据信息
   * @returns {string} returns._metadata.accountAddress - curve_account 的完整地址
   * @returns {string} returns._metadata.mintAddress - 输入的代币铸造地址
   * 
   * @throws {Error} 当 curve_account 不存在时抛出错误
   * @throws {Error} 当无法解码账户数据时抛出错误
   * @throws {Error} 当网络连接失败时抛出错误
   * 
   * @example
   * // 基本使用示例 Basic usage example
   * try {
   *   const curveData = await sdk.chain.getCurveAccount('3YggGtxXEGBbjK1WLj2Z79doZC2gkCWXag1ag8BD4cYY');
   *   
   *   // 显示核心储备信息 Display core reserve information
   *   console.log('=== 核心储备数据 Core Reserve Data ===');
   *   console.log('LP Token 储备量:', curveData.lpTokenReserve.toString());
   *   console.log('LP SOL 储备量:', curveData.lpSolReserve.toString());
   *   console.log('当前价格:', curveData.price.toString());
   *   console.log('借贷 Token 储备量:', curveData.borrowTokenReserve.toString());
   *   console.log('借贷 SOL 储备量:', curveData.borrowSolReserve.toString());
   *   
   *   // 显示费用配置 Display fee configuration
   *   console.log('=== 费用配置 Fee Configuration ===');
   *   console.log('交换费率:', curveData.swapFee / 100, '%');
   *   console.log('借贷费率:', curveData.borrowFee / 100, '%');
   *   console.log('费用折扣:', curveData.feeDiscountFlag ? '启用' : '禁用');
   *   console.log('借贷期限:', curveData.borrowDuration, '秒');
   *   
   *   // 显示账户地址 Display account addresses
   *   console.log('=== 账户地址 Account Addresses ===');
   *   console.log('基础费用接收地址:', curveData.baseFeeRecipient);
   *   console.log('费用接收地址:', curveData.feeRecipient);
   *   console.log('流动池代币账户:', curveData.poolTokenAccount);
   *   console.log('流动池 SOL 账户:', curveData.poolSolAccount);
   *   
   *   // 显示余额信息 Display balance information
   *   console.log('=== 余额信息 Balance Information ===');
   *   console.log('基础费用接收地址余额:', curveData.baseFeeRecipientBalance / 1e9, 'SOL');
   *   console.log('费用接收地址余额:', curveData.feeRecipientBalance / 1e9, 'SOL');
   *   console.log('流动池代币余额:', curveData.poolTokenBalance.toString());
   *   console.log('流动池 SOL 余额:', curveData.poolSolBalance / 1e9, 'SOL');
   *   
   *   // 显示链表头部信息 Display linked list head information
   *   console.log('=== 订单链表 Order Linked Lists ===');
   *   console.log('上行订单头部:', curveData.upHead || '空');
   *   console.log('下行订单头部:', curveData.downHead || '空');
   *   
   * } catch (error) {
   *   console.error('获取 curve account 失败:', error.message);
   * }
   * 
   * @example
   * // 监控流动池状态示例 Pool monitoring example
   * async function monitorPool(mintAddress) {
   *   const data = await sdk.chain.getCurveAccount(mintAddress);
   *   
   *   // 计算流动池利用率 Calculate pool utilization
   *   const tokenUtilization = Number(data.lpTokenReserve - data.poolTokenBalance) / Number(data.lpTokenReserve);
   *   const solUtilization = Number(data.lpSolReserve - BigInt(data.poolSolBalance)) / Number(data.lpSolReserve);
   *   
   *   console.log('代币利用率:', (tokenUtilization * 100).toFixed(2), '%');
   *   console.log('SOL 利用率:', (solUtilization * 100).toFixed(2), '%');
   *   
   *   // 检查费用收入 Check fee earnings
   *   const totalFeeBalance = data.baseFeeRecipientBalance + data.feeRecipientBalance;
   *   console.log('总费用收入:', totalFeeBalance / 1e9, 'SOL');
   *   
   *   return {
   *     tokenUtilization,
   *     solUtilization,
   *     totalFeeBalance,
   *     currentPrice: data.price
   *   };
   * }
   * 
   * @since 1.0.0
   * @version 1.1.0 - 添加了流动池账户余额查询功能
   * @author SpinPet SDK Team
   */
  async getCurveAccount(mint) {
    try {
      // 参数验证和转换 Parameter validation and conversion
      const mintPubkey = typeof mint === 'string' ? new PublicKey(mint) : mint;
      
      // 计算 curve_account 的 PDA 地址 Calculate curve_account PDA address
      // 使用与合约中相同的 seeds: [b"borrowing_curve", mint_account.key().as_ref()]
      const [curveAccountPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("borrowing_curve"), 
          mintPubkey.toBuffer()
        ],
        this.sdk.programId
      );

      // 使用 Anchor 程序直接获取账户数据 Use Anchor program to fetch account data directly
      // 方法1: 使用程序的 fetch 方法 Method 1: Use program's fetch method
      let decodedData;
      try {
        decodedData = await this.sdk.program.account.borrowingBondingCurve.fetch(curveAccountPDA);
      } catch {
        // 方法2: 如果 fetch 失败，使用原始方法 Method 2: If fetch fails, use raw method
        const accountInfo = await this.sdk.connection.getAccountInfo(curveAccountPDA);
        if (!accountInfo) {
          throw new Error(`curve_account 不存在 curve_account does not exist`);
        }
        
        // 使用 BorshAccountsCoder 手动解码 Manually decode with BorshAccountsCoder
        const accountsCoder = new anchor.BorshAccountsCoder(this.sdk.program.idl);
        
        // 尝试不同的账户名称 Try different account names
        try {
          decodedData = accountsCoder.decode('BorrowingBondingCurve', accountInfo.data);
        } catch (decodeError1) {
          try {
            // 尝试小写名称 Try lowercase name
            decodedData = accountsCoder.decode('borrowingBondingCurve', accountInfo.data);
          } catch {
            // 两种方式都失败，抛出原始错误 Both failed, throw original error
            throw new Error(`无法解码账户数据 Cannot decode account data: ${decodeError1.message}`);
          }
        }
      }

      // 计算流动池账户的 PDA 地址 Calculate pool account PDA addresses
      const [poolTokenAccountPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("pool_token"),
          mintPubkey.toBuffer()
        ],
        this.sdk.programId
      );

      const [poolSolAccountPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("pool_sol"),
          mintPubkey.toBuffer()
        ],
        this.sdk.programId
      );

      // 并发查询所有余额 Query all balances concurrently
      const [
        baseFeeRecipientBalance,
        feeRecipientBalance,
        poolTokenBalance,
        poolSolBalance
      ] = await Promise.all([
        this.sdk.connection.getBalance(decodedData.baseFeeRecipient),
        this.sdk.connection.getBalance(decodedData.feeRecipient),
        this.sdk.connection.getTokenAccountBalance(poolTokenAccountPDA).catch(() => ({ value: { amount: '0' } })),
        this.sdk.connection.getBalance(poolSolAccountPDA)
      ]);

      // 转换数据格式 Convert data format
      const convertedData = {
        // BN 类型转换为 bigint BN types convert to bigint
        lpTokenReserve: BigInt(decodedData.lpTokenReserve.toString()),
        lpSolReserve: BigInt(decodedData.lpSolReserve.toString()),
        price: BigInt(decodedData.price.toString()),
        borrowTokenReserve: BigInt(decodedData.borrowTokenReserve.toString()),
        borrowSolReserve: BigInt(decodedData.borrowSolReserve.toString()),
        
        // 数值类型保持不变 Numeric types remain unchanged
        swapFee: decodedData.swapFee,
        borrowFee: decodedData.borrowFee,
        feeDiscountFlag: decodedData.feeDiscountFlag,
        feeSplit: decodedData.feeSplit,
        borrowDuration: decodedData.borrowDuration,
        bump: decodedData.bump,
        
        // PublicKey 类型转换为字符串 PublicKey types convert to string
        baseFeeRecipient: decodedData.baseFeeRecipient.toString(),
        feeRecipient: decodedData.feeRecipient.toString(),
        mint: decodedData.mint.toString(),
        upHead: decodedData.upHead ? decodedData.upHead.toString() : null,
        downHead: decodedData.downHead ? decodedData.downHead.toString() : null,
        
        // SOL 余额信息 SOL balance information
        baseFeeRecipientBalance: baseFeeRecipientBalance,  // 单位: lamports Unit: lamports
        feeRecipientBalance: feeRecipientBalance,          // 单位: lamports Unit: lamports
        
        // 流动池账户信息 Pool account information
        poolTokenAccount: poolTokenAccountPDA.toString(),           // 流动池代币账户地址 Pool token account address
        poolSolAccount: poolSolAccountPDA.toString(),               // 流动池 SOL 账户地址 Pool SOL account address
        poolTokenBalance: BigInt(poolTokenBalance.value.amount),    // 流动池代币余额 Pool token balance
        poolSolBalance: poolSolBalance,                             // 流动池 SOL 余额 (lamports) Pool SOL balance
        
        // 额外的元数据 Additional metadata
        _metadata: {
          accountAddress: curveAccountPDA.toString(),
          mintAddress: mintPubkey.toString()
        }
      };
      
      // 返回转换后的数据 Return converted data
      return convertedData;

    } catch (error) {
      // 提供简洁的错误信息 Provide concise error information
      if (error.message.includes('Account does not exist')) {
        throw new Error(`curve_account 不存在 curve_account does not exist for mint: ${mint}`);
      } else {
        throw new Error(`获取 curve_account 失败 Failed to get curve_account: ${error.message}`);
      }
    }
  }

  /**
   * 批量获取多个代币的 curve_account 数据
   * Batch get multiple tokens' curve_account data
   * 
   * @param {Array<string|PublicKey>} mints - 代币地址数组 Array of token addresses
   * @returns {Promise<Object>} 包含成功和失败结果的对象 Object containing success and error results
   * 
   * @example
   * const curveDataList = await sdk.chain.getCurveAccountBatch([
   *   '3YggGtxXEGBbjK1WLj2Z79doZC2gkCWXag1ag8BD4cYY',
   *   'AnotherTokenMintAddress'
   * ]);
   */
  async getCurveAccountBatch(mints) {
    if (!Array.isArray(mints)) {
      throw new Error('mints 参数必须是数组 mints parameter must be an array');
    }

    const results = [];
    const errors = [];

    // 并发获取所有数据 Concurrently get all data
    const promises = mints.map(async (mint, index) => {
      try {
        const data = await this.getCurveAccount(mint);
        return { index, success: true, data, mint: mint.toString() };
      } catch (error) {
        return { index, success: false, error: error.message, mint: mint.toString() };
      }
    });

    const settled = await Promise.allSettled(promises);

    // 处理结果 Process results
    for (let i = 0; i < settled.length; i++) {
      const result = settled[i];
      
      if (result.status === 'fulfilled') {
        const { success, data, error, mint } = result.value;
        
        if (success) {
          results.push(data);
        } else {
          errors.push({ mint, error });
        }
      } else {
        errors.push({ 
          mint: mints[i].toString(), 
          error: result.reason?.message || 'Unknown error' 
        });
      }
    }

    return {
      success: results,
      errors: errors,
      total: mints.length,
      successCount: results.length,
      errorCount: errors.length
    };
  }

  /**
   * 计算 curve_account 的 PDA 地址
   * Calculate curve_account PDA address
   * 
   * @param {string|PublicKey} mint - 代币铸造账户地址 Token mint address
   * @returns {PublicKey} curve_account 的 PDA 地址 curve_account PDA address
   * 
   * @example
   * const curveAddress = sdk.chain.getCurveAccountAddress('3YggGtxXEGBbjK1WLj2Z79doZC2gkCWXag1ag8BD4cYY');
   * console.log('Curve Account 地址:', curveAddress.toString());
   */
  getCurveAccountAddress(mint) {
    const mintPubkey = typeof mint === 'string' ? new PublicKey(mint) : mint;
    
    const [curveAccountPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("borrowing_curve"), 
        mintPubkey.toBuffer()
      ],
      this.sdk.programId
    );

    return curveAccountPDA;
  }

  /**
   * 获取价格数据（从链上 curveAccountPDA 读取 price 数据）
   * Get price data (read price from chain curveAccountPDA)
   * @param {string} mint - 代币地址 Token address
   * @returns {Promise<string>} 最新价格字符串 Latest price string
   * 
   * @example
   * // 获取代币最新价格 Get latest token price
   * const price = await sdk.chain.price('56hfrQYiyRSUZdRKDuUvsqRik8j2UDW9kCisy7BiRxmg');
   * console.log('最新价格 Latest price:', price); // "13514066072452801812769"
   */
  async price(mint) {
    // 验证输入 Validate input
    if (!mint || typeof mint !== 'string') {
      throw new Error('price: 代币地址必须是有效的字符串 mint address must be a valid string');
    }
    
    try {
      // 参数验证和转换 Parameter validation and conversion
      let mintPubkey;
      try {
        mintPubkey = typeof mint === 'string' ? new PublicKey(mint) : mint;
      } catch {
        throw new Error(`无效的代币地址 Invalid mint address: ${mint}`);
      }
      
      // 验证 mintPubkey 是否有效 Validate mintPubkey
      if (!mintPubkey || typeof mintPubkey.toBuffer !== 'function') {
        throw new Error(`mintPubkey 无效 Invalid mintPubkey`);
      }
      
      // 计算 curve_account 的 PDA 地址 Calculate curve_account PDA address
      const [curveAccountPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("borrowing_curve"), 
          mintPubkey.toBuffer()
        ],
        this.sdk.programId
      );

      // 使用 Anchor 程序直接获取账户数据 Use Anchor program to fetch account data directly
      let decodedData;
      try {
        decodedData = await this.sdk.program.account.borrowingBondingCurve.fetch(curveAccountPDA);
      } catch {
        // 如果 fetch 失败，使用原始方法 If fetch fails, use raw method
        const accountInfo = await this.sdk.connection.getAccountInfo(curveAccountPDA);
        if (!accountInfo) {
          throw new Error(`curve_account 不存在 curve_account does not exist`);
        }
        
        // 使用 BorshAccountsCoder 手动解码 Manually decode with BorshAccountsCoder
        const accountsCoder = new anchor.BorshAccountsCoder(this.sdk.program.idl);
        
        try {
          decodedData = accountsCoder.decode('BorrowingBondingCurve', accountInfo.data);
        } catch (decodeError1) {
          try {
            decodedData = accountsCoder.decode('borrowingBondingCurve', accountInfo.data);
          } catch {
            throw new Error(`无法解码账户数据 Cannot decode account data: ${decodeError1.message}`);
          }
        }
      }

      // 检查价格数据并返回 Check price data and return
      if (decodedData.price && decodedData.price.toString() !== '0') {
        return decodedData.price.toString();
      } else {
        // 如果没有价格数据，返回初始价格 If no price data, return initial price
        const initialPrice = CurveAMM.getInitialPrice();
        if (initialPrice === null) {
          throw new Error('price: 无法计算初始价格 Unable to calculate initial price');
        }
        return initialPrice.toString();
      }

    } catch (error) {
      // 如果获取失败，返回初始价格 If getting fails, return initial price
      console.warn(`price: 获取链上价格失败，使用初始价格 Failed to get chain price, using initial price: ${error.message}`);
      
      const initialPrice = CurveAMM.getInitialPrice();
      if (initialPrice === null) {
        throw new Error('price: 无法计算初始价格 Unable to calculate initial price');
      }
      return initialPrice.toString();
    }
  }

  /**
   * 获取订单数据（从链上读取）Get Orders Data (Read from Chain)
   * @param {string} mint - 代币地址 Token mint address
   * @param {Object} options - 查询参数 Query parameters
   * @param {string} options.type - 订单类型 Order type: "up_orders" (做空/short) 或 "down_orders" (做多/long)
   * @param {number} options.page - 页码，默认1 Page number, default 1
   * @param {number} options.limit - 每页数量，默认500，最大1000 Items per page, default 500, max 1000
   * @returns {Promise<Object>} 订单数据，包含原始订单列表 Order data with raw order list
   * 
   * @example
   * // 获取做多订单 Get long orders
   * const ordersData = await sdk.chain.orders('6ZDJtGFTzrF3FaN5uaqa1h8EexW7BtQd4FwA9Dt7m3ee', { type: 'down_orders' });
   * 
   * // 返回值示例 Return value example:
   * // {
   * //   "success": true,
   * //   "data": {
   * //     "orders": [
   * //       {
   * //         "order_type": "down_orders",                           // 订单类型字符串（转换后）
   * //         "mint": "6ZDJtGFTzrF3FaN5uaqa1h8EexW7BtQd4FwA9Dt7m3ee", // 代币地址
   * //         "user": "JD1eNPaJpbtejKfgimbLYLkvpsTHyYzKCCozVLGLS6zu",   // 用户地址
   * //         "lock_lp_start_price": "46618228118401293964111",        // LP 开始价格（字符串）
   * //         "lock_lp_end_price": "45827474968448818396222",         // LP 结束价格（字符串）
   * //         "lock_lp_sol_amount": 3299491609,                       // LP 锁定 SOL 数量（lamports）
   * //         "lock_lp_token_amount": 713848715669,                   // LP 锁定代币数量（最小单位）
   * //         "start_time": 1756352482,                               // 开始时间（Unix 时间戳）
   * //         "end_time": 1756525282,                                 // 结束时间（Unix 时间戳）
   * //         "margin_sol_amount": 571062973,                         // 保证金 SOL 数量（lamports）
   * //         "borrow_amount": 3860656108,                            // 借款数量（lamports）
   * //         "position_asset_amount": 713848715669,                  // 持仓资产数量（最小单位）
   * //         "borrow_fee": 300,                                      // 借款费用（基点，300 = 3%）
   * //         "order_pda": "5aVwYyzvC5Y2qykDgwG8o7EUwCrL8WgCJpgxoH3mihYb" // 订单 PDA 地址
   * //       }
   * //     ],
   * //     "total": 12,                                                // 总订单数量
   * //     "order_type": "down_orders",                                // 订单类型（字符串）
   * //     "mint_account": "6ZDJtGFTzrF3FaN5uaqa1h8EexW7BtQd4FwA9Dt7m3ee", // 查询的代币地址
   * //     "page": 1,                                                  // 当前页码
   * //     "limit": 50,                                                // 每页限制
   * //     "has_next": false,                                          // 是否有下一页
   * //     "has_prev": false                                           // 是否有上一页
   * //   },
   * //   "message": "Operation successful"                             // 操作结果消息
   * // }
   * 
   * // 使用工具方法处理数据 Use utility methods to process data:
   * const lpPairs = sdk.buildLpPairs(ordersData.data.orders);         // 构建 LP 配对数组
   * const orderAccounts = sdk.buildOrderAccounts(ordersData.data.orders); // 构建订单账户数组
   */
  async orders(mint, options = {}) {
    try {
      // 参数验证 Parameter validation
      if (!mint || typeof mint !== 'string') {
        throw new Error('orders: 代币地址必须是有效的字符串 mint address must be a valid string');
      }

      // 设置默认参数 Set default parameters
      const orderType = (options as any).type || 'down_orders';
      const page = (options as any).page || 1;
      const limit = Math.min((options as any).limit || 500, 1000); // 最大1000个

      // 验证订单类型 Validate order type
      if (!['up_orders', 'down_orders'].includes(orderType)) {
        throw new Error('orders: 订单类型必须是 "up_orders" 或 "down_orders" order type must be "up_orders" or "down_orders"');
      }

      // 将 API 类型转换为链表方向 Convert API type to linked list direction
      // "up_orders" = 做空订单 = upHead
      // "down_orders" = 做多订单 = downHead
      const direction = orderType === 'up_orders' ? 'upHead' : 'downHead';

      //console.log(`chain.orders: 获取 ${orderType} 订单，mint=${mint}, limit=${limit}`);

      // 获取 curve_account 数据以获取链表头部 Get curve_account data to get linked list head
      const curveData = await this.getCurveAccount(mint);
      const headAddress = curveData[direction];

      //console.log(`chain.orders: ${direction} 链表头部地址:`, headAddress || 'null');

      // 如果链表为空，返回空结果 If linked list is empty, return empty result
      if (!headAddress) {
        //console.log(`chain.orders: ${direction} 链表为空`);
        return {
          success: true,
          data: {
            orders: [],
            total: 0,
            order_type: orderType,
            mint_account: mint,
            page: page,
            limit: limit,
            has_next: false,
            has_prev: false
          },
          message: "Operation successful"
        };
      }

      // 遍历链表读取订单 Traverse linked list to read orders
      const orders = [];
      let currentAddress = new PublicKey(headAddress);
      let count = 0;

      //console.log(`chain.orders: 开始遍历链表，从 ${currentAddress.toString()} 开始`);

      while (currentAddress && count < limit) {
        try {
          // 获取原始账户数据 Get raw account data
          const accountInfo = await this.sdk.connection.getAccountInfo(currentAddress);
          if (!accountInfo) {
            throw new Error(`订单账户 ${currentAddress.toString()} 不存在 Order account does not exist`);
          }

          // 使用 BorshAccountsCoder 手动解码 Manually decode with BorshAccountsCoder
          const accountsCoder = new anchor.BorshAccountsCoder(this.sdk.program.idl);
          let orderData;
          
          try {
            orderData = accountsCoder.decode('MarginOrder', accountInfo.data);
          } catch (decodeError1) {
            try {
              orderData = accountsCoder.decode('marginOrder', accountInfo.data);
            } catch {
              throw new Error(`无法解码订单账户数据 Cannot decode order account data: ${decodeError1.message}`);
            }
          }

          // 数据转换 Data transformation
          const convertedOrder = {
            // 将链上数字转换为 API 字符串格式 Convert chain number to API string format
            order_type: orderData.orderType === 1 ? 'down_orders' : 'up_orders', // 1=做多=down_orders, 2=做空=up_orders
            mint: orderData.mint.toString(),
            user: orderData.user.toString(),
            // BN 类型转换为字符串 Convert BN type to string
            lock_lp_start_price: orderData.lockLpStartPrice.toString(),
            lock_lp_end_price: orderData.lockLpEndPrice.toString(),
            // 数值类型保持不变 Keep numeric types unchanged
            lock_lp_sol_amount: orderData.lockLpSolAmount.toNumber(),
            lock_lp_token_amount: orderData.lockLpTokenAmount.toNumber(),
            start_time: orderData.startTime,
            end_time: orderData.endTime,
            margin_sol_amount: orderData.marginSolAmount.toNumber(),
            borrow_amount: orderData.borrowAmount.toNumber(),
            position_asset_amount: orderData.positionAssetAmount.toNumber(),
            borrow_fee: orderData.borrowFee,
            // 添加 order_pda 字段 Add order_pda field
            order_pda: currentAddress.toString()
          };

          orders.push(convertedOrder);
          count++;

          //console.log(`chain.orders: 成功读取订单 ${count}: ${currentAddress.toString()}, 类型=${convertedOrder.order_type}`);

          // 移动到下一个节点 Move to next node
          if (orderData.nextOrder) {
            currentAddress = orderData.nextOrder;
            //console.log(`chain.orders: 下一个订单: ${currentAddress.toString()}`);
          } else {
            //console.log(`chain.orders: 链表结束，没有下一个节点`);
            break;
          }

        } catch (error) {
          // 如果订单账户不存在或读取失败，抛出错误 If order account doesn't exist or read fails, throw error
          throw new Error(`读取订单失败 Failed to read order: ${error.message}`);
        }
      }

      // 模拟分页信息 Simulate pagination info
      const hasNext = count === limit; // 如果读满了限制数量，可能还有更多 If read limit reached, might have more
      const hasPrev = page > 1;

      //console.log(`chain.orders: 完成读取，共获取 ${orders.length} 个订单`);

      // 返回与 fast.orders 相同的格式 Return same format as fast.orders
      return {
        success: true,
        data: {
          orders: orders,
          total: orders.length, // 链上无法知道总数，使用当前读取数量 Chain can't know total, use current count
          order_type: orderType,
          mint_account: mint,
          page: page,
          limit: limit,
          has_next: hasNext,
          has_prev: hasPrev
        },
        message: "Operation successful"
      };

    } catch (error) {
      // 错误处理 Error handling
      console.error('chain.orders: 获取订单失败', error.message);
      throw new Error(`获取订单失败 Failed to get orders: ${error.message}`);
    }
  }
}

export { ChainModule };