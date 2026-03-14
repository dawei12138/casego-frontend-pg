import request from '@/utils/request'

// 查询全局参数列表
export function listGlobalparams(query) {
  return request({
    url: '/app/globalparams/list',
    method: 'get',
    params: query
  })
}

// 查询全局参数详细
export function getGlobalparams(id) {
  return request({
    url: '/app/globalparams/' + id,
    method: 'get'
  })
}

// 新增全局参数
export function addGlobalparams(data) {
  return request({
    url: '/app/globalparams',
    method: 'post',
    data: data
  })
}

// 修改全局参数
export function updateGlobalparams(data) {
  return request({
    url: '/app/globalparams',
    method: 'put',
    data: data
  })
}

// 删除全局参数
export function delGlobalparams(id) {
  return request({
    url: '/app/globalparams/' + id,
    method: 'delete'
  })
}
