import request from '@/utils/request'

// 查询Agent代理列表
export function listAgents(query) {
  return request({
    url: '/app/agents/list',
    method: 'get',
    params: query
  })
}

// 查询Agent代理详细
export function getAgents(id) {
  return request({
    url: '/app/agents/' + id,
    method: 'get'
  })
}

// 新增Agent代理
export function addAgents(data) {
  return request({
    url: '/app/agents',
    method: 'post',
    data: data
  })
}

// 修改Agent代理
export function updateAgents(data) {
  return request({
    url: '/app/agents',
    method: 'put',
    data: data
  })
}

// 删除Agent代理
export function delAgents(id) {
  return request({
    url: '/app/agents/' + id,
    method: 'delete'
  })
}

// 获取所有Agent列表（不分页）
export function getAllAgents() {
  return request({
    url: '/app/agents/list',
    method: 'get'
  })
}

// 更新Agent信息（Sonic格式）
export function updateAgent(data) {
  return request({
    url: '/app/agents/update',
    method: 'put',
    data: data
  })
}

// 停止Agent
export function stopAgent(id) {
  return request({
    url: '/transport/exchange/stop',
    method: 'get',
    params: { id }
  })
}

// 获取告警机器人列表
export function listAlertRobots(scene) {
  return request({
    url: '/app/alertRobotsAdmin/listAll',
    method: 'get',
    params: { scene }
  })
}
