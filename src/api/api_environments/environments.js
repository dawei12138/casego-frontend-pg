import request from '@/utils/request'
import { useProjectStore } from '@/store/modules/project'
// 查询环境配置列表
export function listEnvironments(query) {
  const projectStore = useProjectStore()
  return request({
    url: '/api_environments/environments/list',
    method: 'get',
    params: {
      ...query,
      projectId: projectStore.projectId
    }
  })
}

// 查询环境配置详细
export function getEnvironments(id) {
  const projectStore = useProjectStore()
  return request({
    url: '/api_environments/environments/' + id,
    method: 'get',
    params: {
      projectId: projectStore.projectId
}
  })
}

// 新增环境配置
export function addEnvironments(data) {
  const projectStore = useProjectStore()
  return request({
    url: '/api_environments/environments',
    method: 'post',
    data: {
  ...data,
  projectId: projectStore.projectId
}
  })
}

// 修改环境配置
export function updateEnvironments(data) {
  const projectStore = useProjectStore()
  return request({
    url: '/api_environments/environments',
    method: 'put',
    data: {
  ...data,
  projectId: projectStore.projectId
}
  })
}

// 删除环境配置
export function delEnvironments(id) {
  return request({
    url: '/api_environments/environments/' + id,
    method: 'delete'
  })
}
