import request from '@/utils/request'

// 查询公共脚本库列表
export function listScript_library(query) {
  return request({
    url: '/api_script_library/script_library/list',
    method: 'get',
    params: query
  })
}

// 查询公共脚本库详细
export function getScript_library(scriptId) {
  return request({
    url: '/api_script_library/script_library/' + scriptId,
    method: 'get'
  })
}

// 新增公共脚本库
export function addScript_library(data) {
  return request({
    url: '/api_script_library/script_library',
    method: 'post',
    data: data
  })
}

// 修改公共脚本库
export function updateScript_library(data) {
  return request({
    url: '/api_script_library/script_library',
    method: 'put',
    data: data
  })
}

// 删除公共脚本库
export function delScript_library(scriptId) {
  return request({
    url: '/api_script_library/script_library/' + scriptId,
    method: 'delete'
  })
}

// 执行脚本调试
export function debugScript_library(data) {
  return request({
    url: '/api_script_library/script_library/debug',
    method: 'post',
    data: data
  })
}

// 根据脚本ID执行调试
export function debugScriptById(scriptId) {
  return request({
    url: '/api_script_library/script_library/debug',
    method: 'post',
    data: { scriptId }
  })
}
