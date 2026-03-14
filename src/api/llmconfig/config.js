import request from '@/utils/request'

// 查询LLM模型配置列表
export function listConfig(query) {
  return request({
    url: '/llmconfig/config/list',
    method: 'get',
    params: query
  })
}

// 查询LLM模型配置详细
export function getConfig(id) {
  return request({
    url: '/llmconfig/config/' + id,
    method: 'get'
  })
}

// 新增LLM模型配置
export function addConfig(data) {
  return request({
    url: '/llmconfig/config',
    method: 'post',
    data: data
  })
}

// 修改LLM模型配置
export function updateConfig(data) {
  return request({
    url: '/llmconfig/config',
    method: 'put',
    data: data
  })
}

// 删除LLM模型配置
export function delConfig(id) {
  return request({
    url: '/llmconfig/config/' + id,
    method: 'delete'
  })
}
