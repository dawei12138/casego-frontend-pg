import request from '@/utils/request'

// 查询接口请求头列表
export function listHeaders(query) {
  return request({
    url: '/api_headers/headers/list',
    method: 'get',
    params: query
  })
}

// 查询接口请求头详细
export function getHeaders(headerId) {
  return request({
    url: '/api_headers/headers/' + headerId,
    method: 'get'
  })
}

// 新增接口请求头
export function addHeaders(data) {
  return request({
    url: '/api_headers/headers',
    method: 'post',
    data: data
  })
}

// 修改接口请求头
export function updateHeaders(data) {
  return request({
    url: '/api_headers/headers',
    method: 'put',
    data: data
  })
}

// 删除接口请求头
export function delHeaders(headerId) {
  return request({
    url: '/api_headers/headers/' + headerId,
    method: 'delete'
  })
}
