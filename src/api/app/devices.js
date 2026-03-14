import request from '@/utils/request'

// 查询设备列表
export function listDevices(query) {
  return request({
    url: '/app/devices/list',
    method: 'get',
    params: query
  })
}

// 获取筛选选项
export function getFilterOption() {
  return request({
    url: '/app/devices/getFilterOption',
    method: 'get'
  })
}

// 获取平均温度
export function findTemper() {
  return request({
    url: '/app/devices/findTemper',
    method: 'get'
  })
}

// 更新设备图片
export function updateDeviceImg(data) {
  return request({
    url: '/app/devices/updateImg',
    method: 'put',
    data: data
  })
}

// 保存设备详情
export function saveDeviceDetail(data) {
  return request({
    url: '/app/devices/saveDetail',
    method: 'put',
    data: data
  })
}

// 删除设备
export function deleteDevice(id) {
  return request({
    url: '/app/devices',
    method: 'delete',
    params: { id }
  })
}

// 重启设备
export function rebootDevice(id) {
  return request({
    url: '/transport/exchange/reboot',
    method: 'get',
    params: { id }
  })
}

// 停止调试
export function stopDebug(udId) {
  return request({
    url: '/app/devices/stopDebug',
    method: 'get',
    params: { udId }
  })
}

// 获取单个设备信息
export function getDeviceById(id) {
  return request({
    url: '/app/devices/' + id,
    method: 'get'
  })
}
