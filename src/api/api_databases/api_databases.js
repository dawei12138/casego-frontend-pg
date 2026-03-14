import request from '@/utils/request'
import { useProjectStore } from '@/store/modules/project'

// 查询数据库配置列表
export function listApi_databases(query) {
  const projectStore = useProjectStore()
  return request({
    url: '/api_databases/api_databases/list',
    method: 'get',
    params: {
      ...query,
      projectId: projectStore.projectId
    }
  })
}

// 查询数据库配置详细
export function getApi_databases(id) {
  const projectStore = useProjectStore()
  return request({
    url: '/api_databases/api_databases/' + id,
    method: 'get',
    params: {
      projectId: projectStore.projectId
    }
  })
}

// 新增数据库配置
export function addApi_databases(data) {
  const projectStore = useProjectStore()
  return request({
    url: '/api_databases/api_databases',
    method: 'post',
    data: {
      ...data,
      projectId: projectStore.projectId
    }
  })
}

// 修改数据库配置
export function updateApi_databases(data) {
  const projectStore = useProjectStore()
  return request({
    url: '/api_databases/api_databases',
    method: 'put',
    data: {
      ...data,
      projectId: projectStore.projectId
    }
  })
}

// 删除数据库配置
export function delApi_databases(id) {
  const projectStore = useProjectStore()
  return request({
    url: '/api_databases/api_databases/' + id,
    method: 'delete',
    params: {
      projectId: projectStore.projectId
    }
  })
}

// 测试数据库连接
export function testApi_databases(id) {
  return request({
    url: '/api_databases/api_databases/test/' + id,
    method: 'get'
  })
}

// 执行SQL脚本测试
export function executeApi_databases(data) {
  const projectStore = useProjectStore()
  return request({
    url: '/api_databases/api_databases/execute',
    method: 'post',
    data: {
      ...data,
      projectId: projectStore.projectId
    }
  })
}