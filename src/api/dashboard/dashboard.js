import request from '@/utils/request'

// 获取仪表板统计数据
export function getDashboardStats() {
  return request({
    url: '/api/dashboard/stats',
    method: 'get'
  })
}

// 获取最近执行记录
export function getRecentExecutions(limit = 5) {
  return request({
    url: '/api/dashboard/recent-executions',
    method: 'get',
    params: { limit }
  })
}
