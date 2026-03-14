import request from '@/utils/request'
import { useProjectStore } from '@/store/modules/project'

// 获取工作流树结构
export function getWorkflowTree(query) {
  const projectStore = useProjectStore()
  return request({
    url: '/workflow/workflow/tree',
    method: 'get',
    params: {
      ...query,
      projectId: projectStore.projectId
    }
  })
}

// 添加工作流模块（使用 project_submodules 接口，type: "2" 表示工作流模块）
export function addWorkflowModule(data) {
  const projectStore = useProjectStore()
  return request({
    url: '/api_project_submodules/project_submodules',
    method: 'post',
    data: {
      ...data,
      projectId: projectStore.projectId,
      type: "2"  // type: "2" 表示工作流模块
    }
  })
}

// 更新工作流模块
export function updateWorkflowModule(data) {
  return request({
    url: '/api_project_submodules/project_submodules',
    method: 'put',
    data: data
  })
}

// 删除工作流模块
export function delWorkflowModule(moduleId) {
  return request({
    url: '/api_project_submodules/project_submodules/' + moduleId,
    method: 'delete'
  })
}

// 获取工作流详情
export function getWorkflow(workflowId) {
  return request({
    url: `/workflow/workflow/${workflowId}`,
    method: 'get'
  })
}

// 添加工作流
export function addWorkflow(data) {
  return request({
    url: '/workflow/workflow',
    method: 'post',
    data
  })
}

// 更新工作流
export function updateWorkflow(data) {
  return request({
    url: '/workflow/workflow',
    method: 'put',
    data
  })
}

// 保存工作流
export function saveWorkflow(data) {
  return request({
    url: '/workflow/workflow/save',
    method: 'post',
    data
  })
}

// 删除工作流（支持批量删除，用逗号分隔）
export function delWorkflow(workflowIds) {
  // 支持单个ID或数组
  const ids = Array.isArray(workflowIds) ? workflowIds.join(',') : workflowIds
  return request({
    url: '/workflow/workflow/' + ids,
    method: 'delete'
  })
}

// 执行工作流
export function executeWorkflow(data) {
  return request({
    url: '/workflow/workflow/execute',
    method: 'post',
    data
  })
}

// 复制工作流
export function copyWorkflow(data) {
  return request({
    url: '/workflow/workflow/copy',
    method: 'post',
    data
  })
}

// 工具函数：转换工作流树数据
export function transformWorkflowTreeData(data) {
  if (!data || !Array.isArray(data)) {
    return []
  }
  
  const transform = (items) => {
    return items.map(item => {
      const transformed = {
        id: item.type === 'module' ? `module_${item.moduleId}` : `workflow_${item.workflowId}`,
        label: item.name,
        type: item.type,
        moduleId: item.moduleId,
        workflowId: item.workflowId,
        name: item.name,
        count: item.count || 0,
        children: []
      }
      
      // 处理子模块
      if (item.children && Array.isArray(item.children)) {
        transformed.children.push(...transform(item.children))
      }
      
      // 处理工作流
      if (item.workflows && Array.isArray(item.workflows)) {
        const workflows = item.workflows.map(workflow => ({
          id: `workflow_${workflow.workflowId}`,
          label: workflow.name,
          type: 'workflow',
          workflowId: workflow.workflowId,
          moduleId: item.moduleId,
          name: workflow.name,
          children: []
        }))
        transformed.children.push(...workflows)
      }
      
      return transformed
    })
  }
  
  return transform(data)
}

// 工具函数：搜索工作流树数据
export function searchWorkflowTreeData(data, keyword) {
  if (!keyword || !keyword.trim()) {
    return data
  }
  
  const searchKeyword = keyword.toLowerCase().trim()
  
  const filterTree = (items) => {
    return items.filter(item => {
      const nameMatch = item.name && item.name.toLowerCase().includes(searchKeyword)
      const hasMatchingChildren = item.children && item.children.length > 0 && filterTree(item.children).length > 0
      
      if (nameMatch || hasMatchingChildren) {
        if (hasMatchingChildren) {
          item.children = filterTree(item.children)
        }
        return true
      }
      
      return false
    })
  }
  
  return filterTree(data)
}

// 工具函数：获取工作流树统计信息
export function getWorkflowTreeStatistics(data) {
  let moduleCount = 0
  let workflowCount = 0
  
  const countItems = (items) => {
    items.forEach(item => {
      if (item.type === 'module') {
        moduleCount++
      } else if (item.type === 'workflow') {
        workflowCount++
      }
      
      if (item.children && Array.isArray(item.children)) {
        countItems(item.children)
      }
    })
  }
  
  if (data && Array.isArray(data)) {
    countItems(data)
  }
  
  return {
    moduleCount,
    workflowCount,
    totalCount: moduleCount + workflowCount
  }
}