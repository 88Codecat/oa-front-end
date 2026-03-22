// WebSocket 客户端封装
import { io } from 'socket.io-client';

class WebSocketClient {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.userId = null;
        this.username = null;
        this.listeners = new Map();
    }

    // 初始化连接
    connect(token, userId, username) {
        if (this.socket?.connected) {
            console.log('WebSocket 已连接');
            return;
        }

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        
        this.socket = io(apiUrl, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        this.socket.on('connect', () => {
            console.log('WebSocket 连接成功');
            this.connected = true;
            this.userId = userId;
            this.username = username;

            // 通知服务器用户上线
            this.socket.emit('user:connect', { userId, username });
        });

        this.socket.on('disconnect', () => {
            console.log('WebSocket 连接断开');
            this.connected = false;
        });

        this.socket.on('connect_error', (error) => {
            console.error('WebSocket 连接错误:', error);
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log(`WebSocket 重连成功 (尝试 ${attemptNumber} 次)`);
            this.connected = true;
            // 重新通知服务器用户上线
            if (this.userId && this.username) {
                this.socket.emit('user:connect', { userId: this.userId, username: this.username });
            }
        });

        this.socket.on('reconnect_error', (error) => {
            console.error('WebSocket 重连失败:', error);
        });

        // 监听消息接收
        this.socket.on('message:receive', (data) => {
            console.log('收到新消息:', data);
            this.emit('message:receive', data);
        });

        // 监听消息已读
        this.socket.on('message:read_notification', (data) => {
            console.log('消息已读通知:', data);
            this.emit('message:read', data);
        });

        // 监听用户上线
        this.socket.on('user:online', (data) => {
            console.log('用户上线:', data);
            this.emit('user:online', data);
        });

        // 监听用户下线
        this.socket.on('user:offline', (data) => {
            console.log('用户下线:', data);
            this.emit('user:offline', data);
        });

        // 监听正在输入
        this.socket.on('typing:started', (data) => {
            this.emit('typing:started', data);
        });

        // 监听停止输入
        this.socket.on('typing:stopped', (data) => {
            this.emit('typing:stopped', data);
        });
    }

    // 断开连接
    disconnect() {
        if (this.socket?.connected) {
            // 通知服务器用户下线
            this.socket.emit('user:disconnect', {
                userId: this.userId,
                username: this.username
            });
            this.socket.disconnect();
            this.connected = false;
            console.log('WebSocket 主动断开连接');
        }
    }

    // 发送消息
    sendMessage(sender_id, receiver_id, content) {
        if (!this.socket?.connected) {
            console.error('WebSocket 未连接，无法发送消息');
            return;
        }
        this.socket.emit('message:send', {
            sender_id,
            receiver_id,
            content
        });
    }

    // 通知消息已读
    messageRead(sender_id, conversation_id) {
        if (!this.socket?.connected) {
            console.error('WebSocket 未连接，无法通知已读');
            return;
        }
        this.socket.emit('message:read', {
            sender_id,
            conversation_id
        });
    }

    // 通知正在输入
    startTyping(sender_id, receiver_id, username) {
        if (!this.socket?.connected) {
            return;
        }
        this.socket.emit('typing:start', {
            sender_id,
            receiver_id,
            username
        });
    }

    // 停止输入
    stopTyping(sender_id, receiver_id) {
        if (!this.socket?.connected) {
            return;
        }
        this.socket.emit('typing:stop', {
            sender_id,
            receiver_id
        });
    }

    // 添加事件监听
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    // 移除事件监听
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    // 触发事件
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => callback(data));
        }
    }

    // 获取连接状态
    isConnected() {
        return this.connected;
    }

    // 获取 Socket 实例（供高级使用）
    getSocket() {
        return this.socket;
    }
}

// 创建单例
const wsClient = new WebSocketClient();

export default wsClient;
