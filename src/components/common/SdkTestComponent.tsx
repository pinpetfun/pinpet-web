import React, { useState, useEffect } from 'react';
import { usePinPetSdk } from '../../contexts/PinPetSdkContext';
import { usePinPetData } from '../../hooks/usePinPetData';

interface TestResults {
  timestamp?: number|string;
  status?: any;
  data?: {
    success: boolean;
    error?: string;
    mints?: {
      data?: {
        mints?: Array<any>;
      };
    };
    mintInfo?: {
      data?: {
        details?: Array<{
          name?: string;
          symbol?: string;
        }>;
      };
    };
    price?: string;
  };
}

const SdkTestComponent = () => {
  const { 
    sdk, 
    status, 
    error, 
    isReady, 
    isError, 
    isInitializing, 
    canTrade, 
    connected, 
    walletAddress,
    config 
  } = usePinPetSdk();

  const {
    getMints,
    getMintInfo,
    getPrice,
    loading: dataLoading,
    error: _dataError
  } = usePinPetData();

  const [testResults, setTestResults] = useState<TestResults>({});
  const [testing, setTesting] = useState(false);

  // 基础 SDK 状态测试
  const testSdkStatus = () => {
    return {
      sdkExists: !!sdk,
      status,
      isReady,
      isError,
      isInitializing,
      canTrade,
      connected,
      hasWalletAddress: !!walletAddress,
      configExists: !!config,
      errorMessage: error?.message || null
    };
  };

  // 测试数据获取功能
  const testDataFunctions = async () => {
    if (!isReady) {
      return { error: 'SDK 未准备好' };
    }

    try {
      setTesting(true);
      
      // 测试获取代币列表
      console.log('测试获取代币列表...');
      const mintsResult = await getMints({ limit: 5 });
      
      let mintInfoResult = null;
      let priceResult = null;
      
      // 如果有代币，测试获取详情和价格
      if (mintsResult?.data?.mints?.length > 0) {
        const firstMint = mintsResult.data.mints[0];
        
        console.log('测试获取代币详情...', firstMint);
        mintInfoResult = await getMintInfo(firstMint);
        
        console.log('测试获取代币价格...', firstMint);
        priceResult = await getPrice(firstMint);
      }

      return {
        success: true,
        mints: mintsResult,
        mintInfo: mintInfoResult,
        price: priceResult
      };

    } catch (err) {
      console.error('数据测试失败:', err);
      return {
        success: false,
        error: err.message
      };
    } finally {
      setTesting(false);
    }
  };

  // 运行所有测试
  const runTests = async () => {
    console.log('开始运行 SDK 测试...');
    
    const statusTest = testSdkStatus();
    console.log('SDK 状态测试:', statusTest);
    
    let dataTest = null;
    if (statusTest.isReady) {
      dataTest = await testDataFunctions();
      console.log('数据功能测试:', dataTest);
    }

    setTestResults({
      status: statusTest,
      data: dataTest,
      timestamp: new Date().toISOString()
    });
  };

  // 自动运行测试
  useEffect(() => {
    if (isReady && !testing) {
      runTests();
    }
  }, [isReady]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'initializing': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ready': return '✅ 就绪';
      case 'error': return '❌ 错误';
      case 'initializing': return '⏳ 初始化中';
      default: return '❓ 未知';
    }
  };

  return (
    <div className="p-6 bg-gray-50 rounded-lg border-2 border-gray-200 max-w-4xl mx-auto mt-8">
      <h2 className="text-2xl font-nunito mb-6 text-gray-900">PinPet SDK 测试面板</h2>
      
      {/* SDK 状态部分 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">SDK 状态</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-600">状态</div>
            <div className={`font-semibold ${getStatusColor(status)}`}>
              {getStatusText(status)}
            </div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-600">钱包连接</div>
            <div className={connected ? 'text-green-600' : 'text-red-600'}>
              {connected ? '✅ 已连接' : '❌ 未连接'}
            </div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-600">可交易</div>
            <div className={canTrade ? 'text-green-600' : 'text-red-600'}>
              {canTrade ? '✅ 可以' : '❌ 不可以'}
            </div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-600">网络</div>
            <div className="text-blue-600">
              {config?.network || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* 钱包信息 */}
      {walletAddress && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">钱包信息</h3>
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-600">地址</div>
            <div className="font-mono text-sm break-all">
              {walletAddress.toString()}
            </div>
          </div>
        </div>
      )}

      {/* 错误信息 */}
      {error && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-red-600">错误信息</h3>
          <div className="bg-red-50 border border-red-200 p-3 rounded">
            <div className="text-red-700">{error.message}</div>
          </div>
        </div>
      )}

      {/* 测试控制 */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={runTests}
            disabled={!isReady || testing || dataLoading}
            className="btn-cartoon bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2"
          >
            {testing || dataLoading ? '测试中...' : '运行测试'}
          </button>
          
          {testResults.timestamp && (
            <div className="text-sm text-gray-500">
              最后测试: {new Date(testResults.timestamp).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* 测试结果 */}
      {testResults.data && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">测试结果</h3>
          
          {testResults.data.success ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 p-3 rounded">
                <div className="text-green-700">✅ 数据功能测试通过</div>
              </div>

              {testResults.data.mints && (
                <div className="bg-white p-3 rounded border">
                  <div className="text-sm font-semibold mb-2">代币列表</div>
                  <div className="text-sm text-gray-600">
                    获取到 {testResults.data.mints.data?.mints?.length || 0} 个代币
                  </div>
                  {testResults.data.mints.data?.mints?.slice(0, 3).map((mint, index) => (
                    <div key={index} className="font-mono text-xs text-gray-500 truncate">
                      {mint}
                    </div>
                  ))}
                </div>
              )}

              {testResults.data.mintInfo && (
                <div className="bg-white p-3 rounded border">
                  <div className="text-sm font-semibold mb-2">代币详情</div>
                  <div className="text-sm">
                    名称: {testResults.data.mintInfo.data?.details?.[0]?.name || 'N/A'}
                  </div>
                  <div className="text-sm">
                    符号: {testResults.data.mintInfo.data?.details?.[0]?.symbol || 'N/A'}
                  </div>
                </div>
              )}

              {testResults.data.price && (
                <div className="bg-white p-3 rounded border">
                  <div className="text-sm font-semibold mb-2">价格信息</div>
                  <div className="font-mono text-sm">
                    {testResults.data.price || 'N/A'}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 p-3 rounded">
              <div className="text-red-700">❌ 测试失败: {testResults.data.error}</div>
            </div>
          )}
        </div>
      )}

      {/* 配置信息 */}
      {config && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">配置信息</h3>
          <div className="bg-white p-3 rounded border text-sm">
            <div>RPC URL: {config.rpcUrl}</div>
            <div>网络: {config.network}</div>
            <div>数据源: {config.defaultDataSource}</div>
            <div>提交级别: {config.commitment}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SdkTestComponent;