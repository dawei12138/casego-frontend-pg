import { getToken } from '@/utils/auth'

/**
 * WebSocket 连接管理类
 * 特性：
 * - 无限重连：永不放弃，持续尝试重连
 * - 高频心跳：10秒一次 ping，保持连接活跃
 * - 消息队列：连接断开时缓存消息，恢复后自动发送
 * - 指数退避：重连间隔逐渐增加，避免服务器压力
 */
class WebSocketService {
  constructor() {
    this.ws = null
    this.reconnectAttempts = 0
    this.baseReconnectDelay = 1000      // 基础重连延迟 1 秒
    this.maxReconnectDelay = 30000      // 最大重连延迟 30 秒
    this.heartbeatInterval = null
    this.heartbeatTimeout = null        // 心跳超时检测
    this.listeners = new Map()
    this.isConnecting = false
    this.channel = null
    this.messageQueue = []              // 消息队列
    this.manualClose = false            // 是否手动关闭
  }

  /**
   * 构建 WebSocket URL
   * @param {string} channel - 频道
   * @param {string} token - 认证 token
   * @returns {string} WebSocket URL
   */
  buildWsUrl(channel, token) {
    const configuredWsUrl = import.meta.env.VITE_APP_WS_URL

    // 如果配置了 VITE_APP_WS_URL，直接使用
    if (configuredWsUrl) {
      return `${configuredWsUrl}/ws/connect/${channel}?token=${token}`
    }

    // 否则根据当前页面协议自动推断
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    return `${protocol}//${host}/ws/connect/${channel}?token=${token}`
  }

