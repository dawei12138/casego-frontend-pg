import request from '@/utils/request'

// 查询工作流报告列表
export function listWorkflowReports(query) {
  return request({
    url: '/report/api_workflow_report/list',
    method: 'get',
    params: query
  })
}

// 查询工作流报告详情
export function getWorkflowReport(reportId) {
  return request({
    url: `/report/api_workflow_report/${reportId}`,
    method: 'get'
  })
}
