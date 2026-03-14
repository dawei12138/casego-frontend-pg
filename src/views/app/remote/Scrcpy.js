/**
 * Scrcpy 视频流处理类
 * 支持 Scrcpy (H.264) 和 Minicap (JPEG) 两种模式
 */
import JMuxer from 'jmuxer'

class Scrcpy {
  constructor(props) {
    const { excuteMode } = props
    this.props = props
    this.excuteMode = excuteMode || 'Scrcpy'
    this.isInit = false
    this.jmuxer = null
    this.websocket = null

    // JMuxer初始化
    this.initial(props)
    // websocket初始化
    this.websocketInit(props)
    // 监听页面激活状态
    this.onPageFocus()
  }

  cmdFN(cmd) {
    if (cmd.msg === 'size') {
      console.log(`init size: ${cmd.width},${cmd.height}`)
      this.isInit = true
    }
  }

  initial(props) {
    // 初始化播放器
    if (!this.jmuxer && this.excuteMode === 'Scrcpy') {
      const { node } = props
      this.jmuxer = new JMuxer({
        node: node || 'player',
        mode: 'video',
        flushingTime: 0,
        fps: 60,
        debug: false
      })
    }
  }

  websocketInit(props) {
    if (!this.websocket) {
      const { socketURL, onmessage, onclose, onopen } = props
      this.websocket = new WebSocket(socketURL)
      this.websocket.binaryType = 'arraybuffer'

      this.websocket.addEventListener('message', (event) => {
        if (typeof event.data === 'string') {
          this.cmdFN(JSON.parse(event.data))
          onmessage && onmessage(event)
        } else if (typeof event.data === 'object' && this.excuteMode === 'Scrcpy') {
          // Scrcpy 模式：H.264 视频流
          this.jmuxer && this.jmuxer.feed({
            video: new Uint8Array(event.data)
          })
        } else {
          // Minicap 模式：JPEG 图片
          onmessage && onmessage(event)
        }
      })

      this.websocket.addEventListener('error', (e) => {
        console.error('WebSocket Error:', e)
        onclose && onclose(e)
      })

      this.websocket.addEventListener('open', (e) => {
        console.log('WebSocket Connected')
        this.websocket.send(
          JSON.stringify({
            type: 'switch',
            detail: this.excuteMode.toLowerCase()
          })
        )
        onopen && onopen(e)
      })

      this.websocket.addEventListener('close', (e) => {
        console.log('WebSocket Closed')
        onclose && onclose(e)
      })
    }
  }

  switchMode(mode) {
    this.excuteMode = mode
    this.destroy()
    this.initial(this.props)
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(
        JSON.stringify({
          type: 'switch',
          detail: this.excuteMode.toLowerCase()
        })
      )
    }
    if (mode !== 'Scrcpy') {
      // 重置播放器
      this.jmuxer && this.jmuxer.reset()
    }
  }

  destroy() {
    if (this.jmuxer) {
      this.jmuxer.destroy()
      this.jmuxer = null
    }
    window.onfocus = null
  }

  close() {
    this.destroy()
    if (this.websocket) {
      this.websocket.close()
      this.websocket = null
    }
  }

  onPageFocus() {
    const videoDom = document.getElementById(this.props?.node || 'player')
    window.onfocus = function() {
      try {
        if (videoDom && videoDom.buffered && videoDom.buffered.length > 0) {
          // 将当前播放进度更新至当前最新缓冲时间
          videoDom.currentTime = Math.ceil(videoDom.buffered.end(0))
        }
      } catch (e) {
        // 忽略错误
      }
    }
  }

  send(data) {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(typeof data === 'string' ? data : JSON.stringify(data))
    }
  }
}

export default Scrcpy
