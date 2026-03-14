import request from '@/utils/request'

// 查询环境缓存列表
export function listCache_data(query) {
  return request({
    url: '/api_cache_data/cache_data/list',
    method: 'get',
    params: {
      ...query,
      environmentId: query.environmentId // 确保environmentId被传递
    }
  })
}

// 查询环境缓存详细
export function getCache_data(id) {
  return request({
    url: `/api_cache_data/cache_data/${id}`,
    method: 'get'
  })
}

// 新增环境缓存
export function addCache_data(data) {
  return request({
    url: '/api_cache_data/cache_data',
    method: 'post',
    data: {
      ...data,
      environmentId: data.environmentId // 确保environmentId被传递
    }
  })
}

// 修改环境缓存
export function updateCache_data(data) {
  return request({
    url: '/api_cache_data/cache_data',
    method: 'put',
    data: {
      ...data,
      environmentId: data.environmentId // 确保environmentId被传递
    }
  })
}

// 删除环境缓存
export function delCache_data(id) {
  return request({
    url: `/api_cache_data/cache_data/${id}`,
    method: 'delete'
  })
}