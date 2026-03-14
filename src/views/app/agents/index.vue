<template>
  <div class="app-container">
    <!-- 刷新开关 -->
    <el-switch
      v-model="isFlush"
      class="refresh"
      active-value="1"
      inactive-value="0"
      style="float: right; margin-bottom: 10px"
      active-text="自动刷新"
      active-color="#13ce66"
      @change="refreshNow"
    />

    <el-card>
      <el-table :data="agentList" border style="width: 100%">
        <el-table-column
          prop="id"
          label="Agent ID"
          align="center"
          width="100"
        />
        <el-table-column
          prop="name"
          label="Agent Name"
          header-align="center"
          show-overflow-tooltip
        />
        <el-table-column
          prop="host"
          label="Host"
          align="center"
          show-overflow-tooltip
          width="150"
        />
        <el-table-column
          prop="port"
          label="Port"
          align="center"
          width="90"
        />
        <el-table-column
          prop="systemType"
          label="系统类型"
          align="center"
          width="150"
        >
          <template #default="scope">
            <div style="display: flex; align-items: center; justify-content: center">
              <span>{{ scope.row.systemType }}</span>
              <el-tag
                v-if="scope.row.systemType && scope.row.systemType !== 'unknown'"
                :type="getSystemTagType(scope.row.systemType)"
                size="small"
                style="margin-left: 8px"
              >
                {{ getSystemLabel(scope.row.systemType) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          prop="version"
          label="版本"
          align="center"
          width="120"
        />
        <el-table-column
          prop="secretKey"
          label="Agent Key"
          align="center"
          width="130"
        >
          <template #default="scope">
            <el-button size="small" @click="copyKey(scope.row.secretKey)">
              点击复制
            </el-button>
          </template>
        </el-table-column>
        <el-table-column
          prop="status"
          label="状态"
          align="center"
          width="100"
        >
          <template #default="scope">
            <el-tag v-if="scope.row.status === 1" size="small" type="success">
              在线
            </el-tag>
            <el-tag v-else-if="scope.row.status === 2" size="small" type="info">
              离线
            </el-tag>
            <el-tag v-else-if="scope.row.status === 3" size="small" type="warning">
              S2AE
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          align="center"
          width="260"
        >
          <template #default="scope">
            <el-button
              size="small"
              :disabled="scope.row.status !== 1 || scope.row.hasHub === 0"
              @click="hubSetting(scope.row.id)"
            >
              Hub配置
            </el-button>
            <el-button
              size="small"
              type="primary"
              @click="editAgent(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              :disabled="scope.row.status !== 1"
              @click="shutdownAgent(scope.row.id)"
            >
              停止
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <el-empty v-if="agentList.length === 0" description="暂无Agent数据" />
    </el-card>

    <!-- 编辑Agent对话框 -->
    <el-dialog
      v-model="dialogAgent"
      title="Agent信息"
      width="600px"
    >
      <el-form
        v-if="dialogAgent"
        ref="updateAgentForm"
        :model="agent"
        size="small"
        label-width="100px"
        label-position="left"
      >
        <el-form-item
          prop="name"
          label="Agent名称"
          :rules="{ required: true, message: '请输入Agent名称', trigger: 'blur' }"
        >
          <el-input
            v-model="agent.name"
            placeholder="请输入Agent名称"
          />
        </el-form-item>

        <el-divider />

        <el-alert
          style="margin-bottom: 15px"
          title="温度告警说明"
          type="info"
          show-icon
          :closable="false"
        >
          <template #default>
            <div>
              当设备温度超过
              <span style="color: #409eff">高温阈值</span>
              时（仅限安卓设备）
            </div>
            <div>
              如果
              <span style="color: #e6a23c">持续时间</span>
              超过设定的分钟数后仍处于
              <span style="color: #409eff">高温</span>
              状态，将会发送告警通知并
              <span style="color: #f56c6c">自动关闭设备</span>。
            </div>
          </template>
        </el-alert>

        <el-form-item label="高温阈值">
          <el-slider
            v-model="agent.highTemp"
            :format-tooltip="formatHighTemp"
            show-input
            :max="80"
            :min="1"
          />
        </el-form-item>

        <el-form-item label="持续时间">
          <el-input-number
            v-model="agent.highTempTime"
            :max="120"
            :min="1"
          />
          <span style="margin-left: 10px">分钟</span>
        </el-form-item>

        <el-form-item label="告警机器人">
          <el-checkbox
            :checked="agent.alertRobotIds == null"
            style="margin-bottom: 10px"
            @change="handleDefaultRobot"
          >
            使用默认告警机器人
          </el-checkbox>
          <template v-if="agent.alertRobotIds != null">
            <el-select
              v-model="agent.alertRobotIds"
              multiple
              clearable
              style="width: 100%"
              placeholder="请选择告警机器人"
            >
              <el-option
                v-for="item in robotData"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </template>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogAgent = false">取消</el-button>
        <el-button type="primary" @click="updateAgent">确定</el-button>
      </template>
    </el-dialog>

    <!-- Hub配置对话框 -->
    <el-dialog
      v-model="dialogHub"
      title="Hub配置"
      width="1300px"
    >
      <div v-if="dialogHub">
        <el-empty description="Hub配置功能开发中..." />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, onBeforeMount, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getAllAgents,
  updateAgent as updateAgentApi,
  stopAgent,
  listAlertRobots
} from '@/api/app/agents'

// 定时器
const timer = ref(null)

// Agent列表
const agentList = ref([])

// 告警机器人列表
const robotData = ref([])

// 自动刷新
const isFlush = ref('0')

// Agent编辑对话框
const dialogAgent = ref(false)
const updateAgentForm = ref(null)
const agent = ref({
  id: 0,
  name: '',
  highTemp: 45,
  highTempTime: 15,
  robotSecret: '',
  robotToken: '',
  robotType: 1,
  alertRobotIds: null
})

// Hub配置对话框
const dialogHub = ref(false)
const settingId = ref(0)

// 监听对话框关闭时重置表单
watch(dialogAgent, (newValue) => {
  if (!newValue) {
    agent.value = {
      id: 0,
      name: '',
      highTemp: 45,
      highTempTime: 15,
      robotSecret: '',
      robotToken: '',
      robotType: 1,
      alertRobotIds: null
    }
  }
})

// 格式化高温显示
const formatHighTemp = (value) => {
  return `${value} ℃`
}

// 获取系统类型标签
const getSystemTagType = (systemType) => {
  if (systemType.indexOf('Mac') !== -1) return 'info'
  if (systemType.indexOf('Windows') !== -1) return 'primary'
  if (systemType.indexOf('Linux') !== -1) return 'warning'
  return 'info'
}

const getSystemLabel = (systemType) => {
  if (systemType.indexOf('Mac') !== -1) return 'Mac'
  if (systemType.indexOf('Windows') !== -1) return 'Win'
  if (systemType.indexOf('Linux') !== -1) return 'Linux'
  return ''
}

// 复制Agent Key
const copyKey = async (value) => {
  try {
    await navigator.clipboard.writeText(value)
    ElMessage.success('复制成功')
  } catch (e) {
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = value
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      ElMessage.success('复制成功')
    } catch (err) {
      ElMessage.error('复制失败')
    }
    document.body.removeChild(textArea)
  }
}

