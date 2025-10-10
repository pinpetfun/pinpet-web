// 环境变量配置
export const config = {
  serverUrl: import.meta.env.VITE_SERVER_URL,
  gatewayUrl: import.meta.env.VITE_GATEWAY_URL,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
}

// 验证必需的环境变量
if (!config.serverUrl) {
  throw new Error('VITE_SERVER_URL is required')
}

if (!config.gatewayUrl) {
  throw new Error('VITE_GATEWAY_URL is required')
}