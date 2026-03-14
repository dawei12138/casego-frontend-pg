import request from '@/utils/request'

// 获取工作流节点树
export function getWorkflowNodes(workflowId) {
  return request({
    url: `/workflow/workflow/${workflowId}`,
    method: 'get'
  })
}

// 获取节点详细信息
export function getWorkflowNode(nodeId) {
  return request({
    url: `/api_worknodes/worknodes/${nodeId}`,
    method: 'get'
  })
}

// 新增工作流节点
export function addWorkflowNode(data) {
  return request({
    url: '/api_worknodes/worknodes',
    method: 'post',
    data: data
  })
}

// 修改工作流节点
export function updateWorkflowNode(data) {
  return request({
    url: '/api_worknodes/worknodes',
    method: 'put',
    data: data
  })
}

// 删除工作流节点
export function delWorkflowNode(nodeId) {
  return request({
    url: `/api_worknodes/worknodes/${nodeId}`,
    method: 'delete'
  })
}

// 批量删除工作流节点
export function delWorkflowNodes(nodeIds) {
  // 如果是数组，转换为逗号分隔的字符串
  const idsParam = Array.isArray(nodeIds) ? nodeIds.join(',') : nodeIds
  return request({
    url: `/api_worknodes/worknodes/${idsParam}`,
    method: 'delete'
  })
}

// 移动节点位置
export function moveWorkflowNode(data) {
  return request({
    url: '/api_worknodes/worknodes/move',
    method: 'put',
    data: data
  })
}

// 复制节点
export function copyWorkflowNode(nodeId) {
  return request({
    url: `/api_worknodes/worknodes/copy/${nodeId}`,
    method: 'post'
  })
}

// 批量更新节点排序
export function updateNodesSort(data) {
  return request({
    url: '/api_worknodes/worknodes/sort',
    method: 'put',
    data: data
  })
}

// 工具函数：转换节点树数据
export function transformNodeTreeData(apiResponse) {
  if (!apiResponse) {
    return []
  }

  // 处理不同的 API 响应格式
  let nodeData = null
  
  // 如果响应包含 worknodes 字段（工作流详情接口）
  if (apiResponse.worknodes && Array.isArray(apiResponse.worknodes)) {
    nodeData = apiResponse.worknodes
  }
  // 如果响应包含 data 字段（节点列表接口）
  else if (apiResponse.data) {
    nodeData = Array.isArray(apiResponse.data) ? apiResponse.data : [apiResponse.data]
  }
  // 如果响应直接是数组
  else if (Array.isArray(apiResponse)) {
    nodeData = apiResponse
  }
  
  if (!nodeData || nodeData.length === 0) {
    return []
  }

  const transformNode = (node) => {
    const transformed = {
      id: `node_${node.nodeId}`,
      nodeId: node.nodeId,
      workflowId: node.workflowId,
      parentId: node.parentId,
      name: node.name,
      type: node.type,
      isRun: node.isRun,
      sortNo: node.sortNo,
      config: node.config || {},
      createBy: node.createBy,
      createTime: node.createTime,
      updateBy: node.updateBy,
      updateTime: node.updateTime,
      remark: node.remark,
      description: node.description,
      delFlag: node.delFlag,
      children: []
    }

    // 递归处理子节点
    if (node.children && Array.isArray(node.children)) {
      transformed.children = node.children.map(transformNode).filter(Boolean)
    }

    return transformed
  }

  // 构建树形结构
  const transformedNodes = nodeData.map(transformNode).filter(Boolean)
  
  // 如果节点有 parentId，需要构建父子关系
  const nodeMap = new Map()
  const rootNodes = []
  
  // 先创建所有节点的映射
  transformedNodes.forEach(node => {
    nodeMap.set(node.nodeId, node)
  })
  
  // 构建父子关系
  transformedNodes.forEach(node => {
    if (node.parentId && nodeMap.has(node.parentId)) {
      const parent = nodeMap.get(node.parentId)
      parent.children.push(node)
    } else {
      // 没有父节点的作为根节点
      rootNodes.push(node)
    }
  })
  
  // 递归排序函数：按照 sortNo 从小到大排序，sortNo为0的节点始终排在最底层
  const sortNodesBySortNo = (nodes) => {
    if (!nodes || !Array.isArray(nodes)) return nodes
    
    // 分离sortNo为0的节点和非0的节点
    const zeroSortNodes = nodes.filter(node => (node.sortNo || 0) === 0)
    const nonZeroSortNodes = nodes.filter(node => (node.sortNo || 0) !== 0)
    
    // 对非0节点按 sortNo 排序
    nonZeroSortNodes.sort((a, b) => {
      const sortNoA = a.sortNo || 0
      const sortNoB = b.sortNo || 0
      return sortNoA - sortNoB
    })
    
    // 对sortNo为0的节点也按其他属性排序（如创建时间或节点ID）
    zeroSortNodes.sort((a, b) => {
      // 如果都是0，可以按节点ID或其他属性排序保持稳定性
      return (a.nodeId || '').localeCompare(b.nodeId || '')
    })
    
    // 合并：非0节点在前，sortNo为0的节点在后
    const sortedNodes = [...nonZeroSortNodes, ...zeroSortNodes]
    
    // 递归排序子节点
    sortedNodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        node.children = sortNodesBySortNo(node.children)
      }
    })
    
    return sortedNodes
  }
  
  // 对根节点和所有子节点进行排序
  const finalNodes = rootNodes.length > 0 ? rootNodes : transformedNodes
  return sortNodesBySortNo(finalNodes)
}

