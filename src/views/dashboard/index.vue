<template>
  <div class="dashboard-container">
    <!-- 顶部欢迎区域 -->
    <div class="welcome-header">
      <div class="welcome-content">
        <div class="user-info">
          <el-avatar :size="64" :src="currentUser.avatar" />
          <div class="user-details">
            <h2 class="welcome-title">欢迎回来，{{ currentUser.name }}</h2>
            <p class="user-role">{{ currentUser.title }} | {{ currentUser.department }}</p>
          </div>
        </div>
        <div class="quick-stats">
          <div class="stat-item">
            <div class="stat-value">{{ totalProjects }}</div>
            <div class="stat-label">测试项目</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ todayTests }}</div>
            <div class="stat-label">今日执行</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ successRate }}%</div>
            <div class="stat-label">成功率</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- <el-row :gutter="24"> -->
        <!-- 左侧主要区域 -->
        <el-col :xl="16" :lg="24" :md="24" :sm="24" :xs="24">
          <!-- 数据概览卡片 -->
          <div class="overview-cards">
            <el-row :gutter="16">
              <el-col :span="6">
                <el-card class="overview-card success">
                  <div class="card-content">
                    <div class="card-icon">
                      <el-icon size="32"><SuccessFilled /></el-icon>
                    </div>
                    <div class="card-info">
                      <div class="card-value">{{ testStats.passed }}</div>
                      <div class="card-label">通过测试</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card class="overview-card error">
                  <div class="card-content">
                    <div class="card-icon">
                      <el-icon size="32"><CircleCloseFilled /></el-icon>
                    </div>
                    <div class="card-info">
                      <div class="card-value">{{ testStats.failed }}</div>
                      <div class="card-label">失败测试</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card class="overview-card warning">
                  <div class="card-content">
                    <div class="card-icon">
                      <el-icon size="32"><Loading /></el-icon>
                    </div>
                    <div class="card-info">
                      <div class="card-value">{{ testStats.running }}</div>
                      <div class="card-label">运行中</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card class="overview-card info">
                  <div class="card-content">
                    <div class="card-icon">
                      <el-icon size="32"><DataAnalysis /></el-icon>
                    </div>
                    <div class="card-info">
                      <div class="card-value">{{ testStats.total }}</div>
                      <div class="card-label">总执行数</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>

          <!-- 测试任务状态 -->
          <el-card class="task-status-card" header="测试任务状态">
            <template #header>
              <div class="card-header">
                <span>测试任务状态</span>
                <el-button type="primary" size="small" @click="refreshTasks">
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
              </div>
            </template>
            <div class="task-status-content">
              <el-table :data="taskList" style="width: 100%" :show-header="true">
                <el-table-column prop="name" label="任务名称" width="200" />
                <el-table-column prop="status" label="状态" width="120">
                  <template #default="{ row }">
                    <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="progress" label="进度" width="150">
                  <template #default="{ row }">
                    <el-progress :percentage="row.progress" :status="getProgressStatus(row.status)" />
                  </template>
                </el-table-column>
                <el-table-column prop="duration" label="耗时" width="100" />
                <el-table-column prop="updatedAt" label="更新时间" />
              </el-table>
            </div>
          </el-card>
          <!-- 历史趋势图表 -->
          <el-card class="trend-chart-card">
            <template #header>
              <div class="card-header">
                <span>测试趋势分析</span>
                <el-radio-group v-model="trendPeriod" size="small">
                  <el-radio-button label="7">7天</el-radio-button>
                  <el-radio-button label="30">30天</el-radio-button>
                </el-radio-group>
              </div>
            </template>
            <div class="trend-chart" ref="trendChartContainer"></div>
          </el-card>
        </el-col>
        
        <!-- 右侧区域 -->
        <el-col :xl="8" :lg="24" :md="24" :sm="24" :xs="24">
          <!-- 快捷操作区 -->
          <el-card class="quick-actions-card">
            <template #header>
              <span>快捷操作</span>
            </template>
            <div class="quick-actions">
              <el-button type="primary" size="large" class="action-btn" @click="createNewTest">
                <el-icon><Plus /></el-icon>
                新建测试
              </el-button>
              <el-button type="success" size="large" class="action-btn" @click="viewReports">
                <el-icon><Document /></el-icon>
                查看报告
              </el-button>
              <el-button type="info" size="large" class="action-btn" @click="manageProjects">
                <el-icon><Setting /></el-icon>
                项目管理
              </el-button>
              <el-button type="warning" size="large" class="action-btn" @click="viewLogs">
                <el-icon><View /></el-icon>
                执行日志
              </el-button>
            </div>
          </el-card>

          <!-- 最近活动 -->
          <el-card class="recent-activity-card">
            <template #header>
              <span>最近活动</span>
            </template>
            <el-timeline class="activity-timeline">
              <el-timeline-item
                v-for="activity in recentActivities"
                :key="activity.id"
                :timestamp="activity.time"
                :type="activity.type"
              >
                <div class="activity-content">
                  <div class="activity-title">{{ activity.title }}</div>
                  <div class="activity-desc">{{ activity.description }}</div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </el-card>

          <!-- 系统状态 -->
          <el-card class="system-status-card">
            <template #header>
              <span>系统状态</span>
            </template>
            <div class="system-metrics">
              <div class="metric-item">
                <div class="metric-label">CPU使用率</div>
                <el-progress :percentage="systemStatus.cpu" :color="getMetricColor(systemStatus.cpu)" />
              </div>
              <div class="metric-item">
                <div class="metric-label">内存使用率</div>
                <el-progress :percentage="systemStatus.memory" :color="getMetricColor(systemStatus.memory)" />
              </div>
              <div class="metric-item">
                <div class="metric-label">磁盘使用率</div>
                <el-progress :percentage="systemStatus.disk" :color="getMetricColor(systemStatus.disk)" />
              </div>
            </div>
          </el-card>
        </el-col>
      <!-- </a-row> -->
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  SuccessFilled,
  CircleCloseFilled,
  Loading,
  DataAnalysis,
  Refresh,
  Plus,
  Document,
  Setting,
  View
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'

