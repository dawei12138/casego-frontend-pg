import request from '@/utils/request'

// 查询AI技能配置列表
export function listSkill(query) {
  return request({
    url: '/skills/skill/list',
    method: 'get',
    params: query
  })
}

// 查询AI技能配置详细
export function getSkill(skillId) {
  return request({
    url: '/skills/skill/' + skillId,
    method: 'get'
  })
}

// 新增AI技能配置
export function addSkill(data) {
  return request({
    url: '/skills/skill',
    method: 'post',
    data: data
  })
}

// 修改AI技能配置
export function updateSkill(data) {
  return request({
    url: '/skills/skill',
    method: 'put',
    data: data
  })
}

// 删除AI技能配置
export function delSkill(skillId) {
  return request({
    url: '/skills/skill/' + skillId,
    method: 'delete'
  })
}
