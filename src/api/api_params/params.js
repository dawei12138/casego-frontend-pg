import request from '@/utils/request'

// 查询接口请求参数列表
export function listParams(query) {
  return request({
    url: '/api_params/params/list',
    method: 'get',
    params: query
  })
}

// 查询接口请求参数详细
export function getParams(paramId) {
  return request({
    url: '/api_params/params/' + paramId,
    method: 'get'
  })
}

// 新增接口请求参数
export function addParams(data) {
  return request({
    url: '/api_params/params',
    method: 'post',
    data: data
  })
}

// 修改接口请求参数
export function updateParams(data) {
  return request({
    url: '/api_params/params',
    method: 'put',
    data: data
  })
}

// 删除接口请求参数
export function delParams(paramId) {
  return request({
    url: '/api_params/params/' + paramId,
    method: 'delete'
  })
}
