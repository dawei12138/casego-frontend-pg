// API服务 - 用例管理相关接口
import request from '@/utils/request'
import { useProjectStore } from '@/store/modules/project'

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

// 查询接口树结构（只包含api类型，不包含case类型）
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

// 新增项目模块
export function addProjectSubmodule(data) {
  const projectStore = useProjectStore()
  return request({
    url: '/api_project_submodules/project_submodules',
    method: 'post',
    data: {...data,
    projectId: projectStore.projectId,
    type: "1"
}})
}

// 修改项目模块
export function updateProjectSubmodule(data) {
  return request({
    url: '/api_project_submodules/project_submodules',
    method: 'put',
    data: data
  })
}

// 删除项目模块
export function delProjectSubmodule(moduleId) {
  return request({
    url: '/api_project_submodules/project_submodules/' + moduleId,
    method: 'delete'
  })
}

// 查询接口用例详细
export function getTestCase(caseId) {
  return request({
    url: '/api_test_cases/test_cases/' + caseId,
    method: 'get'
  })
}

// 新增接口用例
export function addTestCase(data) {
  const projectStore = useProjectStore()
  return request({
    url: '/api_test_cases/test_cases',
    method: 'post',
    data: {
      ...data,
      projectId: projectStore.projectId
    },
    caseType: 1,
  })
}

// 修改接口用例
export function updateTestCase(data) {
  return request({
    url: '/api_test_cases/test_cases',
    method: 'put',
    data: data
  })
}

// 保存接口用例 (统一使用这个接口进行保存)
export function saveTestCase(data) {
  return request({
    url: '/api_test_cases/test_cases',
    method: 'put',
    data: data
  })
}

// 删除接口用例
export function delTestCase(caseId) {
  return request({
    url: '/api_test_cases/test_cases/' + caseId,
    method: 'delete'
  })
}

// 执行接口用例
export function executeTestCase(data) {
  return request({
    url: '/api_test_cases/test_cases/exec',
    method: 'post',
    data: data
  })
}

// 复制接口用例
export function copyTestCase(caseId) {
  return request({
    url: '/api_test_cases/test_cases/copy',
    method: 'post',
    data: {
      caseId: caseId
    }
  })
}

// 保存为用例
export function copyToCase(data) {
  return request({
    url: '/api_test_cases/test_cases/copy_to_case',
    method: 'post',
    data: data
  })
}

// 用例排序
export function sortTestCase(data) {
  return request({
    url: '/api_test_cases/test_cases/sort',
    method: 'post',
    data: data
  })
}

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

// 获取环境配置
export function getEnvironmentConfig(environmentId) {
  return request({
    url: '/api_environments/environments/config',
    method: 'get',
    params: { id: environmentId }
  })
}

// 保存环境配置
export function saveEnvironmentConfig(data) {
  return request({
    url: '/api_environments/environments/config',
    method: 'put',
    data: data
  })
}

// 获取服务列表
export function getServicesList(query) {
  return request({
    url: '/api_services/services/list',
    method: 'get',
    params: query
  })
}

// 数据转换工具函数（用于测试用例导入，显示 module -> api -> case 三层结构）
export function transformTreeData(apiResponse) {
  if (!apiResponse || !apiResponse.rows) {
    return []
  }

  const transformTestCase = (testCase, parentApiName = '') => {
    if (!testCase.caseId) {
      return null
    }

    const transformedCase = {
      id: `case_${testCase.caseId}`,
      caseId: testCase.caseId,
      name: testCase.name,
      method: testCase.method || 'GET',
      type: 'case',
      apiType: testCase.type, // 保留原始类型信息：'api' 或 'case'
      moduleId: testCase.moduleId,
      parentApiName: parentApiName, // 父级接口名称
      count: 0,
      children: []
    }

    // 处理 api 类型节点的子用例（case 类型）
    if (testCase.type === 'api' && testCase.children && testCase.children.length > 0) {
      const childCases = testCase.children
        .filter(child => child.type === 'case')
        .map(child => {
          if (!child.caseId) return null
          return {
            id: `case_${child.caseId}`,
            caseId: child.caseId,
            name: child.name,
            method: child.method || 'GET',
            type: 'case',
            apiType: 'case',
            moduleId: child.moduleId,
            parentApiName: testCase.name,
            count: 0,
            children: []
          }
        })
        .filter(Boolean)

      transformedCase.children = childCases
      transformedCase.count = childCases.length
    }

    return transformedCase
  }

  // 计算节点下的 case 数量（只统计 apiType === 'case' 的节点）
  const countCases = (node) => {
    let count = 0
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        if (child.type === 'case' && child.apiType === 'case') {
          count++
        } else if (child.type === 'group' || (child.type === 'case' && child.apiType === 'api')) {
          count += countCases(child)
        }
      })
    }
    return count
  }

  const transformNode = (node) => {
    // 处理模块节点
    if (node.type === 'module') {
      const transformedNode = {
        id: `module_${node.moduleId}`,
        moduleId: node.moduleId,
        name: node.name,
        type: 'group',
        count: 0,
        children: []
      }

      // 递归处理子模块
      if (node.children && node.children.length > 0) {
        transformedNode.children.push(...node.children.map(transformNode).filter(Boolean))
      }

      // 处理测试用例
      if (node.testCases && node.testCases.length > 0) {
        transformedNode.children.push(...node.testCases.map(tc => transformTestCase(tc)).filter(Boolean))
      }

      // 计算该模块下的 case 总数
      transformedNode.count = countCases(transformedNode)

      return transformedNode
    }

    // 处理根级别的 api 类型节点（与module并列）
    if (node.type === 'api' || node.type === 'case') {
      return transformTestCase(node)
    }

    return null
  }

  try {
    return apiResponse.rows.map(transformNode).filter(Boolean)
  } catch (error) {
    console.error('Error transforming tree data:', error)
    return []
  }
}

