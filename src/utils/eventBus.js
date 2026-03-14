/**
 * 事件总线工具
 * 用于组件间通信
 */

class EventBus {
  constructor() {
    this.events = {}
  }

  /**
   * 监听事件
   * @param {string} event 事件名称
   * @param {Function} callback 回调函数
   */
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
  }

  /**
   * 取消监听事件
   * @param {string} event 事件名称
   * @param {Function} callback 回调函数
   */
  off(event, callback) {
    if (this.events[event]) {
      const index = this.events[event].indexOf(callback)
      if (index > -1) {
        this.events[event].splice(index, 1)
      }
    }
  }

  /**
   * 触发事件
   * @param {string} event 事件名称
   * @param {...any} args 参数
   */
  emit(event, ...args) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(...args))
    }
  }

  /**
   * 只监听一次事件
   * @param {string} event 事件名称
   * @param {Function} callback 回调函数
   */
  once(event, callback) {
    const onceCallback = (...args) => {
      callback(...args)
      this.off(event, onceCallback)
    }
    this.on(event, onceCallback)
  }

  /**
   * 清除所有事件监听
   */
  clear() {
    this.events = {}
  }

  /**
   * 清除指定事件的所有监听
   * @param {string} event 事件名称
   */
  clearEvent(event) {
    if (this.events[event]) {
      delete this.events[event]
    }
  }
}

// 创建全局事件总线实例
export const eventBus = new EventBus()

// 默认导出
export default eventBus