// Hub配置
const hubSetting = async (id) => {
  settingId.value = id
  dialogHub.value = true
}

// 编辑Agent
const editAgent = (row) => {
  agent.value = {
    id: row.id,
    name: row.name,
    highTemp: row.highTemp || 45,
    highTempTime: row.highTempTime || 15,
    robotType: row.robotType,
    robotToken: row.robotToken,
    robotSecret: row.robotSecret,
    alertRobotIds: row.alertRobotIds
  }
  dialogAgent.value = true
}

// 处理默认机器人切换
const handleDefaultRobot = (auto) => {
  agent.value.alertRobotIds = auto ? null : []
}

// 更新Agent
const updateAgent = async () => {
  try {
    if (!agent.value.name) {
      ElMessage.warning('请输入Agent名称')
      return
    }
    const resp = await updateAgentApi(agent.value)
    if (resp.code === 200) {
      ElMessage.success(resp.msg || '保存成功')
      dialogAgent.value = false
      loadAgents()
    }
  } catch (error) {
    console.error('更新Agent失败:', error)
    ElMessage.error('保存失败')
  }
}

// 停止Agent
const shutdownAgent = async (id) => {
  try {
    const resp = await stopAgent(id)
    if (resp.code === 200) {
      ElMessage.success(resp.msg || '停止命令已发送')
    }
  } catch (error) {
    console.error('停止Agent失败:', error)
    ElMessage.error('停止失败')
  }
}

// 获取Agent列表
const loadAgents = async () => {
  try {
    const resp = await getAllAgents()
    if (resp.code === 200) {
      agentList.value = resp.rows || []
    }
  } catch (error) {
    console.error('获取Agent列表失败:', error)
    clearInterval(timer.value)
  }
}

// 获取告警机器人列表
const loadAlertRobots = async () => {
  try {
    const resp = await listAlertRobots('agent')
    if (resp.code === 200) {
      robotData.value = resp.rows || resp.data || []
    }
  } catch (error) {
    console.error('获取告警机器人列表失败:', error)
  }
}

// 刷新数据
const refresh = () => {
  loadAgents()
}

// 自动刷新切换
const refreshNow = (t) => {
  if (t !== 'switch') {
    localStorage.setItem('SonicAgentIsRefresh', t)
  }
  if (t === '1' || t === 'switch') {
    if (t === '1') {
      timer.value = setInterval(refresh, 15000)
    }
    refresh()
  } else {
    clearInterval(timer.value)
  }
}

// 生命周期钩子
onBeforeMount(() => {
  isFlush.value = localStorage.getItem('SonicAgentIsRefresh') || '0'
})

onMounted(() => {
  loadAgents()
  loadAlertRobots()

  if (isFlush.value === '1') {
    timer.value = setInterval(refresh, 15000)
  }
})

onUnmounted(() => {
  clearInterval(timer.value)
})
</script>

<style scoped>
.refresh {
  margin-bottom: 10px;
}
</style>
