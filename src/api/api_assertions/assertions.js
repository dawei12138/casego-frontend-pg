import request from '@/utils/request'

// 查询接口断言列表
export function listAssertions(query) {
  return request({
    url: '/api_assertions/assertions/list',
    method: 'get',
    params: query
  })
}

// 查询接口断言详细
export function getAssertions(assertionId) {
  return request({
    url: '/api_assertions/assertions/' + assertionId,
    method: 'get'
  })
}

// 新增接口断言
export function addAssertions(data) {
  return request({
    url: '/api_assertions/assertions',
    method: 'post',
    data: data
  })
}

// 修改接口断言
export function updateAssertions(data) {
  return request({
    url: '/api_assertions/assertions',
    method: 'put',
    data: data
  })
}

// 删除接口断言
export function delAssertions(assertionId) {
  return request({
    url: '/api_assertions/assertions/' + assertionId,
    method: 'delete'
  })
}