  /**
   * 连接 WebSocket
   * @param {string} channel - 订阅频道
   */
  connect(channel) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] 已连接')
      return
    }

    if (this.isConnecting) {
      console.log('[WebSocket] 正在连接中...')
      return
    }

    this.channel = channel
    this.isConnecting = true
    this.manualClose = false  // 重置手动关闭标志

    const token = getToken()
    if (!token) {
      console.warn('[WebSocket] 未获取到 token，无法连接')
      this.isConnecting = false
      return
    }

    // 根据环境变量获取 WebSocket 地址
    const wsUrl = this.buildWsUrl(channel, token)
    console.log('[WebSocket] 正在连接:', wsUrl)

    try {
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('[WebSocket] 连接成功')
        this.isConnecting = false
        this.reconnectAttempts = 0
        this.startHeartbeat()
        this.emit('open')
        // 发送队列中缓存的消息
        this.flushMessageQueue()
      }

      this.ws.onmessage = (event) => {
        // 收到任何消息都重置心跳超时
        this.resetHeartbeatTimeout()

        try {
          const data = JSON.parse(event.data)
          // pong 消息不需要打印日志
          if (data.type !== 'pong') {
            console.log('[WebSocket] 收到消息:', data)
          }
          this.emit('message', data)

          // 根据消息类型分发事件
          if (data.type) {
            this.emit(data.type, data)
          }
        } catch (e) {
          console.log('[WebSocket] 收到非 JSON 消息:', event.data)
          this.emit('message', event.data)
        }
      }

      this.ws.onerror = (error) => {
        console.error('[WebSocket] 连接错误:', error)
        this.isConnecting = false
        this.emit('error', error)
      }

      this.ws.onclose = (event) => {
        console.log('[WebSocket] 连接关闭:', event.code, event.reason)
        this.isConnecting = false
        this.stopHeartbeat()
        this.emit('close', event)
        this.tryReconnect()
      }
    } catch (error) {
      console.error('[WebSocket] 创建连接失败:', error)
      this.isConnecting = false
    }
  }

  /**
   * 尝试重连（无限重试，指数退避）
   */
  tryReconnect() {
    // 如果是手动关闭，不重连
    if (this.manualClose) {
      console.log('[WebSocket] 手动关闭，不进行重连')
      return
    }

    // 如果没有 channel，不重连
    if (!this.channel) {
      console.log('[WebSocket] 没有 channel，不进行重连')
      return
    }

    this.reconnectAttempts++

    // 指数退避计算重连延迟，但不超过最大延迟
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    )

    console.log(`[WebSocket] ${(delay / 1000).toFixed(1)}秒后尝试第 ${this.reconnectAttempts} 次重连...`)

    setTimeout(() => {
      this.connect(this.channel)
    }, delay)
  }

  /**
   * 开始心跳检测（10秒一次）
   */
  startHeartbeat() {
    this.stopHeartbeat()
    // 10秒发送一次心跳
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' })
        // 设置心跳超时检测
        this.startHeartbeatTimeout()
      }
    }, 10000)
  }

  /**
   * 开始心跳超时检测
   * 如果 15 秒内没有收到任何消息，认为连接已断开
   */
  startHeartbeatTimeout() {
    this.clearHeartbeatTimeout()
    this.heartbeatTimeout = setTimeout(() => {
      console.warn('[WebSocket] 心跳超时，强制断开重连')
      if (this.ws) {
        this.ws.close()
      }
    }, 15000) // 15秒超时
  }

  /**
   * 清除心跳超时
   */
  clearHeartbeatTimeout() {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout)
      this.heartbeatTimeout = null
    }
  }

  /**
   * 重置心跳超时（收到消息时调用）
   */
  resetHeartbeatTimeout() {
    this.clearHeartbeatTimeout()
  }

  /**
   * 停止心跳检测
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
    this.clearHeartbeatTimeout()
  }

  /**
   * 发送消息
   * @param {Object|string} data - 要发送的数据
   * @param {boolean} queue - 是否在连接断开时加入队列（默认 true，ping 消息除外）
   */
  send(data, queue = true) {
    const message = typeof data === 'string' ? data : JSON.stringify(data)
    const isPing = typeof data === 'object' && data.type === 'ping'

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message)
    } else {
      // ping 消息不需要缓存
      if (!isPing && queue) {
        console.warn('[WebSocket] 连接未就绪，消息已加入队列')
        this.messageQueue.push(message)
        // 确保正在尝试重连
        if (!this.isConnecting && this.channel && !this.manualClose) {
          this.tryReconnect()
        }
      } else if (!isPing) {
        console.warn('[WebSocket] 连接未就绪，无法发送消息')
      }
    }
  }

  /**
   * 发送队列中缓存的消息
   */
  flushMessageQueue() {
    if (this.messageQueue.length === 0) return

    console.log(`[WebSocket] 发送 ${this.messageQueue.length} 条缓存消息`)

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(message)
      } else {
        // 如果连接又断了，把消息放回队列
        this.messageQueue.unshift(message)
        break
      }
    }
  }

  /**
   * 关闭连接
   */
  close() {
    this.manualClose = true  // 标记为手动关闭，阻止自动重连
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.channel = null
    this.messageQueue = []  // 清空消息队列
  }

  /**
   * 强制重连（手动触发）
   */
  reconnect() {
    if (!this.channel) {
      console.warn('[WebSocket] 没有 channel，无法重连')
      return
    }
    this.manualClose = false
    this.reconnectAttempts = 0
    if (this.ws) {
      this.ws.close()
    }
    this.connect(this.channel)
  }

  /**
   * 添加事件监听
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  /**
   * 移除事件监听
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return
    const callbacks = this.listeners.get(event)
    const index = callbacks.indexOf(callback)
    if (index > -1) {
      callbacks.splice(index, 1)
    }
  }

  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {any} data - 事件数据
   */
  emit(event, data) {
    if (!this.listeners.has(event)) return
    this.listeners.get(event).forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`[WebSocket] 事件 ${event} 处理出错:`, error)
      }
    })
  }

  /**
   * 获取连接状态
   */
  get isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN
  }
}

// 导出单例
export const wsService = new WebSocketService()

export default wsService