// 搜索树形数据
export function searchTreeData(treeData, keyword) {
  if (!keyword) return treeData
  
  const searchInTree = (nodes) => {
    return nodes.reduce((result, node) => {
      const matchesSearch = node.name.toLowerCase().includes(keyword.toLowerCase())
      const children = node.children ? searchInTree(node.children) : []
      
      if (matchesSearch || children.length > 0) {
        result.push({
          ...node,
          children
        })
      }
      
      return result
    }, [])
  }
  
  return searchInTree(treeData)
}

// 获取节点统计信息
export function getTreeStatistics(treeData) {
  let moduleCount = 0
  let caseCount = 0

  const traverse = (nodes) => {
    nodes.forEach(node => {
      if (node.type === 'group') {
        moduleCount++
      } else if (node.type === 'case') {
        caseCount++
      }

      if (node.children && node.children.length > 0) {
        traverse(node.children)
      }
    })
  }

  traverse(treeData)

  return {
    groups: moduleCount,
    cases: caseCount,
    total: moduleCount + caseCount
  }
}

// 获取测试用例统计信息（只统计 apiType === 'case' 的节点）
export function getCaseOnlyStatistics(treeData) {
  let moduleCount = 0
  let caseCount = 0

  const traverse = (nodes) => {
    nodes.forEach(node => {
      if (node.type === 'group') {
        moduleCount++
      } else if (node.type === 'case' && node.apiType === 'case') {
        caseCount++
      }

      if (node.children && node.children.length > 0) {
        traverse(node.children)
      }
    })
  }

  traverse(treeData)

  return {
    groups: moduleCount,
    cases: caseCount,
    total: moduleCount + caseCount
  }
}

// API树数据转换函数（只处理api类型，不处理case类型）
export function transformApiTreeData(apiResponse) {
  if (!apiResponse || !apiResponse.rows) {
    return []
  }

  const transformApiNode = (apiItem) => {
    if (!apiItem.caseId) {
      return null
    }

    return {
      id: `api_${apiItem.caseId}`,
      caseId: apiItem.caseId,
      name: apiItem.name,
      method: apiItem.method || 'GET',
      type: 'api',
      moduleId: apiItem.moduleId,
      children: []
    }
  }

  // 计算节点下的接口数量
  const countApis = (node) => {
    let count = 0
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        if (child.type === 'api') {
          count++
        } else if (child.type === 'group') {
          count += countApis(child)
        }
      })
    }
    return count
  }

  const transformNode = (node) => {
    // 处理模块节点
    if (node.type === 'module') {
      const transformedNode = {
        id: `module_${node.moduleId}`,
        moduleId: node.moduleId,
        name: node.name,
        type: 'group',
        count: 0,
        children: []
      }

      // 递归处理子模块
      if (node.children && node.children.length > 0) {
        const childNodes = node.children.map(transformNode).filter(Boolean)
        transformedNode.children.push(...childNodes)
      }

      // 处理接口（只处理type为api的）
      if (node.testCases && node.testCases.length > 0) {
        const apiNodes = node.testCases
          .filter(tc => tc.type === 'api')
          .map(transformApiNode)
          .filter(Boolean)
        transformedNode.children.push(...apiNodes)
      }

      // 计算该模块下的接口总数
      transformedNode.count = countApis(transformedNode)

      return transformedNode
    }

    // 处理根级别的 api 类型节点
    if (node.type === 'api') {
      return transformApiNode(node)
    }

    return null
  }

  try {
    return apiResponse.rows.map(transformNode).filter(Boolean)
  } catch (error) {
    console.error('Error transforming api tree data:', error)
    return []
  }
}

// 获取API树节点统计信息
export function getApiTreeStatistics(treeData) {
  let moduleCount = 0
  let apiCount = 0

  const traverse = (nodes) => {
    nodes.forEach(node => {
      if (node.type === 'group') {
        moduleCount++
      } else if (node.type === 'api') {
        apiCount++
      }

      if (node.children && node.children.length > 0) {
        traverse(node.children)
      }
    })
  }

  traverse(treeData)

  return {
    groups: moduleCount,
    apis: apiCount,
    total: moduleCount + apiCount
  }
}