defineOptions({
  name: 'DashBoard'
})

// 用户信息
const currentUser = reactive({
  avatar: 'https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png',
  name: '测试工程师',
  title: '高级测试工程师',
  department: 'CaseGo自动化测试平台'
})

// 统计数据
const totalProjects = ref(28)
const todayTests = ref(156)
const successRate = ref(94.5)

// 测试统计数据
const testStats = reactive({
  passed: 1248,
  failed: 72,
  running: 8,
  total: 1328
})

// 趋势图表周期
const trendPeriod = ref('7')
const trendChartContainer = ref()
let trendChart = null

// 任务列表数据
const taskList = ref([
  {
    id: 1,
    name: 'API接口回归测试',
    status: 'running',
    progress: 65,
    duration: '12分钟',
    updatedAt: '2024-01-15 14:30:25'
  },
  {
    id: 2,
    name: '用户登录功能测试',
    status: 'completed',
    progress: 100,
    duration: '8分钟',
    updatedAt: '2024-01-15 14:25:10'
  },
  {
    id: 3,
    name: '数据库连接测试',
    status: 'failed',
    progress: 45,
    duration: '15分钟',
    updatedAt: '2024-01-15 14:20:05'
  },
  {
    id: 4,
    name: '性能压力测试',
    status: 'pending',
    progress: 0,
    duration: '-',
    updatedAt: '2024-01-15 14:15:00'
  }
])

// 最近活动数据
const recentActivities = ref([
  {
    id: 1,
    title: '测试任务执行完成',
    description: 'API接口回归测试已成功完成，通过率98.5%',
    time: '2024-01-15 14:30',
    type: 'success'
  },
  {
    id: 2,
    title: '新测试用例创建',
    description: '用户管理模块新增5个测试用例',
    time: '2024-01-15 13:45',
    type: 'primary'
  },
  {
    id: 3,
    title: '测试环境更新',
    description: '测试环境已更新至最新版本v2.1.0',
    time: '2024-01-15 12:20',
    type: 'info'
  },
  {
    id: 4,
    title: '测试失败告警',
    description: '数据库连接测试出现异常，请及时处理',
    time: '2024-01-15 11:30',
    type: 'danger'
  }
])

// 系统状态数据
const systemStatus = reactive({
  cpu: 45,
  memory: 68,
  disk: 32
})

// 方法函数
const getStatusType = (status) => {
  const statusMap = {
    running: 'warning',
    completed: 'success',
    failed: 'danger',
    pending: 'info'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status) => {
  const statusMap = {
    running: '运行中',
    completed: '已完成',
    failed: '失败',
    pending: '等待中'
  }
  return statusMap[status] || '未知'
}

const getProgressStatus = (status) => {
  if (status === 'failed') return 'exception'
  if (status === 'completed') return 'success'
  return null
}

const getMetricColor = (value) => {
  if (value >= 80) return '#f56c6c'
  if (value >= 60) return '#e6a23c'
  return '#67c23a'
}

// 刷新任务列表
const refreshTasks = () => {
  ElMessage.success('任务列表已刷新')
  // 这里可以添加实际的API调用
}

// 快捷操作方法
const createNewTest = () => {
  ElMessage.info('跳转到新建测试页面')
  // 这里可以添加路由跳转逻辑
}

const viewReports = () => {
  ElMessage.info('跳转到测试报告页面')
}

const manageProjects = () => {
  ElMessage.info('跳转到项目管理页面')
}

const viewLogs = () => {
  ElMessage.info('跳转到执行日志页面')
}

// 初始化趋势图表
const initTrendChart = () => {
  if (!trendChartContainer.value) return
  
  trendChart = echarts.init(trendChartContainer.value)
  
  const option = {
    title: {
      text: '测试执行趋势',
      left: 'center',
      textStyle: {
        fontSize: 16,
        color: '#333'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['通过', '失败', '总数'],
      bottom: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['01-09', '01-10', '01-11', '01-12', '01-13', '01-14', '01-15']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '通过',
        type: 'line',
        smooth: true,
        data: [120, 132, 101, 134, 90, 230, 210],
        itemStyle: {
          color: '#67c23a'
        }
      },
      {
        name: '失败',
        type: 'line',
        smooth: true,
        data: [10, 8, 15, 12, 6, 18, 12],
        itemStyle: {
          color: '#f56c6c'
        }
      },
      {
        name: '总数',
        type: 'line',
        smooth: true,
        data: [130, 140, 116, 146, 96, 248, 222],
        itemStyle: {
          color: '#409eff'
        }
      }
    ]
  }
  
  trendChart.setOption(option)
}

// 生命周期钩子
onMounted(() => {
  initTrendChart()
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    trendChart?.resize()
  })
})

