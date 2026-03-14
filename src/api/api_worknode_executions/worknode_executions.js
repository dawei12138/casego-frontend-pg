import request from '@/utils/request'

// 查询节点执行记录列表
export function listWorknode_executions(query) {
  return request({
    url: '/api_worknode_executions/worknode_executions/list',
    method: 'get',
    params: query
  })
}

// 查询节点执行记录详细
export function getWorknode_executions(nodeExecutionId) {
  return request({
    url: '/api_worknode_executions/worknode_executions/' + nodeExecutionId,
    method: 'get'
  })
}

// 新增节点执行记录
export function addWorknode_executions(data) {
  return request({
    url: '/api_worknode_executions/worknode_executions',
    method: 'post',
    data: data
  })
}

// 修改节点执行记录
export function updateWorknode_executions(data) {
  return request({
    url: '/api_worknode_executions/worknode_executions',
    method: 'put',
    data: data
  })
}

// 删除节点执行记录
export function delWorknode_executions(nodeExecutionId) {
  return request({
    url: '/api_worknode_executions/worknode_executions/' + nodeExecutionId,
    method: 'delete'
  })
}
