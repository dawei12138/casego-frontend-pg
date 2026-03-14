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
      <!-- 筛选条件 -->
      <el-collapse>
        <el-collapse-item name="1">
          <template #title>
            <el-input
              v-model="name"
              style="width: 440px"
              type="text"
              size="small"
              placeholder="请输入型号/设备名/序列号搜索"
              maxlength="40"
              clearable
              @input="handleInput"
            />

            <!-- 平均温度显示 -->
            <strong
              v-if="avgTem !== 0"
              style="
                margin-left: 20px;
                display: flex;
                align-items: center;
                font-size: 16px;
                white-space: nowrap;
                color: #909399;
              "
            >
              平均温度:
              <div
                :style="{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  color:
                    avgTem < 300
                      ? '#67C23A'
                      : avgTem < 350
                      ? '#E6A23C'
                      : '#F56C6C',
                  marginLeft: '5px'
                }"
              >
                <el-icon style="margin-right: 5px">
                  <Sunny v-if="avgTem < 300" />
                  <PartlyCloudy v-else-if="avgTem < 350" />
                  <Sunrise v-else />
                </el-icon>
                {{ (avgTem / 10).toFixed(1) + ' ℃' }}
              </div>
            </strong>
          </template>

          <!-- 筛选表单 -->
          <el-form
            label-position="left"
            class="filter-table-expand"
            label-width="100px"
          >
            <!-- Android版本 -->
            <el-form-item label="Android版本">
              <div style="display: flex">
                <el-checkbox
                  v-model="checkAllAndroid"
                  label="全选"
                  :indeterminate="isAllAndroid"
                  @change="handleAndroid"
                />
                <el-checkbox-group
                  v-model="androidSystem"
                  class="device-radio-p"
                  @change="handleCheckedAndroid"
                >
                  <el-checkbox
                    v-for="version in androidSystemVersion"
                    :key="version"
                    :label="version"
                  >
                    {{ version }}
                  </el-checkbox>
                </el-checkbox-group>
              </div>
            </el-form-item>

            <!-- iOS版本 -->
            <el-form-item label="iOS版本">
              <div style="display: flex">
                <el-checkbox
                  v-model="checkAlliOS"
                  label="全选"
                  :indeterminate="isAlliOS"
                  @change="handleIOS"
                />
                <el-checkbox-group
                  v-model="iOSSystem"
                  class="device-radio-p"
                  @change="handleCheckedIOS"
                >
                  <el-checkbox
                    v-for="version in iOSSystemVersion"
                    :key="version"
                    :label="version"
                  >
                    {{ version }}
                  </el-checkbox>
                </el-checkbox-group>
              </div>
            </el-form-item>

            <!-- Harmony版本 -->
            <el-form-item label="Harmony版本">
              <div style="display: flex">
                <el-checkbox
                  v-model="checkAllHarmony"
                  label="全选"
                  :indeterminate="isAllHarmony"
                  @change="handleHarmony"
                />
                <el-checkbox-group
                  v-model="harmonySystem"
                  class="device-radio-p"
                  @change="handleCheckedHarmony"
                >
                  <el-checkbox
                    v-for="version in harmonySystemVersion"
                    :key="version"
                    :label="version"
                  >
                    {{ version }}
                  </el-checkbox>
                </el-checkbox-group>
              </div>
            </el-form-item>

            <!-- 厂商 -->
            <el-form-item label="厂商">
              <div style="display: flex">
                <el-checkbox
                  v-model="checkAllMan"
                  label="全选"
                  :indeterminate="isAllMan"
                  @change="handleMan"
                />
                <el-checkbox-group
                  v-model="checkMan"
                  class="device-radio-p"
                  @change="handleCheckedMan"
                >
                  <el-checkbox
                    v-for="man in manufacturer"
                    :key="man"
                    :label="man"
                  >
                    {{ man }}
                  </el-checkbox>
                </el-checkbox-group>
              </div>
            </el-form-item>

            <!-- CPU -->
            <el-form-item label="CPU">
              <div style="display: flex">
                <el-checkbox
                  v-model="checkAllCpu"
                  label="全选"
                  :indeterminate="isAllCpu"
                  @change="handleCpu"
                />
                <el-checkbox-group
                  v-model="cpu"
                  class="device-radio-p"
                  @change="handleCheckedCpu"
                >
                  <el-checkbox v-for="c in cpus" :key="c" :label="c" />
                </el-checkbox-group>
              </div>
            </el-form-item>

            <!-- 分辨率 -->
            <el-form-item label="分辨率">
              <div style="display: flex">
                <el-checkbox
                  v-model="checkAllSize"
                  label="全选"
                  :indeterminate="isAllSize"
                  @change="handleSize"
                />
                <el-checkbox-group
                  v-model="size"
                  class="device-radio-p"
                  @change="handleCheckedSize"
                >
                  <el-checkbox v-for="s in sizes" :key="s" :label="s" />
                </el-checkbox-group>
              </div>
            </el-form-item>

            <!-- Agent -->
            <el-form-item label="Agent">
              <div style="display: flex">
                <el-checkbox
                  v-model="checkAllAgent"
                  label="全选"
                  :indeterminate="isAllAgent"
                  @change="handleAgent"
                />
                <el-checkbox-group
                  v-model="agentIds"
                  class="device-radio-p"
                  @change="handleCheckedAgent"
                >
                  <el-checkbox
                    v-for="agent in agentList"
                    :key="agent.id"
                    :label="agent.id"
                  >
                    {{ agent.name }}
                  </el-checkbox>
                </el-checkbox-group>
              </div>
            </el-form-item>

            <!-- 状态 -->
            <el-form-item label="状态">
              <div style="display: flex">
                <el-checkbox
                  v-model="checkAllStatus"
                  label="全选"
                  :indeterminate="isAllStatus"
                  @change="handleStatus"
                />
                <el-checkbox-group
                  v-model="status"
                  class="device-radio-p"
                  @change="handleCheckedStatus"
                >
                  <el-checkbox
                    v-for="statusDevice in statusList"
                    :key="statusDevice.value"
                    :label="statusDevice.value"
                  >
                    {{ getStatusText(statusDevice.value) }}
                  </el-checkbox>
                </el-checkbox-group>
              </div>
            </el-form-item>
          </el-form>
        </el-collapse-item>
      </el-collapse>

      <!-- 设备列表 -->
      <el-row :gutter="20" style="margin-top: 20px">
        <el-col
          v-for="device in pageData.content"
          :key="device.id"
          :xs="12"
          :sm="12"
          :md="12"
          :lg="6"
          :xl="6"
          style="margin-bottom: 20px"
        >
          <DeviceCard
            :device="device"
            :agent-list="agentList"
            @flush="findAll"
          />
        </el-col>
      </el-row>

      <!-- 空状态 -->
      <el-empty v-if="pageData.content && pageData.content.length === 0" description="暂无设备数据" />

      <!-- 分页 -->
      <pagination
        v-show="total > 0"
        v-model:page="queryParams.page"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="handlePagination"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, onBeforeMount } from 'vue'