onBeforeUnmount(() => {
  trendChart?.dispose()
  window.removeEventListener('resize', () => {
    trendChart?.resize()
  })
})
</script>

<style scoped lang="less">
.dashboard-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 84px);
}

.welcome-header {
  background: linear-gradient(135deg, #409eff 0%, #1e3a8a 100%);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  color: white;
  box-shadow: 0 4px 20px rgba(64, 158, 255, 0.3);
  
  .welcome-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    .user-info {
      display: flex;
      align-items: center;
      
      .user-details {
        margin-left: 16px;
        
        .welcome-title {
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }
        
        .user-role {
          font-size: 14px;
          opacity: 0.9;
          margin: 0;
        }
      }
    }
    
    .quick-stats {
      display: flex;
      gap: 32px;
      
      .stat-item {
        text-align: center;
        
        .stat-value {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 4px;
        }
        
        .stat-label {
          font-size: 12px;
          opacity: 0.8;
        }
      }
    }
  }
}

.main-content {
  .overview-cards {
    margin-bottom: 20px;
    
    .overview-card {
      border-radius: 8px;
      transition: all 0.3s ease;
      border: 1px solid #e4e7ed;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      }
      
      .card-content {
        display: flex;
        align-items: center;
        padding: 20px;
        
        .card-icon {
          font-size: 32px;
          margin-right: 16px;
        }
        
        .card-info {
          .card-value {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 4px;
          }
          
          .card-label {
            color: #666;
            font-size: 14px;
          }
        }
      }
      
      &.success {
        .card-icon { color: #67c23a; }
        .card-value { color: #67c23a; }
      }
      
      &.error {
        .card-icon { color: #f56c6c; }
        .card-value { color: #f56c6c; }
      }
      
      &.warning {
        .card-icon { color: #e6a23c; }
        .card-value { color: #e6a23c; }
      }
      
      &.info {
        .card-icon { color: #409eff; }
        .card-value { color: #409eff; }
      }
    }
  }
  
  .task-status-card {
    margin-bottom: 20px;
    border-radius: 8px;
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .task-status-content {
      padding: 0;
    }
  }
  
  .trend-chart-card {
    margin-bottom: 20px;
    border-radius: 8px;
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .trend-chart {
      height: 350px;
      width: 100%;
    }
  }
  
  .quick-actions-card {
    margin-bottom: 20px;
    border-radius: 8px;
    
    .quick-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      
      .action-btn {
        width: 100%;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border-radius: 6px;
        transition: all 0.3s ease;
        
        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
      }
    }
  }
  
  .recent-activity-card {
    margin-bottom: 20px;
    border-radius: 8px;
    
    .activity-timeline {
      padding: 16px 0;
      
      .activity-content {
        .activity-title {
          font-weight: 600;
          margin-bottom: 4px;
          color: #303133;
        }
        
        .activity-desc {
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }
  
  .system-status-card {
    border-radius: 8px;
    
    .system-metrics {
      .metric-item {
        margin-bottom: 16px;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .metric-label {
          margin-bottom: 8px;
          color: #303133;
          font-size: 14px;
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .welcome-header .welcome-content {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }
  
  .welcome-header .quick-stats {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 12px;
  }
  
  .welcome-header {
    padding: 16px;
  }
  
  .welcome-header .quick-stats {
    gap: 16px;
  }
  
  .overview-cards .overview-card {
    margin-bottom: 12px;
  }
  
  .main-content {
    .quick-actions {
      .action-btn {
        height: 40px;
        font-size: 14px;
      }
    }
  }
}

@media (max-width: 576px) {
  .welcome-header .welcome-content {
    .user-info {
      flex-direction: column;
      text-align: center;
      
      .user-details {
        margin-left: 0;
        margin-top: 12px;
      }
    }
    
    .quick-stats {
      flex-wrap: wrap;
      gap: 16px;
      
      .stat-item {
        min-width: 80px;
      }
    }
  }
}
</style>