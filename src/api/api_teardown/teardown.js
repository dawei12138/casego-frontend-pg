import request from '@/utils/request'

// 查询接口后置操作列表
export function listTeardown(query) {
  return request({
    url: '/api_teardown/teardown/list',
    method: 'get',
    params: query
  })
}

// 查询接口后置操作详细
export function getTeardown(teardownId) {
  return request({
    url: '/api_teardown/teardown/' + teardownId,
    method: 'get'
  })
}

// 新增接口后置操作
export function addTeardown(data) {
  return request({
    url: '/api_teardown/teardown',
    method: 'post',
    data: data
  })
}

// 修改接口后置操作
export function updateTeardown(data) {
  return request({
    url: '/api_teardown/teardown',
    method: 'put',
    data: data
  })
}

// 删除接口后置操作
export function delTeardown(teardownId) {
  return request({
    url: '/api_teardown/teardown/' + teardownId,
    method: 'delete'
  })
}
