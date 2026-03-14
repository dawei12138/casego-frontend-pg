import request from '@/utils/request'

// 查询控件元素列表
export function listElements(query) {
  return request({
    url: '/app/elements/list',
    method: 'get',
    params: query
  })
}

// 查询控件元素详细
export function getElements(id) {
  return request({
    url: '/app/elements/' + id,
    method: 'get'
  })
}

// 新增控件元素
export function addElements(data) {
  return request({
    url: '/app/elements',
    method: 'post',
    data: data
  })
}

// 修改控件元素
export function updateElements(data) {
  return request({
    url: '/app/elements',
    method: 'put',
    data: data
  })
}

// 删除控件元素
export function delElements(id) {
  return request({
    url: '/app/elements/' + id,
    method: 'delete'
  })
}
