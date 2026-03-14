import request from '@/utils/request'

// 查询步骤-元素关联列表
export function listSteps_elements(query) {
  return request({
    url: '/app/steps_elements/list',
    method: 'get',
    params: query
  })
}

// 查询步骤-元素关联详细
export function getSteps_elements(stepsId) {
  return request({
    url: '/app/steps_elements/' + stepsId,
    method: 'get'
  })
}

// 新增步骤-元素关联
export function addSteps_elements(data) {
  return request({
    url: '/app/steps_elements',
    method: 'post',
    data: data
  })
}

// 修改步骤-元素关联
export function updateSteps_elements(data) {
  return request({
    url: '/app/steps_elements',
    method: 'put',
    data: data
  })
}

// 删除步骤-元素关联
export function delSteps_elements(stepsId) {
  return request({
    url: '/app/steps_elements/' + stepsId,
    method: 'delete'
  })
}
