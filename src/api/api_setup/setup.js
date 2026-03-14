import request from '@/utils/request'

// 查询接口前置操作列表
export function listSetup(query) {
  return request({
    url: '/api_setup/setup/list',
    method: 'get',
    params: query
  })
}

// 查询接口前置操作详细
export function getSetup(setupId) {
  return request({
    url: '/api_setup/setup/' + setupId,
    method: 'get'
  })
}

// 新增接口前置操作
export function addSetup(data) {
  return request({
    url: '/api_setup/setup',
    method: 'post',
    data: data
  })
}

// 修改接口前置操作
export function updateSetup(data) {
  return request({
    url: '/api_setup/setup',
    method: 'put',
    data: data
  })
}

// 删除接口前置操作
export function delSetup(setupId) {
  return request({
    url: '/api_setup/setup/' + setupId,
    method: 'delete'
  })
}