import { ElMessage } from 'element-plus'
import { Sunny, PartlyCloudy, Sunrise } from '@element-plus/icons-vue'
import DeviceCard from './components/DeviceCard.vue'
import Pagination from '@/components/Pagination/index.vue'
import {
  listDevices,
  getFilterOption,
  findTemper
} from '@/api/app/devices'
import { getAllAgents } from '@/api/app/agents'

// 定时器
const timer = ref(null)
const laterTimer = ref(null)

// 平均温度
const avgTem = ref(0)

// 筛选条件 - Android
const checkAllAndroid = ref(false)
const isAllAndroid = ref(false)
const androidSystem = ref([])
const androidSystemVersion = ref([5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])

// 筛选条件 - iOS
const checkAlliOS = ref(false)
const isAlliOS = ref(false)
const iOSSystem = ref([])
const iOSSystemVersion = ref([9, 10, 11, 12, 13, 14, 15, 16, 17, 18])

// 筛选条件 - Harmony
const checkAllHarmony = ref(false)
const isAllHarmony = ref(false)
const harmonySystem = ref([])
const harmonySystemVersion = ref([1, 2, 3, 4])

// 筛选条件 - 厂商
const checkAllMan = ref(false)
const isAllMan = ref(false)
const checkMan = ref([])
const manufacturer = ref([
  'APPLE',
  'HUAWEI',
  'Xiaomi',
  'OPPO',
  'vivo',
  'samsung',
  'HONOR',
  'Meizu',
  'Google',
  'OnePlus',
  '360',
  'blackshark',
  'Yulong',
  'BBK',
  'nubia',
  'realme',
  'deltainno',
  'GIONEE',
  'HTC',
  'LGE',
  'Sony',
  'motorola',
  'asus',
  'Lenovo',
  'HMD Global',
  'Teclast'
])

