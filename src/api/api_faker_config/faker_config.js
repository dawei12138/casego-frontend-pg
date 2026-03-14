import request from '@/utils/request'

// 获取Faker配置内容
export function getFakerContent() {
  return request({
    url: '/api_testing/faker_config/content',
    method: 'get'
  })
}

// 校验代码语法
export function validateFakerCode(data) {
  return request({
    url: '/api_testing/faker_config/validate',
    method: 'post',
    data: data
  })
}

// 保存Faker配置
export function saveFakerConfig(data) {
  return request({
    url: '/api_testing/faker_config/save',
    method: 'post',
    data: data
  })
}

// 测试执行函数
export function testFakerFunction(data) {
  return request({
    url: '/api_testing/faker_config/test',
    method: 'post',
    data: data
  })
}

// 获取所有可用函数列表
export function getFakerFunctions() {
  return request({
    url: '/api_testing/faker_config/functions',
    method: 'get'
  })
}
