import request from '@/utils/request'

// 查询AI技能列表（分页）
export function listSkill(query) {
  return request({
    url: '/skills/skill/list',
    method: 'get',
    params: query
  })
}

// 查询AI技能列表（全量/下拉）
export function listAllSkill(query) {
  return request({
    url: '/skills/skill/all',
    method: 'get',
    params: query
  })
}

// 查询AI技能详情
export function getSkill(skillId) {
  return request({
    url: '/skills/skill/' + skillId,
    method: 'get'
  })
}

// 新增AI技能
export function addSkill(data) {
  return request({
    url: '/skills/skill',
    method: 'post',
    data: data
  })
}

// 修改AI技能
export function updateSkill(data) {
  return request({
    url: '/skills/skill',
    method: 'put',
    data: data
  })
}

// 删除AI技能（批量）
export function delSkill(skillIds) {
  return request({
    url: '/skills/skill/' + skillIds,
    method: 'delete'
  })
}

// 上传技能包（ZIP）
export function uploadSkill(formData) {
  return request({
    url: '/skills/skill/upload',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// URL导入技能
export function importUrlSkill(data) {
  return request({
    url: '/skills/skill/import-url',
    method: 'post',
    data: data
  })
}

// 获取技能文件列表
export function listSkillFiles(skillId) {
  return request({
    url: '/skills/skill/' + skillId + '/files',
    method: 'get'
  })
}

// 获取技能文件内容
export function getSkillFileContent(skillId, filePath) {
  return request({
    url: '/skills/skill/' + skillId + '/file',
    method: 'get',
    params: { filePath }
  })
}

// 淇濆瓨鍗曚釜鎶€鑳芥枃浠跺唴瀹癸紙鎸塮ilePath upsert锛?
export function saveSkillFileContent(skillId, data) {
  return request({
    url: '/skills/skill/' + skillId + '/file/content',
    method: 'put',
    data: data
  })
}

// 鎵归噺淇濆瓨鎶€鑳芥枃浠跺唴瀹癸紙鎸塮ilePath upsert锛?
export function saveSkillFilesContent(skillId, data) {
  return request({
    url: '/skills/skill/' + skillId + '/files/content',
    method: 'put',
    data: data
  })
}

// 鎵嬪姩瑙﹀彂鎶€鑳藉叏閲忓悓姝?
export function syncAllSkills() {
  return request({
    url: '/skills/skill/sync-all',
    method: 'post'
  })
}

// 新增技能文件
export function addSkillFile(skillId, data) {
  return request({
    url: '/skills/skill/' + skillId + '/file',
    method: 'post',
    data: data
  })
}

// 编辑技能文件
export function updateSkillFile(skillId, data) {
  return request({
    url: '/skills/skill/' + skillId + '/file',
    method: 'put',
    data: data
  })
}

// 删除技能文件
export function delSkillFile(skillId, fileId) {
  return request({
    url: '/skills/skill/' + skillId + '/file/' + fileId,
    method: 'delete'
  })
}

// 新增技能子文件夹
export function addSkillFolder(skillId, data) {
  return request({
    url: '/skills/skill/' + skillId + '/folder',
    method: 'post',
    data: data
  })
}

// 重命名技能子文件夹
export function renameSkillFolder(skillId, data) {
  return request({
    url: '/skills/skill/' + skillId + '/folder/rename',
    method: 'put',
    data: data
  })
}

// 删除技能子文件夹
export function delSkillFolder(skillId, data) {
  return request({
    url: '/skills/skill/' + skillId + '/folder',
    method: 'delete',
    data: data
  })
}

// 移动技能文件
export function moveSkillFile(skillId, data) {
  return request({
    url: '/skills/skill/' + skillId + '/file/move',
    method: 'put',
    data: data
  })
}
