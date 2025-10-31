import React, { useState, useRef, useEffect } from 'react';
import { createChart, CandlestickSeries, ColorType } from 'lightweight-charts';
import { ChevronDownIcon, ChartBarIcon, ArrowsPointingOutIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useWebSocket } from '../../contexts/WebSocketContext.jsx';
import { useTradingData } from '../../hooks/useTradingData.ts';

const TradingChart = ({ tokenName = "BRONK", _tokenPrice = "0.0000007411", mintAddress }) => {
  // 获取 mintInfo 数据
  const { mintInfo, mintInfoLoading } = useTradingData(mintAddress);
  
  // 生成显示文本
  const getTokenDisplayText = () => {
    if (mintInfoLoading) {
      return 'Loading...';
    }
    
    if (mintInfo && mintInfo.symbol && mintInfo.name) {
      return `${mintInfo.symbol} - ${mintInfo.name}`;
    }
    
    // fallback to original text
    return `${tokenName} WSOL - 5 - LetsBonk.fun`;
  };
  
  // 从localStorage读取初始值，如果没有则默认为'5m'
  const [selectedTimeframe, setSelectedTimeframe] = useState(() => {
    const saved = localStorage.getItem('trading-chart-timeframe');
    return saved || '5m';
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Chart相关refs
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  
  // 使用WebSocket Context
  const { _connectionStatus, klineData, currentPrice, subscribe, unsubscribe, getHistoryData, clearData } = useWebSocket();

  const timeframeOptions = [
    { value: '1s', label: '1s' },
    { value: '30s', label: '30s' },
    { value: '5m', label: '5m' }
  ];

  // 时间周期转换函数
  const getServerTimeframe = (clientTimeframe) => {
    const mapping = {
      '1s': 's1',
      '30s': 's30',
      '5m': 'm5'
    };
    return mapping[clientTimeframe] || 's1';
  };

  // Unicode下标数字映射
  const getSubscriptNumber = (num) => {
    const subscripts = {
      '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
      '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
    };
    return num.toString().split('').map(digit => subscripts[digit]).join('');
  };

  // 智能价格格式化函数 - 使用下标表示连续零
  const formatPrice = (price) => {
    if (!price || isNaN(price)) return '0';
    
    const num = parseFloat(price);
    if (num === 0) return '0';
    
    // 对于极小的数字，先转换为固定小数位数，避免科学计数法
    let str;
    if (Math.abs(num) < 1e-15) {
      return '0';  // 太小的数字直接显示为0
    } else if (Math.abs(num) < 1e-6) {
      str = num.toFixed(15);  // 用足够的精度转换
    } else {
      str = num.toString();
    }
    
    // 检查是否是小数且有连续的前导零
    if (str.includes('.') && Math.abs(num) < 1) {
      const parts = str.split('.');
      const decimal = parts[1];
      
      // 查找连续的前导零
      let zeroCount = 0;
      for (let i = 0; i < decimal.length; i++) {
        if (decimal[i] === '0') {
          zeroCount++;
        } else {
          break;
        }
      }
      
      // 如果连续0超过3个，使用下标表示
      if (zeroCount > 3) {
        const significantPart = decimal.substring(zeroCount);
        const subscriptNumber = getSubscriptNumber(zeroCount);
        
        // 确保至少显示5位有效数字，最多显示8位
        let trimmedSignificant = significantPart;
        if (trimmedSignificant.length < 5) {
          // 如果不足5位，保持原样
          trimmedSignificant = significantPart;
        } else if (trimmedSignificant.length > 8) {
          // 如果超过8位，截取到8位
          trimmedSignificant = significantPart.substring(0, 8);
        }
        
        // 去除尾部0，但确保至少保留5位
        const withoutTrailingZeros = trimmedSignificant.replace(/0+$/, '');
        const finalSignificant = withoutTrailingZeros.length >= 5 ? 
          withoutTrailingZeros : 
          trimmedSignificant.substring(0, 5);
        
        return `0.0${subscriptNumber}${finalSignificant}`;
      }
    }
    
    // 正常情况的格式化
    if (Math.abs(num) >= 0.001) {
      return num.toFixed(6).replace(/\.?0+$/, '');
    } else {
      return num.toFixed(8).replace(/\.?0+$/, '');
    }
  };

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTimeframeSelect = (timeframe) => {
    setSelectedTimeframe(timeframe);
    setIsDropdownOpen(false);
    // 保存到localStorage
    localStorage.setItem('trading-chart-timeframe', timeframe);
    
    // 切换时间周期时重新订阅
    if (mintAddress) {
      const oldServerTimeframe = getServerTimeframe(selectedTimeframe);
      const newServerTimeframe = getServerTimeframe(timeframe);
      
      console.log('🔄 切换时间周期:', { from: oldServerTimeframe, to: newServerTimeframe });
      
      // 取消之前的订阅
      unsubscribe(mintAddress, oldServerTimeframe);
      
      // 清除当前数据和图表
      clearData();
      if (candlestickSeriesRef.current) {
        candlestickSeriesRef.current.setData([]);
      }
      
      // 重新订阅新的时间周期
      setTimeout(() => {
        console.log('📤 重新订阅:', { symbol: mintAddress, interval: newServerTimeframe });
        subscribe({
          symbol: mintAddress,
          interval: newServerTimeframe,
          subscription_id: `chart_switch_${Date.now()}`
        });
      }, 500);
      
      // 获取新的历史数据
      setTimeout(() => {
        console.log('📤 重新请求历史数据:', { symbol: mintAddress, interval: newServerTimeframe });
        getHistoryData(mintAddress, newServerTimeframe, 50);
      }, 1500);
    }
  };

  // 图表初始化
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth || 800,
      height: 450,
      layout: {
        background: { type: ColorType.Solid, color: '#1a1a1a' },
        textColor: '#ffffff',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.1)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.1)' },
      },
      crosshair: { mode: 0 },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.3)',
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.3)',
        timeVisible: true,
        secondsVisible: true,
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      priceFormat: {
        type: 'custom',
        minMove: 0.000000000001,
        formatter: formatPrice
      },
    });

    // 存储引用
    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;

    // 处理窗口大小变化
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth || 800 });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // WebSocket 订阅和数据处理
  useEffect(() => {
    if (!mintAddress) return;

    const serverTimeframe = getServerTimeframe(selectedTimeframe);
    
    console.log('🔄 TradingChart 订阅:', { mintAddress, serverTimeframe });
    
    // 订阅实时数据
    setTimeout(() => {
      subscribe({
        symbol: mintAddress,
        interval: serverTimeframe,
        subscription_id: `chart_${Date.now()}`
      });
    }, 1000);
    
    // 获取历史数据
    setTimeout(() => {
      getHistoryData(mintAddress, serverTimeframe, 50);
    }, 2000);

    return () => {
      console.log('🧹 TradingChart 清理订阅:', { mintAddress, serverTimeframe });
      unsubscribe(mintAddress, serverTimeframe);
    };
  }, [mintAddress, selectedTimeframe, subscribe, unsubscribe, getHistoryData]);

  // 更新图表数据
  useEffect(() => {
    if (candlestickSeriesRef.current && klineData.length > 0) {
      candlestickSeriesRef.current.setData(klineData);
      console.log('✅ 图表已更新数据, 数据点数量:', klineData.length);
    }
  }, [klineData]);

  // 监听实时数据更新
  useEffect(() => {
    const handleKlineUpdate = (event) => {
      const { newCandle, symbol, interval } = event.detail;
      const currentServerTimeframe = getServerTimeframe(selectedTimeframe);
      
      // 只处理当前代币和时间周期的数据
      if (symbol === mintAddress && interval === currentServerTimeframe && candlestickSeriesRef.current) {
        candlestickSeriesRef.current.update(newCandle);
        console.log('📊 图表实时更新:', newCandle);
      }
    };

    window.addEventListener('kline_update', handleKlineUpdate);
    
    return () => {
      window.removeEventListener('kline_update', handleKlineUpdate);
    };
  }, [mintAddress, selectedTimeframe]);

  return (
    <div className="bg-white border-4 border-black rounded-2xl p-6 cartoon-shadow">
      {/* Chart Header */}
      <div className="flex items-center justify-between border-b-2 border-gray-200 pb-3 mb-4">
        <div className="flex items-center space-x-4 text-base font-nunito">
          {/* 时间间隔选择器 */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center px-3 py-1 bg-orange-300 hover:bg-orange-400 border-2 border-black rounded-lg transition-all duration-200 font-nunito font-bold text-black cartoon-shadow hover:shadow-cartoon-sm active:translate-y-0.5"
            >
              {selectedTimeframe}
              <ChevronDownIcon className={`h-4 w-4 ml-1 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* 下拉菜单 */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white border-3 border-black rounded-lg cartoon-shadow z-50 min-w-[80px] overflow-hidden">
                {timeframeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleTimeframeSelect(option.value)}
                    className={`w-full px-4 py-2 text-left font-nunito font-bold transition-colors duration-150 hover:bg-orange-200 ${
                      selectedTimeframe === option.value 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'text-black hover:text-orange-800'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button className="text-gray-600 hover:text-black transition-colors flex items-center">
            <ChartBarIcon className="h-4 w-4 mr-1" />
            Indicators
          </button>
          
          {/* Token Name */}
          <h2 className="text-xl font-nunito text-black ml-6">{getTokenDisplayText()}</h2>
        </div>
        <div className="flex items-center space-x-4">
          {/* 当前价格 */}
          {currentPrice && (
            <div className="text-lg font-bold text-gray-800">
              ${formatPrice(currentPrice)}
            </div>
          )}
          
          <button className="text-gray-600 hover:text-black">
            <ArrowsPointingOutIcon className="h-6 w-6" />
          </button>
        </div>
      </div>


      {/* Chart Area */}
      <div className="relative">
        <div className="border-2 border-black rounded-lg overflow-hidden">
          <div ref={chartContainerRef} className="w-full h-[450px]" />
        </div>
        
        {/* Chart Info Banner - TODO: 后面可能需要重新启用缩放提示功能 */}
        {/* <div className="absolute bottom-4 left-4 right-4 bg-blue-200 text-blue-900 text-sm px-4 py-2 rounded-lg flex justify-between items-center border-2 border-blue-900 cartoon-shadow">
          <span className="font-nunito">When you want to zoom in/out the vertical scale of the candlestick chart, please hold the CTRL key.</span>
          <button className="text-blue-900 hover:text-blue-700">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default TradingChart;