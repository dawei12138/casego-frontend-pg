import request from '@/utils/request'

// 查询项目模块列表
export function listModules(query) {
  return request({
    url: '/system/modules/list',
    method: 'get',
    params: query
  })
}

// 查询项目模块详细
export function getModules(id) {
  return request({
    url: '/system/modules/' + id,
    method: 'get'
  })
}

// 新增项目模块
export function addModules(data) {
  return request({
    url: '/system/modules',
    method: 'post',
    data: data
  })
}

// 修改项目模块
export function updateModules(data) {
  return request({
    url: '/system/modules',
    method: 'put',
    data: data
  })
}

// 删除项目模块
export function delModules(id) {
  return request({
    url: '/system/modules/' + id,
    method: 'delete'
  })
}
