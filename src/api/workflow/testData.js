import request from '@/utils/request'

/**
 * 获取工作流的测试数据集列表
 * @param {number} workflowId - 工作流ID
 * @returns {Promise}
 */
export function getWorkflowTestDataList(workflowId) {
  return request({
    url: '/workflow/workflow/workflowtable',
    method: 'get',
    params: {
      workflowId
    }
  })
}

/**
 * 获取测试数据集详情
 * @param {number} parameterizationId - 参数化数据ID
 * @param {Object} params - 查询参数（支持分页）
 * @returns {Promise}
 */
export function getTestDataDetail(parameterizationId, params = {}) {
  return request({
    url: `/api_param_table/table/${parameterizationId}`,
    method: 'get',
    params
  })
}

/**
 * 创建测试数据集
 * @param {Object} data - 测试数据集数据
 * @returns {Promise}
 */
export function createTestData(data) {
  return request({
    url: '/api_param_table/table',
    method: 'post',
    data
  })
}

/**
 * 更新测试数据集
 * @param {Object} data - 测试数据集数据
 * @returns {Promise}
 */
export function updateTestData(data) {
  return request({
    url: '/api_param_table/table',
    method: 'put',
    data
  })
}

/**
 * 删除测试数据集
 * @param {number} parameterizationId - 参数化数据ID
 * @returns {Promise}
 */
export function deleteTestData(parameterizationId) {
  return request({
    url: `/api_param_table/table/${parameterizationId}`,
    method: 'delete'
  })
}

/**
 * 添加测试数据行
 * @param {Object} data - 数据行数据
 * @returns {Promise}
 */
export function addTestDataRow(data) {
  return request({
    url: '/api_param_table/table/row',
    method: 'post',
    data
  })
}

/**
 * 更新测试数据行
 * @param {Object} data - 数据行数据
 * @returns {Promise}
 */
export function updateTestDataRow(data) {
  return request({
    url: '/api_param_table/table/row',
    method: 'put',
    data
  })
}

/**
 * 删除测试数据行
 * @param {number} keyId - 数据行ID
 * @returns {Promise}
 */
export function deleteTestDataRow(keyId) {
  return request({
    url: `/api_param_table/table/row/${keyId}`,
    method: 'delete'
  })
}
