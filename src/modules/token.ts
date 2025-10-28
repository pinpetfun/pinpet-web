import { PublicKey, Transaction, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

/**
 * 代币模块
 * 处理代币创建、查询、余额等操作
 */
class TokenModule {
  private sdk: any;

  constructor(sdk: any) {
    this.sdk = sdk;
  }

  /**
   * 创建新代币
   * @param {Object} params - 创建参数
   * @param {Keypair} params.mint - 代币 mint 密钥对
   * @param {string} params.name - 代币名称
   * @param {string} params.symbol - 代币符号
   * @param {string} params.uri - 元数据 URI
   * @param {PublicKey} params.payer - 创建者公钥（支付者）
   * @returns {Promise<Object>} 包含交易对象、签名者和账户信息的对象
   */
  async create({ 
    mint, 
    name, 
    symbol, 
    uri, 
    payer
  }) {
    console.log('Token Module - Create:', { 
      mint: mint.publicKey.toString(), 
      name, 
      symbol, 
      uri, 
      payer: payer.toString()
    });
    
    // 计算借贷流动池账户地址 (borrowing_curve)
    const [curveAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("borrowing_curve"),
        mint.publicKey.toBuffer(),
      ],
      this.sdk.programId
    );

    // 计算流动池代币账户地址 (pool_token)
    const [poolTokenAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("pool_token"),
        mint.publicKey.toBuffer(),
      ],
      this.sdk.programId
    );
    
    // 计算流动池SOL账户地址 (pool_sol)
    const [poolSolAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("pool_sol"),
        mint.publicKey.toBuffer(),
      ],
      this.sdk.programId
    );

    console.log('计算的账户地址:');
    console.log('  借贷流动池账户:', curveAccount.toString());
    console.log('  流动池代币账户:', poolTokenAccount.toString());
    console.log('  流动池SOL账户:', poolSolAccount.toString());
    console.log('  参数账户:', this.sdk.paramsAccount?.toString() || '未设置');

    // 验证必要的配置
    if (!this.sdk.paramsAccount) {
      throw new Error('SDK 未配置 paramsAccount，请在初始化时提供 params_account 配置');
    }

    // 创建交易指令
    const createIx = await this.sdk.program.methods
      .create(name, symbol, uri)
      .accounts({
        payer: payer,
        mintAccount: mint.publicKey,
        curveAccount: curveAccount,
        poolTokenAccount: poolTokenAccount,
        poolSolAccount: poolSolAccount,
        params: this.sdk.paramsAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .instruction();

    // 创建交易并添加指令
    const transaction = new Transaction();
    transaction.add(createIx);
    
    console.log('代币创建交易已构建，需要签名者:', [payer.toString(), mint.publicKey.toString()]);
    
    return {
      transaction,
      signers: [mint], // mint keypair 需要作为签名者
      accounts: {
        mint: mint.publicKey,
        curveAccount,
        poolTokenAccount,
        poolSolAccount,
        payer
      }
    };
  }


}

export { TokenModule };
