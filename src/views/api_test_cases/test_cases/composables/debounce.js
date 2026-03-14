// utils/debounce.js - 防抖工具函数

/**
 * 防抖函数 - 在指定时间内，多次调用只执行最后一次
 * @param {Function} func - 需要防抖的函数
 * @param {number} wait - 防抖时间，单位ms
 * @param {boolean} immediate - 是否立即执行一次
 * @returns {Function} - 防抖后的函数
 */
export function debounce(func, wait = 500, immediate = false) {
  let timeout
  
  return function executedFunction(...args) {
    const later = () => {
      timeout = null
      if (!immediate) func.apply(this, args)
    }
    
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    
    if (callNow) func.apply(this, args)
  }
}

/**
 * 创建一个带loading状态的防抖异步函数
 * @param {Function} asyncFunc - 异步函数
 * @param {Object} loadingRef - loading状态的ref
 * @param {number} wait - 防抖时间
 * @returns {Function} - 防抖后的异步函数
 */
export function debounceAsync(asyncFunc, loadingRef, wait = 500) {
  let isExecuting = false
  
  return debounce(async function(...args) {
    // 如果正在执行中，直接返回
    if (isExecuting || loadingRef.value) {
      console.log('操作正在进行中，请勿重复提交')
      return
    }
    
    try {
      isExecuting = true
      loadingRef.value = true
      const result = await asyncFunc.apply(this, args)
      return result
    } catch (error) {
      throw error
    } finally {
      isExecuting = false
      loadingRef.value = false
    }
  }, wait)
}

/**
 * 创建防抖函数装饰器
 * @param {number} wait - 防抖时间
 * @param {boolean} immediate - 是否立即执行
 */
export function debounceDecorator(wait = 500, immediate = false) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value
    descriptor.value = debounce(originalMethod, wait, immediate)
    return descriptor
  }
}