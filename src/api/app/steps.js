import request from '@/utils/request'

// 查询测试步骤列表
export function listSteps(query) {
  return request({
    url: '/app/steps/list',
    method: 'get',
    params: query
  })
}

// 查询测试步骤详细
export function getSteps(id) {
  return request({
    url: '/app/steps/' + id,
    method: 'get'
  })
}

// 新增测试步骤
export function addSteps(data) {
  return request({
    url: '/app/steps',
    method: 'post',
    data: data
  })
}

// 修改测试步骤
export function updateSteps(data) {
  return request({
    url: '/app/steps',
    method: 'put',
    data: data
  })
}

// 删除测试步骤
export function delSteps(id) {
  return request({
    url: '/app/steps/' + id,
    method: 'delete'
  })
}
