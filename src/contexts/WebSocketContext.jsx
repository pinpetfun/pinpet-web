import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { config } from '../config.js';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [klineData, setKlineData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const subscriptionsRef = useRef(new Map()); // 跟踪所有订阅

  // WebSocket连接管理
  const connectSocket = useCallback(() => {
    // 如果已经有socket实例（无论是否连接），直接返回
    if (socketRef.current) {
      console.log('🔗 复用现有Socket连接, 状态:', socketRef.current.connected ? '已连接' : '连接中');
      return socketRef.current;
    }

    const WEBSOCKET_URL = config.tradeQuoteWs || 'https://devtestapi.spin.pet';
    const WS_BASE_URL = WEBSOCKET_URL.endsWith('/kline') ? WEBSOCKET_URL.replace('/kline', '') : WEBSOCKET_URL;
    const NAMESPACE = '/kline';
    
    console.log('🔌 创建新的 WebSocket 连接:', `${WS_BASE_URL}${NAMESPACE}`);
    
    const socket = io(`${WS_BASE_URL}${NAMESPACE}`, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      // 心跳包配置
      pingTimeout: 60000,        // 60秒无响应则断开
      pingInterval: 25000,       // 每25秒发送一次心跳
      // 其他连接配置
      forceNew: false,           // 复用连接
      multiplex: true,           // 允许多路复用
    });

    // 连接事件
    socket.on('connect', () => {
      console.log('✅ WebSocket 已连接, Socket ID:', socket.id);
      setConnectionStatus('connected');
      
      // 重新订阅所有现有的订阅
      for (const [key, subscription] of subscriptionsRef.current) {
        console.log('🔄 重新订阅:', subscription);
        socket.emit('subscribe', subscription);
      }

      // 开始心跳测试
      console.log('✅ 连接成功，开始心跳测试');
      // 每30秒手动发送一次ping来测试
      const heartbeatInterval = setInterval(() => {
        if (socket.connected) {
          console.log('📤 手动发送心跳包');
          socket.emit('ping');
        } else {
          clearInterval(heartbeatInterval);
        }
      }, 30000);
      
      // 存储interval以便清理
      socket.heartbeatInterval = heartbeatInterval;
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket 断开连接:', reason);
      setConnectionStatus('disconnected');
      
      // 清理心跳间隔
      if (socket.heartbeatInterval) {
        clearInterval(socket.heartbeatInterval);
        socket.heartbeatInterval = null;
      }
    });

    socket.on('connect_error', (error) => {
      console.log('💥 连接错误:', error.message);
      setConnectionStatus('error');
    });

    // 数据事件
    socket.on('connection_success', (data) => {
      console.log('🎉 连接成功:', data);
    });

    socket.on('subscription_confirmed', (data) => {
      console.log('✅ 订阅确认:', data);
    });

    socket.on('history_data', (data) => {
      console.log('📈 收到历史数据:', {
        symbol: data.symbol,
        interval: data.interval,
        dataPoints: data.data?.length
      });
      
      if (data.data && data.data.length > 0) {
        const sortedData = data.data.sort((a, b) => a.time - b.time);
        
        const formattedData = sortedData.map(item => ({
          time: item.time,
          open: parseFloat(item.open),
          high: parseFloat(item.high),
          low: parseFloat(item.low),
          close: parseFloat(item.close)
        }));

        setKlineData(formattedData);
        setCurrentPrice(formattedData[formattedData.length - 1]?.close);
      }
    });

    socket.on('kline_data', (data) => {
      if (data.data) {
        console.log('🔔 收到实时K线数据:', {
          symbol: data.symbol,
          interval: data.interval,
          time: new Date(data.data.time * 1000).toISOString()
        });

        const newCandle = {
          time: data.data.time,
          open: parseFloat(data.data.open),
          high: parseFloat(data.data.high),
          low: parseFloat(data.data.low),
          close: parseFloat(data.data.close)
        };

        setCurrentPrice(newCandle.close);
        
        setKlineData(prevData => {
          const updatedData = [...prevData];
          const lastIndex = updatedData.length - 1;
          
          if (lastIndex >= 0 && updatedData[lastIndex].time === newCandle.time) {
            updatedData[lastIndex] = newCandle;
          } else {
            updatedData.push(newCandle);
          }
          
          return updatedData;
        });

        // 触发自定义事件，通知其他组件有新数据
        window.dispatchEvent(new CustomEvent('kline_update', { 
          detail: { newCandle, symbol: data.symbol, interval: data.interval } 
        }));
      }
    });

    socket.on('error', (error) => {
      console.log('❌ WebSocket 错误:', error);
    });

    // 心跳包监听 (用于调试)
    socket.on('ping', () => {
      console.log('💓 收到服务器 ping');
    });

    socket.on('pong', (ms) => {
      console.log('💗 收到服务器 pong, 延迟:', ms, 'ms');
    });

    // Socket.IO 引擎级别的心跳包事件
    socket.io.engine.on('ping', () => {
      console.log('💓 引擎级别 ping');
    });

    socket.io.engine.on('pong', () => {
      console.log('💗 引擎级别 pong');
    });

    // 监听历史事件数据
    socket.on('history_event_data', (data) => {
      console.log('📈 收到历史事件数据:', {
        symbol: data.symbol,
        eventCount: data.data?.length,
        hasMore: data.has_more,
        totalCount: data.total_count
      });
      
      if (data.data && data.data.length > 0) {
        // 触发自定义事件，传递历史事件数据
        window.dispatchEvent(new CustomEvent('history_events_update', {
          detail: {
            symbol: data.symbol,
            events: data.data,
            hasMore: data.has_more,
            totalCount: data.total_count
          }
        }));
      }
    });

    // 监听实时事件数据
    socket.on('event_data', (data) => {
      console.log('🔔 收到实时事件数据:', {
        symbol: data.symbol,
        eventType: data.event_type,
        timestamp: new Date(data.timestamp).toISOString()
      });
      
      // 触发自定义事件，传递实时事件数据
      window.dispatchEvent(new CustomEvent('event_update', {
        detail: {
          symbol: data.symbol,
          eventType: data.event_type,
          eventData: data.event_data,
          timestamp: data.timestamp
        }
      }));
    });


    // 连接质量监听
    socket.on('connect_error', (error) => {
      console.log('💥 连接错误:', error.message);
      setConnectionStatus('error');
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 重连成功, 尝试次数:', attemptNumber);
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 尝试重连, 第', attemptNumber, '次');
    });

    socket.on('reconnect_error', (error) => {
      console.log('💥 重连失败:', error.message);
    });

    socket.on('reconnect_failed', () => {
      console.log('💥 重连失败，已达到最大重试次数');
      setConnectionStatus('failed');
    });

    socketRef.current = socket;
    return socket;
  }, []);

  // 订阅数据
  const subscribe = useCallback((subscriptionConfig) => {
    const socket = connectSocket();
    const key = `${subscriptionConfig.symbol}_${subscriptionConfig.interval}`;
    
    if (!subscriptionsRef.current.has(key)) {
      subscriptionsRef.current.set(key, subscriptionConfig);
      
      if (socket.connected) {
        console.log('📤 订阅实时数据:', subscriptionConfig);
        socket.emit('subscribe', subscriptionConfig);
      }
    }
  }, []);

  // 取消订阅
  const unsubscribe = useCallback((symbol, interval) => {
    const key = `${symbol}_${interval}`;
    const subscription = subscriptionsRef.current.get(key);
    
    if (subscription && socketRef.current) {
      console.log('📤 取消订阅:', { symbol, interval });
      socketRef.current.emit('unsubscribe', { symbol, interval });
      subscriptionsRef.current.delete(key);
    }
  }, []);

  // 获取历史数据
  const getHistoryData = useCallback((symbol, interval, limit = 50) => {
    const socket = connectSocket();
    
    if (socket.connected) {
      console.log('📤 请求历史数据:', { symbol, interval, limit });
      socket.emit('history', { symbol, interval, limit });
    }
  }, []);

  // 清除数据
  const clearData = useCallback(() => {
    setKlineData([]);
    setCurrentPrice(null);
  }, []);

  // 清理连接
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('👋 断开 WebSocket 连接');
      
      // 取消所有订阅
      for (const [key, subscription] of subscriptionsRef.current) {
        socketRef.current.emit('unsubscribe', {
          symbol: subscription.symbol,
          interval: subscription.interval
        });
      }
      
      subscriptionsRef.current.clear();
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnectionStatus('disconnected');
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const contextValue = {
    // 状态
    connectionStatus,
    klineData,
    currentPrice,
    socket: socketRef.current,
    
    // 方法
    subscribe,
    unsubscribe,
    getHistoryData,
    clearData,
    disconnect
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};