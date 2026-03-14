<template>
  <el-dialog :title="`环境服务地址管理 - ${props.environmentName}`" v-model="visible" width="1200px" append-to-body @close="handleClose">
    <div class="services-dialog-container">
      <!-- 搜索表单 -->
      <el-form :model="queryParams" ref="queryRef" :inline="true" label-width="68px" class="mb-4">
        <el-form-item label="服务名称" prop="name">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入服务名称"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="服务地址" prop="url">
          <el-input
            v-model="queryParams.url"
            placeholder="请输入服务地址"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="是否默认" prop="isDefault">
          <el-select v-model="queryParams.isDefault" placeholder="请选择" clearable style="width: 150px">
            <el-option
              v-for="dict in user_is_defalut"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 操作按钮 -->
      <el-row :gutter="10" class="mb-4">
        <el-col :span="1.5">
          <el-button
            type="primary"
            plain
            icon="Plus"
            @click="handleAdd"
          >新增</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            type="success"
            plain
            icon="Edit"
            :disabled="single"
            @click="handleUpdate"
          >修改</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            type="danger"
            plain
            icon="Delete"
            :disabled="multiple"
            @click="handleDelete"
          >删除</el-button>
        </el-col>
      </el-row>

      <!-- 数据表格 -->
      <el-table v-loading="loading" :data="servicesList" @selection-change="handleSelectionChange" height="400">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="服务ID" align="center" prop="id" width="80" />
        <el-table-column label="服务名称" align="center" prop="name" />
        <el-table-column label="服务地址" align="center" prop="url" />
        <el-table-column label="是否为默认服务" align="center" prop="isDefault" width="120">
            <template #default="scope">
                <el-tag v-if="scope.row.isDefault" type="success" effect="dark">
                    <el-icon><Star /></el-icon> 默认
                </el-tag>
                <span v-else></span>  <!-- 或者完全省略这行 -->
            </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="150">
          <template #default="scope">
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">修改</el-button>
            <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <pagination
        v-show="total>0"
        :total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
        class="mt-4"
      />
    </div>

    <!-- 添加或修改服务地址对话框 -->
    <el-dialog :title="formTitle" v-model="formOpen" width="500px" append-to-body>
      <el-form ref="servicesRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="服务名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入服务名称" />
        </el-form-item>
        <el-form-item label="服务地址" prop="url">
          <el-input v-model="form.url" placeholder="请输入服务地址" />
        </el-form-item>
        <el-form-item label="是否为默认服务" prop="isDefault">
          <el-select v-model="form.isDefault" placeholder="请选择是否为默认服务">
            <el-option
              v-for="dict in user_is_defalut"
              :key="dict.value"
              :label="dict.label"
              :value="parseInt(dict.value)"
            ></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancelForm">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关 闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup name="ServicesDialog">
import { listServices, getServices, delServices, addServices, updateServices } from "@/api/api_services/services";
import { Star } from '@element-plus/icons-vue'
const { proxy } = getCurrentInstance();
const { user_is_defalut } = proxy.useDict('user_is_defalut');

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  environmentId: {
    type: [String, Number],
    required: true
  },
  environmentName: {
    type: String,
    default: ''
  }
});

// Emits
const emit = defineEmits(['update:modelValue', 'refresh']);

// 响应式数据
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const servicesList = ref([]);
const formOpen = ref(false);
const loading = ref(false);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const formTitle = ref("");

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    name: null,
    url: null,
    environmentId: null,
    isDefault: null,
  },
  rules: {
    name: [
      { required: true, message: "服务名称不能为空", trigger: "blur" }
    ],
    url: [
      { required: true, message: "服务地址不能为空", trigger: "blur" }
    ],
    isDefault: [
      { required: true, message: "是否为默认服务不能为空", trigger: "change" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

// 监听弹窗打开
watch(visible, (newVal) => {
  if (newVal) {
    // 设置环境ID
    queryParams.value.environmentId = props.environmentId;
    getList();
  }
});

/** 查询环境服务地址列表 */
function getList() {
  loading.value = true;
  // 确保查询参数包含环境ID
  const params = {
    ...queryParams.value,
    environmentId: props.environmentId
  };
  
  listServices(params).then(response => {
    servicesList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  }).catch(() => {
    loading.value = false;
  });
}

/** 表单重置 */
function reset() {
  form.value = {
    id: null,
    name: null,
    url: null,
    environmentId: props.environmentId, // 设置环境ID
    isDefault: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null,
    description: null,
    sortNo: null,
    delFlag: null,
  };
  proxy.resetForm("servicesRef");
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef");
  queryParams.value.environmentId = props.environmentId; // 保持环境ID
  handleQuery();
}

/** 多选框选中数据 */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  formOpen.value = true;
  formTitle.value = "添加环境服务地址";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value;
  getServices(_id).then(response => {
    form.value = response.data;
    formOpen.value = true;
    formTitle.value = "修改环境服务地址";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["servicesRef"].validate(valid => {
    if (valid) {
      // 确保表单数据包含环境ID
      const formData = {
        ...form.value,
        environmentId: props.environmentId
      };
      
      if (form.value.id != null) {
        updateServices(formData).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          formOpen.value = false;
          getList();
          emit('refresh'); // 通知父组件刷新
        });
      } else {
        addServices(formData).then(response => {
          proxy.$modal.msgSuccess("新增成功");
          formOpen.value = false;
          getList();
          emit('refresh'); // 通知父组件刷新
        });
      }
    }
  });
}

/** 取消表单 */
function cancelForm() {
  formOpen.value = false;
  reset();
}

/** 删除按钮操作 */
function handleDelete(row) {
  const _ids = row.id || ids.value;
  proxy.$modal.confirm('是否确认删除环境服务地址编号为"' + _ids + '"的数据项？').then(function() {
    return delServices(_ids);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
    emit('refresh'); // 通知父组件刷新
  }).catch(() => {});
}

/** 关闭弹窗 */
function handleClose() {
  visible.value = false;
  // 重置数据
  servicesList.value = [];
  total.value = 0;
  ids.value = [];
  single.value = true;
  multiple.value = true;
}
</script>

<style scoped>
.services-dialog-container {
  padding: 0;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-4 {
  margin-top: 16px;
}
</style>