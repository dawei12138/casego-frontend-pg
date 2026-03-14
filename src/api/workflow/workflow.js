import request from '@/utils/request'
import { useProjectStore } from '@/store/modules/project'

// 查询工作流树结构
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

// 查询测试执行器主列表
export function listWorkflow(query) {
  return request({
    url: '/workflow/workflow/list',
    method: 'get',
    params: query
  })
}

// 查询测试执行器主详细
export function getWorkflow(workflowId) {
  return request({
    url: '/workflow/workflow/' + workflowId,
    method: 'get'
  })
}

// 新增测试执行器主
export function addWorkflow(data) {
  return request({
    url: '/workflow/workflow',
    method: 'post',
    data: data
  })
}

// 修改测试执行器主
export function updateWorkflow(data) {
  return request({
    url: '/workflow/workflow',
    method: 'put',
    data: data
  })
}

// 删除测试执行器主
export function delWorkflow(workflowId) {
  return request({
    url: '/workflow/workflow/' + workflowId,
    method: 'delete'
  })
}

// 新增工作流模块
export function addWorkflowModule(data) {
  const projectStore = useProjectStore()
  return request({
    url: '/workflow/workflow/module',
    method: 'post',
    data: {
      ...data,
      projectId: projectStore.projectId,
      type: "module"
    }
  })
}

// 修改工作流模块
export function updateWorkflowModule(data) {
  return request({
    url: '/workflow/workflow/module',
    method: 'put',
    data: data
  })
}

// 删除工作流模块
export function delWorkflowModule(moduleId) {
  return request({
    url: '/workflow/workflow/module/' + moduleId,
    method: 'delete'
  })
}

// 执行工作流
export function executeWorkflow(data) {
  return request({
    url: '/workflow/workflow/exec',
    method: 'post',
    data: data
  })
}

// 复制工作流
export function copyWorkflow(workflowId) {
  return request({
    url: '/workflow/workflow/copy/' + workflowId,
    method: 'post'
  })
}

// 转换树形数据
export function transformWorkflowTreeData(apiResponse) {
  if (!apiResponse || !apiResponse.rows) {
    return []
  }

  const transformNode = (node, parentId = null) => {
    const baseNode = {
      id: node.moduleId ? `module_${node.moduleId}` : `workflow_${node.workflowId}`,
      name: node.name,
      type: node.type,
      moduleId: node.moduleId,
      workflowId: node.workflowId,
      parentId: parentId,
      count: node.count || 0,
      showActions: false,
      dropdownVisible: false
    }

    const children = []
    
    // 添加子模块
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        children.push(transformNode(child, baseNode.id))
      })
    }
    
    // 添加工作流
    if (node.workflows && node.workflows.length > 0) {
      node.workflows.forEach(workflow => {
        children.push({
          id: `workflow_${workflow.workflowId}`,
          name: workflow.name,
          type: 'workflow',
          workflowId: workflow.workflowId,
          moduleId: node.moduleId,
          parentId: baseNode.id,
          showActions: false,
          dropdownVisible: false
        })
      })
    }
    
    if (children.length > 0) {
      baseNode.children = children
    }
    
    return baseNode
  }

  return apiResponse.rows.map(node => transformNode(node))
}

// 搜索树形数据
export function searchWorkflowTreeData(treeData, keyword) {
  if (!keyword) return treeData
  
  const filterNode = (node) => {
    const matchesKeyword = node.name.toLowerCase().includes(keyword.toLowerCase())
    
    if (node.children) {
      const filteredChildren = node.children.map(filterNode).filter(Boolean)
      
      if (matchesKeyword || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren
        }
      }
    } else if (matchesKeyword) {
      return node
    }
    
    return null
  }
  
  return treeData.map(filterNode).filter(Boolean)
}

// 获取树形统计数据
export function getWorkflowTreeStatistics(treeData) {
  let modules = 0
  let workflows = 0
  
  const countNodes = (nodes) => {
    nodes.forEach(node => {
      if (node.type === 'module') {
        modules++
      } else if (node.type === 'workflow') {
        workflows++
      }
      
      if (node.children) {
        countNodes(node.children)
      }
    })
  }
  
  countNodes(treeData)
  
  return {
    modules,
    workflows
  }
}
