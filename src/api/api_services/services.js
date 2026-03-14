import request from '@/utils/request'
import { useProjectStore } from '@/store/modules/project'

// 查询服务地址列表
export function listServices(query) {
  const projectStore = useProjectStore()
  return request({
    url: '/api_services/services/list',
    method: 'get',
    params: {
      ...query,
      // 确保环境ID被正确传递
      environmentId: query.environmentId
    }
  })
}

// 查询服务地址详细
export function getServices(id) {
  const projectStore = useProjectStore()
  return request({
    url: `/api_services/services/${id}`,
    method: 'get',
    params: {
      
    }
  })
}

// 新增服务地址
export function addServices(data) {
  const projectStore = useProjectStore()
  return request({
    url: '/api_services/services',
    method: 'post',
    data: {
      ...data,
      environmentId: data.environmentId
    }
  })
}

// 修改服务地址
export function updateServices(data) {
  const projectStore = useProjectStore()
  return request({
    url: '/api_services/services',
    method: 'put',
    data: {
      ...data,
      
    }
  })
}

// 删除服务地址
export function delServices(id) {
  const projectStore = useProjectStore()
  return request({
    url: `/api_services/services/${id}`,
    method: 'delete',
    params: {
      
    }
  })
}

// 导出服务地址
export function exportServices(query) {
  const projectStore = useProjectStore()
  return request({
    url: '/api_services/services/export',
    method: 'get',
    params: {
      ...query,
      
    },
    responseType: 'blob'
  })
}