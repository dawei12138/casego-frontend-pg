import request from '@/utils/request'

// 查询测试用例列表
export function listCases(query) {
  return request({
    url: '/app/cases/list',
    method: 'get',
    params: query
  })
}

// 查询测试用例详细
export function getCases(id) {
  return request({
    url: '/app/cases/' + id,
    method: 'get'
  })
}

// 新增测试用例
export function addCases(data) {
  return request({
    url: '/app/cases',
    method: 'post',
    data: data
  })
}

// 修改测试用例
export function updateCases(data) {
  return request({
    url: '/app/cases',
    method: 'put',
    data: data
  })
}

// 删除测试用例
export function delCases(id) {
  return request({
    url: '/app/cases/' + id,
    method: 'delete'
  })
}
