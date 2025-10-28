import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext.jsx';

const WebSocketDebug = () => {
  const { connectionStatus, socket } = useWebSocket();
  const [debugInfo, setDebugInfo] = useState({
    socketId: null,
    transport: null,
    pingCount: 0,
    pongCount: 0,
    lastPing: null,
    lastPong: null
  });

  useEffect(() => {
    if (!socket) return;

    // 监听Socket事件更新调试信息
    const updateSocketInfo = () => {
      setDebugInfo(prev => ({
        ...prev,
        socketId: socket?.id || null,
        transport: socket?.io?.engine?.transport?.name || null
      }));
    };

    const handlePing = () => {
      console.log('💓 客户端收到 ping 事件');
      setDebugInfo(prev => ({
        ...prev,
        pingCount: prev.pingCount + 1,
        lastPing: new Date().toLocaleTimeString()
      }));
    };

    const handlePong = (latency?: number) => {
      console.log('💗 客户端收到 pong 事件, 延迟:', latency);
      setDebugInfo(prev => ({
        ...prev,
        pongCount: prev.pongCount + 1,
        lastPong: `${new Date().toLocaleTimeString()} ${latency ? `(${latency}ms)` : ''}`
      }));
    };

    // Socket.IO 的心跳包事件监听
    socket.on('connect', updateSocketInfo);
    socket.on('ping', handlePing);
    socket.on('pong', handlePong);
    
    // Socket.IO 引擎级别的心跳包事件
    if (socket.io?.engine) {
      socket.io.engine.on('ping', handlePing);
      socket.io.engine.on('pong', handlePong);
    }
    
    // 初始化信息
    updateSocketInfo();

    return () => {
      socket.off('connect', updateSocketInfo);
      socket.off('ping', handlePing);
      socket.off('pong', handlePong);
      
      // 清理引擎级别事件监听
      if (socket.io?.engine) {
        socket.io.engine.off('ping', handlePing);
        socket.io.engine.off('pong', handlePong);
      }
    };
  }, [socket]);

  return (
    <div className="fixed top-4 right-4 bg-white border-2 border-black rounded-lg p-4 cartoon-shadow z-50 text-xs font-mono">
      <h3 className="font-nunito font-bold mb-2">WebSocket Debug</h3>
      <div className="space-y-1">
        <div>状态: <span className={`font-bold ${connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
          {connectionStatus}
        </span></div>
        <div>Socket ID: {debugInfo.socketId || 'N/A'}</div>
        <div>传输方式: {debugInfo.transport || 'N/A'}</div>
        <div>Ping 次数: {debugInfo.pingCount}</div>
        <div>Pong 次数: {debugInfo.pongCount}</div>
        <div>最后 Ping: {debugInfo.lastPing || 'N/A'}</div>
        <div>最后 Pong: {debugInfo.lastPong || 'N/A'}</div>
      </div>
    </div>
  );
};

export default WebSocketDebug;