// 筛选条件 - CPU
const checkAllCpu = ref(false)
const isAllCpu = ref(false)
const cpu = ref([])
const cpus = ref([])

// 筛选条件 - 分辨率
const checkAllSize = ref(false)
const isAllSize = ref(false)
const size = ref([])
const sizes = ref([])

// 筛选条件 - Agent
const checkAllAgent = ref(false)
const isAllAgent = ref(false)
const agentIds = ref([])
const agentList = ref([])

// 筛选条件 - 状态
const checkAllStatus = ref(false)
const isAllStatus = ref(false)
const status = ref([])
const statusList = ref([
  { value: 'ONLINE' },
  { value: 'DEBUGGING' },
  { value: 'TESTING' },
  { value: 'DISCONNECTED' },
  { value: 'OFFLINE' },
  { value: 'UNAUTHORIZED' },
  { value: 'ERROR' }
])

// 搜索词
const name = ref('')

// 自动刷新
const isFlush = ref('0')

// 分页数据
const pageData = ref({
  content: [],
  totalElements: 0,
  number: 0,
  size: 12
})
const total = ref(0)

// 查询参数
const queryParams = reactive({
  page: 1,
  pageSize: 12
})

// 状态文本映射
const getStatusText = (statusValue) => {
  const statusMap = {
    ONLINE: '空闲',
    DEBUGGING: '调试中',
    TESTING: '测试中',
    DISCONNECTED: '已断开',
    OFFLINE: '离线',
    UNAUTHORIZED: '未授权',
    ERROR: '异常'
  }
  return statusMap[statusValue] || statusValue
}

// Android版本筛选
const handleAndroid = (val) => {
  androidSystem.value = val ? androidSystemVersion.value : []
  isAllAndroid.value = false
  findAll()
}

const handleCheckedAndroid = (value) => {
  const checkedCount = value.length
  checkAllAndroid.value = checkedCount === androidSystemVersion.value.length
  isAllAndroid.value =
    checkedCount > 0 && checkedCount < androidSystemVersion.value.length
  findAll()
}

// iOS版本筛选
const handleIOS = (val) => {
  iOSSystem.value = val ? iOSSystemVersion.value : []
  isAlliOS.value = false
  findAll()
}

const handleCheckedIOS = (value) => {
  const checkedCount = value.length
  checkAlliOS.value = checkedCount === iOSSystemVersion.value.length
  isAlliOS.value =
    checkedCount > 0 && checkedCount < iOSSystemVersion.value.length
  findAll()
}

// Harmony版本筛选
const handleHarmony = (val) => {
  harmonySystem.value = val ? harmonySystemVersion.value : []
  isAllHarmony.value = false
  findAll()
}

const handleCheckedHarmony = (value) => {
  const checkedCount = value.length
  checkAllHarmony.value = checkedCount === harmonySystemVersion.value.length
  isAllHarmony.value =
    checkedCount > 0 && checkedCount < harmonySystemVersion.value.length
  findAll()
}

// 厂商筛选
const handleMan = (val) => {
  checkMan.value = val ? manufacturer.value : []
  isAllMan.value = false
  findAll()
}

const handleCheckedMan = (value) => {
  const checkedCount = value.length
  checkAllMan.value = checkedCount === manufacturer.value.length
  isAllMan.value = checkedCount > 0 && checkedCount < manufacturer.value.length
  findAll()
}

// CPU筛选
const handleCpu = (val) => {
  cpu.value = val ? cpus.value : []
  isAllCpu.value = false
  findAll()
}

const handleCheckedCpu = (value) => {
  const checkedCount = value.length
  checkAllCpu.value = checkedCount === cpus.value.length
  isAllCpu.value = checkedCount > 0 && checkedCount < cpus.value.length
  findAll()
}

// 分辨率筛选
const handleSize = (val) => {
  size.value = val ? sizes.value : []
  isAllSize.value = false
  findAll()
}

const handleCheckedSize = (value) => {
  const checkedCount = value.length
  checkAllSize.value = checkedCount === sizes.value.length
  isAllSize.value = checkedCount > 0 && checkedCount < sizes.value.length
  findAll()
}

// Agent筛选
const handleAgent = (val) => {
  agentIds.value = val
    ? agentList.value.map((item) => item.id)
    : []
  isAllAgent.value = false
  findAll()
}

