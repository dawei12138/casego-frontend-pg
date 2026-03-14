import request from '@/utils/request'

// 查询执行器执行记录列表
export function listWorkflow_executions(query) {
  return request({
    url: '/api_workflow_executions/workflow_executions/list',
    method: 'get',
    params: query
  })
}

// 查询执行器执行记录详细
export function getWorkflow_executions(workflowExecutionId) {
  return request({
    url: '/api_workflow_executions/workflow_executions/' + workflowExecutionId,
    method: 'get'
  })
}

// 新增执行器执行记录
export function addWorkflow_executions(data) {
  return request({
    url: '/api_workflow_executions/workflow_executions',
    method: 'post',
    data: data
  })
}

// 修改执行器执行记录
export function updateWorkflow_executions(data) {
  return request({
    url: '/api_workflow_executions/workflow_executions',
    method: 'put',
    data: data
  })
}

// 删除执行器执行记录
export function delWorkflow_executions(workflowExecutionId) {
  return request({
    url: '/api_workflow_executions/workflow_executions/' + workflowExecutionId,
    method: 'delete'
  })
}