// 工具函数：搜索节点树
export function searchNodeTree(treeData, keyword) {
  if (!keyword || !keyword.trim()) {
    return treeData
  }

  const searchKeyword = keyword.toLowerCase().trim()

  const filterTree = (nodes) => {
    return nodes.filter(node => {
      const nameMatch = node.name && node.name.toLowerCase().includes(searchKeyword)
      const typeMatch = node.type && node.type.toLowerCase().includes(searchKeyword)
      const hasMatchingChildren = node.children && node.children.length > 0 && filterTree(node.children).length > 0

      if (nameMatch || typeMatch || hasMatchingChildren) {
        if (hasMatchingChildren) {
          node.children = filterTree(node.children)
        }
        return true
      }

      return false
    })
  }

  return filterTree([...treeData])
}

// 工具函数：获取节点路径
export function getNodePath(treeData, targetNodeId) {
  const path = []

  const findPath = (nodes, nodeId, currentPath = []) => {
    for (const node of nodes) {
      const newPath = [...currentPath, node]
      
      if (node.nodeId === nodeId) {
        path.push(...newPath)
        return true
      }

      if (node.children && node.children.length > 0) {
        if (findPath(node.children, nodeId, newPath)) {
          return true
        }
      }
    }
    return false
  }

  findPath(treeData, targetNodeId)
  return path
}

// 工具函数：获取节点统计信息
export function getNodeTreeStatistics(treeData) {
  let taskCount = 0
  let groupCount = 0
  let totalCount = 0

  const countNodes = (nodes) => {
    nodes.forEach(node => {
      totalCount++
      if (node.type === 'task') {
        taskCount++
      } else if (node.type === 'group') {
        groupCount++
      }

      if (node.children && node.children.length > 0) {
        countNodes(node.children)
      }
    })
  }

  countNodes(treeData)

  return {
    taskCount,
    groupCount,
    totalCount
  }
}

// 工具函数：验证节点配置
export function validateNodeConfig(node) {
  const errors = []

  if (!node.name || node.name.trim() === '') {
    errors.push('节点名称不能为空')
  }

  if (!node.type || !['task', 'group'].includes(node.type)) {
    errors.push('节点类型必须是 task 或 group')
  }

  if (node.type === 'task' && node.config && node.config.taskConfig) {
    const taskConfig = node.config.taskConfig
    if (!taskConfig.task_type) {
      errors.push('任务类型不能为空')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// 工具函数：格式化节点配置用于显示
export function formatNodeConfigForDisplay(config) {
  if (!config) return {}

  const formatted = {
    基本配置: {},
    任务配置: {},
    条件配置: {},
    循环配置: {},
    错误处理: {},
    其他配置: {}
  }

  // 任务配置
  if (config.taskConfig) {
    const taskConfig = config.taskConfig
    formatted.任务配置 = {
      '任务类型': taskConfig.task_type || '未设置',
      '用例ID': taskConfig.case_id || '未设置',
      'API ID': taskConfig.api_id || '未设置',
      'Web用例ID': taskConfig.web_case_id || '未设置',
      '数据库操作ID': taskConfig.db_operation_id || '未设置',
      '数据库脚本': taskConfig.db_operation_script || '未设置',
      '自定义脚本': taskConfig.custom_script || '未设置',
      '公共脚本': taskConfig.publicscript || '未设置',
      '等待时间': `${taskConfig.wait_time || 0}ms`
    }
  }

  // 条件配置
  if (config.expectedValue !== undefined || config.actualValue !== undefined) {
    formatted.条件配置 = {
      '期望值': config.expectedValue || '未设置',
      '实际值': config.actualValue || '未设置',
      '条件': config.condition || '=',
      'Else节点ID': config.elseNodeId || '未设置',
      '绑定If节点ID': config.bindIfNodeId || '未设置'
    }
  }

  // 循环配置
  if (config.loopCount !== undefined || config.loopArray) {
    formatted.循环配置 = {
      '循环次数': config.loopCount || '未设置',
      '循环数组': Array.isArray(config.loopArray) ? config.loopArray.join(', ') : '未设置',
      '中断条件': config.breakCondition && config.breakCondition.length > 0 
        ? config.breakCondition.map(bc => `${bc.actualValue} ${bc.condition} ${bc.expectedValue}`).join(', ')
        : '未设置'
    }
  }

  // 错误处理
  if (config.onError) {
    formatted.错误处理 = {
      '错误处理方式': config.onError
    }
  }

  // 其他配置
  if (config.extraConfig && Object.keys(config.extraConfig).length > 0) {
    formatted.其他配置 = config.extraConfig
  }

  // 移除空的配置组
  Object.keys(formatted).forEach(key => {
    if (Object.keys(formatted[key]).length === 0) {
      delete formatted[key]
    }
  })

  return formatted
}