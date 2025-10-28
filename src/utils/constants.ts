/**
 * @file SpinPet SDK 默认配置常量
 * @description 包含网络配置和默认选项的常量定义
 */

/**
 * @interface NetworkConfig
 * @description 网络配置接口
 */
interface NetworkConfig {
  name: string;
  defaultDataSource: 'chain' | 'fast';
  solanaEndpoint: string;
  spin_fast_api_url: string;
  fee_recipient: string;
  base_fee_recipient: string;
  params_account: string;
}

/**
 * @type NetworkName
 * @description 网络名称类型
 */
type NetworkName = 'MAINNET' | 'TESTNET' | 'LOCALNET';

/**
 * @constant DEFAULT_NETWORKS
 * @description 默认网络配置
 */
const DEFAULT_NETWORKS: Record<NetworkName, NetworkConfig> = {
  MAINNET: {
    name: 'mainnet-beta',
    defaultDataSource: 'chain',
    solanaEndpoint: 'https://api.mainnet-beta.solana.com',
    spin_fast_api_url: 'https://api.spinpet.com',
    fee_recipient: '4nffmKaNrex34LkJ99RLxMt2BbgXeopUi8kJnom3YWbv',
    base_fee_recipient: '8fJpd2nteqkTEnXf4tG6d1MnP9p71KMCV4puc9vaq6kv',
    params_account: 'DVRnPDW1MvUhRhDfE1kU6aGHoQoufBCmQNbqUH4WFgUd'
  },
  TESTNET: {
    name: 'testnet',
    defaultDataSource: 'chain',
    solanaEndpoint: 'https://api.testnet.solana.com',
    spin_fast_api_url: 'https://api-testnet.spinpet.com',
    fee_recipient: '4nffmKaNrex34LkJ99RLxMt2BbgXeopUi8kJnom3YWbv',
    base_fee_recipient: '8fJpd2nteqkTEnXf4tG6d1MnP9p71KMCV4puc9vaq6kv',
    params_account: 'DVRnPDW1MvUhRhDfE1kU6aGHoQoufBCmQNbqUH4WFgUd'
  },
  LOCALNET: {
    name: 'localnet',
    defaultDataSource: 'chain', // 'fast' 或 'chain'
    solanaEndpoint: 'http://192.168.18.36:8899',
    spin_fast_api_url: 'http://192.168.18.36:8080',
    fee_recipient: '4nffmKaNrex34LkJ99RLxMt2BbgXeopUi8kJnom3YWbv',
    base_fee_recipient: '3gaT9ExzGSuEmJegNAUM3hFzoKzYE2BSHut61jMWn7AV',
    params_account: 'DVRnPDW1MvUhRhDfE1kU6aGHoQoufBCmQNbqUH4WFgUd'
  }
};

/**
 * @function getDefaultOptions
 * @description 获取默认配置
 * @param {NetworkName} networkName - 网络名称，默认为'LOCALNET'
 * @returns {NetworkConfig} 网络配置对象
 */
function getDefaultOptions(networkName: NetworkName = 'LOCALNET'): NetworkConfig {
  const networkConfig = DEFAULT_NETWORKS[networkName];

  return {
    ...networkConfig
  };
}

export {
  getDefaultOptions,
  DEFAULT_NETWORKS,
  type NetworkConfig,
  type NetworkName
};