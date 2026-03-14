import request from '@/utils/request'

// 查询执行器节点列表
export function listWorknodes(query) {
  return request({
    url: '/api_worknodes/worknodes/list',
    method: 'get',
    params: query
  })
}

// 查询执行器节点详细
export function getWorknodes(nodeId) {
  return request({
    url: '/api_worknodes/worknodes/' + nodeId,
    method: 'get'
  })
}

// 新增执行器节点
export function addWorknodes(data) {
  return request({
    url: '/api_worknodes/worknodes',
    method: 'post',
    data: data
  })
}

// 修改执行器节点
export function updateWorknodes(data) {
  return request({
    url: '/api_worknodes/worknodes',
    method: 'put',
    data: data
  })
}

// 删除执行器节点
export function delWorknodes(nodeId) {
  return request({
    url: '/api_worknodes/worknodes/' + nodeId,
    method: 'delete'
  })
}
