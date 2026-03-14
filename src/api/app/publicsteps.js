import request from '@/utils/request'

// 查询公共步骤列表
export function listPublicsteps(query) {
  return request({
    url: '/app/publicsteps/list',
    method: 'get',
    params: query
  })
}

// 查询公共步骤详细
export function getPublicsteps(id) {
  return request({
    url: '/app/publicsteps/' + id,
    method: 'get'
  })
}

// 新增公共步骤
export function addPublicsteps(data) {
  return request({
    url: '/app/publicsteps',
    method: 'post',
    data: data
  })
}

// 修改公共步骤
export function updatePublicsteps(data) {
  return request({
    url: '/app/publicsteps',
    method: 'put',
    data: data
  })
}

// 删除公共步骤
export function delPublicsteps(id) {
  return request({
    url: '/app/publicsteps/' + id,
    method: 'delete'
  })
}
