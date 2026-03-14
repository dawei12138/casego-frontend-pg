import request from '@/utils/request'

// 查询接口执行历史记录列表
export function listExecutionLog(query) {
  return request({
    url: '/api_test_execution_log/execution_log/list',
    method: 'get',
    params: query
  })
}

// 查询接口执行历史记录详细
export function getExecutionLog(logId) {
  return request({
    url: '/api_test_execution_log/execution_log/' + logId,
    method: 'get'
  })
}

// 新增接口执行历史记录
export function addExecutionLog(data) {
  return request({
    url: '/api_test_execution_log/execution_log',
    method: 'post',
    data: data
  })
}

// 修改接口执行历史记录
export function updateExecutionLog(data) {
  return request({
    url: '/api_test_execution_log/execution_log',
    method: 'put',
    data: data
  })
}

// 删除接口执行历史记录
export function delExecutionLog(logId) {
  return request({
    url: '/api_test_execution_log/execution_log/' + logId,
    method: 'delete'
  })
}

// 清空指定用例的执行历史记录
export function clearExecutionLogByCase(caseId) {
  return request({
    url: '/api_test_execution_log/execution_log/clear/' + caseId,
    method: 'delete'
  })
}