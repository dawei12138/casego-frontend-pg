import request from '@/utils/request'

// 查询MCP服务器配置列表
export function listMcpconfig(query) {
  return request({
    url: '/mcpconfig/mcpconfig/list',
    method: 'get',
    params: query
  })
}

// 查询MCP服务器配置详细
export function getMcpconfig(configId) {
  return request({
    url: '/mcpconfig/mcpconfig/' + configId,
    method: 'get'
  })
}

// 新增MCP服务器配置
export function addMcpconfig(data) {
  return request({
    url: '/mcpconfig/mcpconfig',
    method: 'post',
    data: data
  })
}

// 修改MCP服务器配置
export function updateMcpconfig(data) {
  return request({
    url: '/mcpconfig/mcpconfig',
    method: 'put',
    data: data
  })
}

// 删除MCP服务器配置
export function delMcpconfig(configId) {
  return request({
    url: '/mcpconfig/mcpconfig/' + configId,
    method: 'delete'
  })
}

// 查询所有MCP服务器配置（简要列表）
export function allMcpconfig() {
  return request({
    url: '/mcpconfig/mcpconfig/all',
    method: 'get'
  })
}
