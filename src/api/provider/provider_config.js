import request from '@/utils/request'

// 查询LLM提供商配置列表
export function listProvider_config(query) {
  return request({
    url: '/provider/provider_config/list',
    method: 'get',
    params: query
  })
}

// 查询LLM提供商配置详细
export function getProvider_config(providerId) {
  return request({
    url: '/provider/provider_config/' + providerId,
    method: 'get'
  })
}

// 新增LLM提供商配置
export function addProvider_config(data) {
  return request({
    url: '/provider/provider_config',
    method: 'post',
    data: data
  })
}

// 修改LLM提供商配置
export function updateProvider_config(data) {
  return request({
    url: '/provider/provider_config',
    method: 'put',
    data: data
  })
}

// 删除LLM提供商配置
export function delProvider_config(providerId) {
  return request({
    url: '/provider/provider_config/' + providerId,
    method: 'delete'
  })
}
