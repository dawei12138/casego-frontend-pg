import request from '@/utils/request'
import { useProjectStore } from '@/store/modules/project'
// 查询接口用例列表
export function listTest_cases(query) {
  return request({
    url: '/api_test_cases/test_cases/list',
    method: 'get',
    params: query
  })
}

// 查询接口用例详细
export function getTest_cases(caseId) {
  return request({
    url: '/api_test_cases/test_cases/' + caseId,
    method: 'get'
  })
}

// 新增接口用例
export function addTest_cases(data) {
  const projectStore = useProjectStore()
  return request({
    url: '/api_test_cases/test_cases',
    method: 'post',
    data: {
      ...data,
      projectId: projectStore.projectId}
  })
}

// 修改接口用例
export function updateTest_cases(data) {
  return request({
    url: '/api_test_cases/test_cases',
    method: 'put',
    data: data
  })
}

// 删除接口用例
export function delTest_cases(caseId) {
  return request({
    url: '/api_test_cases/test_cases/' + caseId,
    method: 'delete'
  })
}

// 通过文件导入OpenAPI/Swagger
export function importOpenAPIByFile(formData) {
  const projectStore = useProjectStore()

  // 确保 projectId 存在
  if (!formData.has('projectId')) {
    formData.append('projectId', projectStore.projectId)
  }

  return request({
    url: '/api_test_cases/test_cases/importbyfile/openapi',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 通过URL导入OpenAPI/Swagger
export function importOpenAPIByUrl(data) {
  const projectStore = useProjectStore()

  return request({
    url: '/api_test_cases/test_cases/importbyurl/openapi',
    method: 'post',
    data: {
      ...data,
      projectId: projectStore.projectId
    }
  })
}

// 通过文件导入HAR
export function importHARByFile(formData) {
  const projectStore = useProjectStore()

  // 确保 projectId 存在
  if (!formData.has('projectId')) {
    formData.append('projectId', projectStore.projectId)
  }

  return request({
    url: '/api_test_cases/test_cases/importbyfile/har',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 通过脚本内容导入HAR
export function importHARByScript(data) {
  const projectStore = useProjectStore()

  return request({
    url: '/api_test_cases/test_cases/importbyscript/har',
    method: 'post',
    data: {
      ...data,
      projectId: projectStore.projectId
    }
  })
}

// ============ OpenAPI 新版导入接口 ============

// 预览 OpenAPI（URL方式）
export function previewOpenAPIFromUrl(params) {
  const projectStore = useProjectStore()
  const formData = new FormData()

  formData.append('url', params.url)
  formData.append('projectId', params.projectId || projectStore.projectId)

  if (params.targetModuleId) {
    formData.append('targetModuleId', params.targetModuleId)
  }
  formData.append('moduleStrategy', params.moduleStrategy || 'auto_match')
  formData.append('conflictStrategy', params.conflictStrategy || 'smart_merge')
  formData.append('includeDeprecated', params.includeDeprecated || false)

  return request({
    url: '/api_test_cases/test_cases/openapi/preview/url',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
}

// 预览 OpenAPI（文件方式）
export function previewOpenAPIFromFile(file, params) {
  const projectStore = useProjectStore()
  const formData = new FormData()

  formData.append('file', file)
  formData.append('projectId', params.projectId || projectStore.projectId)

  if (params.targetModuleId) {
    formData.append('targetModuleId', params.targetModuleId)
  }
  formData.append('moduleStrategy', params.moduleStrategy || 'auto_match')
  formData.append('conflictStrategy', params.conflictStrategy || 'smart_merge')
  formData.append('includeDeprecated', params.includeDeprecated || false)

  return request({
    url: '/api_test_cases/test_cases/openapi/preview/file',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 导入 OpenAPI（URL方式）
export function importOpenAPIFromUrl(params, selectedParams = {}) {
  const projectStore = useProjectStore()
  const formData = new FormData()

  formData.append('url', params.url)
  formData.append('projectId', params.projectId || projectStore.projectId)

  if (params.targetModuleId) {
    formData.append('targetModuleId', params.targetModuleId)
  }
  formData.append('moduleStrategy', params.moduleStrategy || 'auto_match')
  formData.append('conflictStrategy', params.conflictStrategy || 'smart_merge')
  formData.append('includeDeprecated', params.includeDeprecated || false)
  formData.append('importHeaders', params.importHeaders ?? true)
  formData.append('importParams', params.importParams ?? true)
  formData.append('importBody', params.importBody ?? true)
  formData.append('importCookies', params.importCookies ?? true)

  // 选中的模块和接口
  if (selectedParams.selectedModules) {
    formData.append('selectedModules', selectedParams.selectedModules)
  }
  if (selectedParams.selectedApis) {
    formData.append('selectedApis', selectedParams.selectedApis)
  }

  return request({
    url: '/api_test_cases/test_cases/openapi/import/url',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
}

// 导入 OpenAPI（文件方式）
export function importOpenAPIFromFile(file, params, selectedParams = {}) {
  const projectStore = useProjectStore()
  const formData = new FormData()

  formData.append('file', file)
  formData.append('projectId', params.projectId || projectStore.projectId)

  if (params.targetModuleId) {
    formData.append('targetModuleId', params.targetModuleId)
  }
  formData.append('moduleStrategy', params.moduleStrategy || 'auto_match')
  formData.append('conflictStrategy', params.conflictStrategy || 'smart_merge')
  formData.append('includeDeprecated', params.includeDeprecated || false)
  formData.append('importHeaders', params.importHeaders ?? true)
  formData.append('importParams', params.importParams ?? true)
  formData.append('importBody', params.importBody ?? true)
  formData.append('importCookies', params.importCookies ?? true)

  // 选中的模块和接口
  if (selectedParams.selectedModules) {
    formData.append('selectedModules', selectedParams.selectedModules)
  }
  if (selectedParams.selectedApis) {
    formData.append('selectedApis', selectedParams.selectedApis)
  }

  return request({
    url: '/api_test_cases/test_cases/openapi/import/file',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// ============ cURL 导入接口 ============

// 导入 cURL 命令
export function importCurlCommand(data) {
  const projectStore = useProjectStore()

  return request({
    url: '/api_test_cases/test_cases/curl/import',
    method: 'post',
    data: {
      curlCommand: data.curlCommand,
      projectId: data.projectId || projectStore.projectId
    }
  })
}

// ============ HAR 导入接口 ============

// 预览 HAR 文件
export function previewHARFromFile(file, params) {
  const projectStore = useProjectStore()
  const formData = new FormData()

  formData.append('file', file)
  formData.append('projectId', params.projectId || projectStore.projectId)

  if (params.targetModuleId) {
    formData.append('targetModuleId', params.targetModuleId)
  }
  if (params.moduleName) {
    formData.append('moduleName', params.moduleName)
  }

  formData.append('importHeaders', params.importHeaders ?? true)
  formData.append('importParams', params.importParams ?? true)
  formData.append('importBody', params.importBody ?? true)
  formData.append('importCookies', params.importCookies ?? true)
  formData.append('filterStatic', params.filterStatic ?? true)

  if (params.allowedMethods) {
    formData.append('allowedMethods', params.allowedMethods)
  }
  if (params.includeDomains) {
    formData.append('includeDomains', params.includeDomains)
  }
  if (params.urlKeywords) {
    formData.append('urlKeywords', params.urlKeywords)
  }

  return request({
    url: '/api_test_cases/test_cases/har/preview',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 导入 HAR 文件
export function importHARFromFile(file, params, selectedApis = null) {
  const projectStore = useProjectStore()
  const formData = new FormData()

  formData.append('file', file)
  formData.append('projectId', params.projectId || projectStore.projectId)

  if (params.targetModuleId) {
    formData.append('targetModuleId', params.targetModuleId)
  }
  if (params.moduleName) {
    formData.append('moduleName', params.moduleName)
  }

  formData.append('importHeaders', params.importHeaders ?? true)
  formData.append('importParams', params.importParams ?? true)
  formData.append('importBody', params.importBody ?? true)
  formData.append('importCookies', params.importCookies ?? true)
  formData.append('filterStatic', params.filterStatic ?? true)

  if (params.allowedMethods) {
    formData.append('allowedMethods', params.allowedMethods)
  }
  if (params.includeDomains) {
    formData.append('includeDomains', params.includeDomains)
  }
  if (params.urlKeywords) {
    formData.append('urlKeywords', params.urlKeywords)
  }

  // 选中的接口
  if (selectedApis) {
    formData.append('selectedApis', selectedApis)
  }

  return request({
    url: '/api_test_cases/test_cases/har/import',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
