import request from '@/utils/request'
import { useProjectStore } from '@/store/modules/project'

// 查询项目模块列表
export function listProject_submodules(query) {
  return request({
    url: '/api_project_submodules/project_submodules/list',
    method: 'get',
    params: query
  })
}

// 查询项目模块详细
export function getProject_submodules(id) {
  return request({
    url: '/api_project_submodules/project_submodules/' + id,
    method: 'get'
  })
}

// 新增项目模块
export function addProject_submodules(data) {
  return request({
    url: '/api_project_submodules/project_submodules',
    method: 'post',
    data: data
  })
}

// 修改项目模块
export function updateProject_submodules(data) {
  return request({
    url: '/api_project_submodules/project_submodules',
    method: 'put',
    data: data
  })
}

// 删除项目模块
export function delProject_submodules(id) {
  return request({
    url: '/api_project_submodules/project_submodules/' + id,
    method: 'delete'
  })
}

// 查询接口用例树结构
export function getTestCaseTree(query) {
  const projectStore = useProjectStore()
  return request({
    url: '/api_project_submodules/project_submodules/tree',
    method: 'get',
    params: {
      ...query,
      projectId: projectStore.projectId
    }
  })
}

// 查询纯接口树结构（只有接口，不包含用例）
export function getApiTree(query) {
  const projectStore = useProjectStore()
  return request({
    url: '/api_project_submodules/project_submodules/api_tree',
    method: 'get',
    params: {
      ...query,
      projectId: projectStore.projectId
    }
  })
}

// 查询模块详情
export function getModule(moduleId) {
  const projectStore = useProjectStore()
  return request({
    url: `/api/modules/${moduleId}`,
    method: 'get',
    params: {
      projectId: projectStore.projectId
    }
  })
}

// 查询测试用例详情
export function getTestCase(caseId) {
  const projectStore = useProjectStore()
  return request({
    url: `/api/testcase/${caseId}`,
    method: 'get',
    params: {
      projectId: projectStore.projectId
    }
  })
}

// 新增模块
export function addModule(data) {
  const projectStore = useProjectStore()
  return request({
    url: '/api_project_submodules/project_submodules',
    method: 'post',
    data: {
      ...data,
      projectId: projectStore.projectId
    }
  })
}

// 修改模块
export function updateModule(data) {
  const projectStore = useProjectStore()
  return request({
    url: `/api/modules/${data.moduleId}`,
    method: 'put',
    data: {
      ...data,
      projectId: projectStore.projectId
    }
  })
}

// 删除模块
export function delModule(moduleId) {
  const projectStore = useProjectStore()
  return request({
    url: `/api/modules/${moduleId}`,
    method: 'delete',
    params: {
      projectId: projectStore.projectId
    }
  })
}

// 新增测试用例
export function addTestCase(data) {
  const projectStore = useProjectStore()
  return request({
    url: '/api/testcase',
    method: 'post',
    data: {
      ...data,
      projectId: projectStore.projectId
    }
  })
}

// 修改测试用例
export function updateTestCase(data) {
  const projectStore = useProjectStore()
  return request({
    url: `/api/testcase/${data.caseId}`,
    method: 'put',
    data: {
      ...data,
      projectId: projectStore.projectId
    }
  })
}

// 删除测试用例
export function delTestCase(caseId) {
  const projectStore = useProjectStore()
  return request({
    url: `/api/testcase/${caseId}`,
    method: 'delete',
    params: {
      projectId: projectStore.projectId
    }
  })
}

// 模块排序
export function sortProjectSubmodules(data) {
  return request({
    url: '/api_project_submodules/project_submodules/sort',
    method: 'put',
    data: data
  })
}