// 测试节点数据
export const mockNodeTreeData = [
  {
    nodeId: "1",
    name: "主流程组",
    type: "group",
    parentId: null,
    isRun: 1,
    config: {
      description: "主要业务流程组"
    },
    children: [
      {
        nodeId: "2",
        name: "用户登录验证",
        type: "task",
        parentId: "1",
        isRun: 1,
        config: {
          taskConfig: {
            task_type: "api_test",
            case_id: 101,
            api_id: 201,
            timeout: 30,
            retry_count: 3
          },
          conditional: {
            condition_type: "response_code",
            expected_value: 200,
            operator: "equals"
          }
        },
        children: []
      },
      {
        nodeId: "3",
        name: "数据处理组",
        type: "group",
        parentId: "1",
        isRun: 1,
        config: {
          description: "数据处理相关任务"
        },
        children: [
          {
            nodeId: "4",
            name: "数据库查询",
            type: "task",
            parentId: "3",
            isRun: 1,
            config: {
              taskConfig: {
                task_type: "db_operation",
                db_operation_script: "SELECT * FROM users WHERE status = 'active'",
                timeout: 60
              }
            },
            children: []
          },
          {
            nodeId: "5",
            name: "数据验证",
            type: "task",
            parentId: "3",
            isRun: 0,
            config: {
              taskConfig: {
                task_type: "data_validation",
                validation_rules: [
                  {
                    field: "email",
                    type: "email",
                    required: true
                  },
                  {
                    field: "age",
                    type: "number",
                    min: 18,
                    max: 100
                  }
                ]
              },
              loop: {
                loop_type: "for_each",
                data_source: "query_result",
                max_iterations: 1000
              }
            },
            children: []
          }
        ]
      }
    ]
  },
  {
    nodeId: "6",
    name: "异常处理流程",
    type: "group",
    parentId: null,
    isRun: 1,
    config: {
      description: "异常情况处理流程"
    },
    children: [
      {
        nodeId: "7",
        name: "错误日志记录",
        type: "task",
        parentId: "6",
        isRun: 1,
        config: {
          taskConfig: {
            task_type: "log_operation",
            log_level: "error",
            log_message: "处理异常: ${error_message}"
          },
          conditional: {
            condition_type: "error_occurred",
            expected_value: true,
            operator: "equals"
          }
        },
        children: []
      }
    ]
  }
]

// 格式化配置信息的辅助函数
export const formatMockConfig = (nodeId, config) => {
  const formatted = {
    '基本配置': {},
    '任务配置': {},
    '条件配置': {},
    '循环配置': {}
  }

  if (config.description) {
    formatted['基本配置']['描述'] = config.description
  }

  if (config.taskConfig) {
    const taskConfig = config.taskConfig
    if (taskConfig.task_type) formatted['任务配置']['任务类型'] = taskConfig.task_type
    if (taskConfig.case_id) formatted['任务配置']['用例ID'] = taskConfig.case_id
    if (taskConfig.api_id) formatted['任务配置']['接口ID'] = taskConfig.api_id
    if (taskConfig.timeout) formatted['任务配置']['超时时间'] = `${taskConfig.timeout}秒`
    if (taskConfig.retry_count) formatted['任务配置']['重试次数'] = taskConfig.retry_count
    if (taskConfig.db_operation_script) formatted['任务配置']['数据库脚本'] = taskConfig.db_operation_script
    if (taskConfig.log_level) formatted['任务配置']['日志级别'] = taskConfig.log_level
    if (taskConfig.log_message) formatted['任务配置']['日志消息'] = taskConfig.log_message
    if (taskConfig.validation_rules) formatted['任务配置']['验证规则'] = `${taskConfig.validation_rules.length}条规则`
  }

  if (config.conditional) {
    const conditional = config.conditional
    if (conditional.condition_type) formatted['条件配置']['条件类型'] = conditional.condition_type
    if (conditional.expected_value) formatted['条件配置']['期望值'] = conditional.expected_value
    if (conditional.operator) formatted['条件配置']['操作符'] = conditional.operator
  }

  if (config.loop) {
    const loop = config.loop
    if (loop.loop_type) formatted['循环配置']['循环类型'] = loop.loop_type
    if (loop.data_source) formatted['循环配置']['数据源'] = loop.data_source
    if (loop.max_iterations) formatted['循环配置']['最大迭代次数'] = loop.max_iterations
  }

  return formatted
}