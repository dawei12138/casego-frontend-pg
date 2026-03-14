import request from '@/utils/request'

// 查询接口请求Cookie列表
export function listCookies(query) {
  return request({
    url: '/api_cookies/cookies/list',
    method: 'get',
    params: query
  })
}

// 查询接口请求Cookie详细
export function getCookies(cookieId) {
  return request({
    url: '/api_cookies/cookies/' + cookieId,
    method: 'get'
  })
}

// 新增接口请求Cookie
export function addCookies(data) {
  return request({
    url: '/api_cookies/cookies',
    method: 'post',
    data: data
  })
}

// 修改接口请求Cookie
export function updateCookies(data) {
  return request({
    url: '/api_cookies/cookies',
    method: 'put',
    data: data
  })
}

// 删除接口请求Cookie
export function delCookies(cookieId) {
  return request({
    url: '/api_cookies/cookies/' + cookieId,
    method: 'delete'
  })
}
