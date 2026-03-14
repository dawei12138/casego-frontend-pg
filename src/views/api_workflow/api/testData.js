// 测试数据集管理API

import request from '@/utils/request'

/**
 * 获取工作流测试数据集列表
 * @param {number} workflowId - 工作流ID
 * @returns {Promise}
 */
export function getWorkflowTestDataList(workflowId) {
  return request({
    url: `/workflow/workflow/workflowtable`,
    method: 'get',
    params: { workflowId }
  })
}

/**
 * 获取测试数据集详情
 * @param {number} parameterizationId - 参数化ID
 * @returns {Promise}
 */
export function getTestDataDetail(parameterizationId) {
  return request({
    url: `/api_param_table/table/${parameterizationId}`,
    method: 'get'
  })
}

/**
 * 创建测试数据集
 * @param {Object} data - 测试数据集信息
 * @returns {Promise}
 */
export function createTestDataSet(data) {
  return request({
    url: '/api_param_table/table',
    method: 'post',
    data
  })
}

/**
 * 更新测试数据集
 * @param {Object} data - 测试数据集信息
 * @returns {Promise}
 */
export function updateTestDataSet(data) {
  return request({
    url: '/api_param_table/table',
    method: 'put',
    data
  })
}

/**
 * 删除测试数据集
 * @param {number} parameterizationId - 参数化ID
 * @returns {Promise}
 */
export function deleteTestDataSet(parameterizationId) {
  return request({
    url: `/api_param_table/table/${parameterizationId}`,
    method: 'delete'
  })
}

/**
 * 添加测试数据行
 * @param {Object} data - 行数据
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
 * @param {Object} data - 行数据
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
 * @param {number} keyId - 行ID
 * @returns {Promise}
 */
export function deleteTestDataRow(keyId) {
  return request({
    url: `/api_param_table/table/row/${keyId}`,
    method: 'delete'
  })
}

/**
 * 批量更新测试数据行
 * @param {Array} data - 数据行列表
 * @returns {Promise}
 */
export function batchUpdateTestDataRows(data) {
  return request({
    url: '/api_param_item/item',
    method: 'put',
    data
  })
}
