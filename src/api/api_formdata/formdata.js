import request from '@/utils/request'

// 查询接口单body列表
export function listFormdata(query) {
  return request({
    url: '/api_formdata/formdata/list',
    method: 'get',
    params: query
  })
}

// 查询接口单body详细
export function getFormdata(formdataId) {
  return request({
    url: '/api_formdata/formdata/' + formdataId,
    method: 'get'
  })
}

// 新增接口单body
export function addFormdata(data) {
  return request({
    url: '/api_formdata/formdata',
    method: 'post',
    data: data
  })
}

// 修改接口单body
export function updateFormdata(data) {
  return request({
    url: '/api_formdata/formdata',
    method: 'put',
    data: data
  })
}

// 删除接口单body
export function delFormdata(formdataId) {
  return request({
    url: '/api_formdata/formdata/' + formdataId,
    method: 'delete'
  })
}