const handleCheckedAgent = (value) => {
  const checkedCount = value.length
  checkAllAgent.value = checkedCount === agentList.value.length
  isAllAgent.value = checkedCount > 0 && checkedCount < agentList.value.length
  findAll()
}

// 状态筛选
const handleStatus = (val) => {
  status.value = val
    ? statusList.value.map((item) => item.value)
    : []
  isAllStatus.value = false
  findAll()
}

const handleCheckedStatus = (value) => {
  const checkedCount = value.length
  checkAllStatus.value = checkedCount === statusList.value.length
  isAllStatus.value =
    checkedCount > 0 && checkedCount < statusList.value.length
  findAll()
}

// 搜索输入
const handleInput = () => {
  findAll()
}

// 获取设备列表
const findAll = async (pageNum, pSize) => {
  try {
    const params = {
      page: pageNum || queryParams.page,
      pageSize: pSize || queryParams.pageSize,
      androidVersion:
        androidSystem.value.length === 0 ? undefined : androidSystem.value,
      iOSVersion: iOSSystem.value.length === 0 ? undefined : iOSSystem.value,
      hmVersion:
        harmonySystem.value.length === 0 ? undefined : harmonySystem.value,
      manufacturer:
        checkMan.value.length === 0 ||
        checkMan.value.length === manufacturer.value.length
          ? undefined
          : checkMan.value,
      cpu:
        cpu.value.length === 0 || cpu.value.length === cpus.value.length
          ? undefined
          : cpu.value,
      size:
        size.value.length === 0 || size.value.length === sizes.value.length
          ? undefined
          : size.value,
      agentId:
        agentIds.value.length === 0 ||
        agentIds.value.length === agentList.value.length
          ? undefined
          : agentIds.value,
      status:
        status.value.length === 0 ||
        status.value.length === statusList.value.length
          ? undefined
          : status.value,
      deviceInfo: name.value.length > 0 ? name.value : undefined
    }

    const resp = await listDevices(params)
    if (resp.code === 200) {
      pageData.value = {
        content: resp.rows || [],
        totalElements: resp.total || 0,
        number: resp.pageNum || 1,
        size: resp.pageSize || 12
      }
      total.value = resp.total || 0
    }
  } catch (error) {
    console.error('获取设备列表失败:', error)
    clearInterval(timer.value)
  }
}

// 分页处理
const handlePagination = ({ page, limit }) => {
  queryParams.page = page
  queryParams.pageSize = limit
  findAll(page, limit)
}

// 获取所有Agent
const loadAllAgents = async () => {
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

// 获取筛选选项
const loadFilterOption = async () => {
  try {
    const resp = await getFilterOption()
    if (resp.code === 200) {
      cpus.value = resp.data?.cpu || []
      sizes.value = resp.data?.size || []
    }
  } catch (error) {
    console.error('获取筛选选项失败:', error)
    clearInterval(timer.value)
  }
}

// 获取平均温度
const loadTemper = async () => {
  try {
    const resp = await findTemper()
    if (resp.code === 200 && resp.data !== null) {
      avgTem.value = resp.data
    }
  } catch (error) {
    console.error('获取平均温度失败:', error)
    clearInterval(timer.value)
  }
}

// 刷新数据
const refresh = () => {
  findAll()
  loadTemper()
  loadAllAgents()
  clearInterval(laterTimer.value)
}

// 自动刷新切换
const refreshNow = (t) => {
  if (t !== 'switch') {
    localStorage.setItem('SonicIsRefresh', t)
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
  isFlush.value = localStorage.getItem('SonicIsRefresh') || '0'
})

onMounted(() => {
  loadFilterOption()
  loadAllAgents()
  refresh()

  if (isFlush.value === '1') {
    laterTimer.value = setInterval(refresh, 1500)
    timer.value = setInterval(refresh, 15000)
  }
})

onUnmounted(() => {
  clearInterval(laterTimer.value)
  clearInterval(timer.value)
})
</script>

<style scoped>
.device-radio-p {
  margin-left: 10px;
}

.device-radio-p :deep(.el-checkbox) {
  margin-right: 15px;
  margin-bottom: 10px;
}

.filter-table-expand {
  font-size: 0;
}

.filter-table-expand :deep(.el-form-item__label) {
  width: 100px;
  color: #99a9bf;
  font-weight: bold;
}

.filter-table-expand :deep(.el-form-item) {
  margin-right: 0;
  margin-bottom: 15px;
  width: 100%;
}

.refresh {
  margin-bottom: 10px;
}
</style>
