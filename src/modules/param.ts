import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

/**
 * 参数模块
 * 处理合作伙伴参数的创建和管理
 */
class ParamModule {
  private sdk: any;

  constructor(sdk: any) {
    this.sdk = sdk;
  }

  /**
   * 创建合作伙伴参数
   * @param {Object} params - 创建参数
   * @param {PublicKey} params.partner - 合作伙伴公钥
   * @returns {Promise<Object>} 包含交易对象、签名者和账户信息的对象
   */
  async createParams({ partner }) {
    console.log('Param Module - CreateParams:', { 
      partner: partner.toString()
    });

    // 计算 Admin 账户地址（全网唯一）
    const [adminAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("admin")],
      this.sdk.programId
    );

    // 计算合作伙伴参数账户地址（使用合作伙伴地址作为种子）
    const [paramsAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("params"), partner.toBuffer()],
      this.sdk.programId
    );

    console.log('计算的账户地址:');
    console.log('  Admin账户:', adminAccount.toString());
    console.log('  合作伙伴参数账户:', paramsAccount.toString());

    // 创建交易指令
    const createParamsIx = await this.sdk.program.methods
      .createParams()
      .accounts({
        partner: partner,
        adminAccount: adminAccount,
        params: paramsAccount,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    // 创建交易并添加指令
    const transaction = new Transaction();
    transaction.add(createParamsIx);
    
    console.log('合作伙伴参数创建交易已构建');
    
    return {
      transaction,
      signers: [], // createParams 不需要额外的签名者，只需要 partner 签名
      accounts: {
        partner,
        adminAccount,
        paramsAccount
      }
    };
  }

  /**
   * 获取合作伙伴参数账户数据
   * @param {PublicKey} partner - 合作伙伴公钥
   * @returns {Promise<Object>} 参数账户数据
   */
  async getParams(partner) {
    // 计算合作伙伴参数账户地址
    const [paramsAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("params"), partner.toBuffer()],
      this.sdk.programId
    );

    try {
      // 检查账户是否存在
      const accountInfo = await this.sdk.connection.getAccountInfo(paramsAccount);
      if (!accountInfo) {
        throw new Error('合作伙伴参数账户不存在');
      }
      
      // 尝试使用 Anchor 解析数据
      if (this.sdk.program.account.params) {
        const paramsData = await this.sdk.program.account.params.fetch(paramsAccount);
        return {
          address: paramsAccount,
          data: paramsData
        };
      } else {
        // 如果 Anchor 不可用，返回基本信息
        return {
          address: paramsAccount,
          accountInfo: accountInfo
        };
      }
    } catch (error) {
      throw new Error(`获取合作伙伴参数失败: ${error.message}`);
    }
  }

  /**
   * 获取 Admin 账户数据
   * @returns {Promise<Object>} Admin 账户数据
   */
  async getAdmin() {
    // 计算 Admin 账户地址
    const [adminAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("admin")],
      this.sdk.programId
    );

    try {
      // 检查账户是否存在
      const accountInfo = await this.sdk.connection.getAccountInfo(adminAccount);
      if (!accountInfo) {
        throw new Error('Admin账户不存在');
      }
      
      // 尝试使用 Anchor 解析数据
      if (this.sdk.program.account.admin) {
        const adminData = await this.sdk.program.account.admin.fetch(adminAccount);
        return {
          address: adminAccount,
          data: adminData
        };
      } else {
        // 如果 Anchor 不可用，返回基本信息
        return {
          address: adminAccount,
          accountInfo: accountInfo
        };
      }
    } catch (error) {
      throw new Error(`获取Admin账户失败: ${error.message}`);
    }
  }

  /**
   * 计算合作伙伴参数账户地址
   * @param {PublicKey} partner - 合作伙伴公钥
   * @returns {PublicKey} 参数账户地址
   */
  getParamsAddress(partner) {
    const [paramsAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("params"), partner.toBuffer()],
      this.sdk.programId
    );
    return paramsAccount;
  }

  /**
   * 计算 Admin 账户地址
   * @returns {PublicKey} Admin 账户地址
   */
  getAdminAddress() {
    const [adminAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("admin")],
      this.sdk.programId
    );
    return adminAccount;
  }
}

export { ParamModule };
