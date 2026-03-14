<template>
  <el-dialog 
    :title="dialogTitle" 
    v-model="dialogVisible" 
    width="90%" 
    append-to-body
    @close="handleClose"
  >
    <div class="app-container">
      <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
        <el-form-item label="缓存键名" prop="cacheKey">
          <el-input
            v-model="queryParams.cacheKey"
            placeholder="请输入缓存键名"
            clearable
            style="width: 240px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
          <el-button
            type="primary"
            plain
            icon="Plus"
            @click="handleAdd"
            v-hasPermi="['api_cache_data:cache_data:add']"
          >新增</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            type="success"
            plain
            icon="Edit"
            :disabled="single"
            @click="handleUpdate"
            v-hasPermi="['api_cache_data:cache_data:edit']"
          >修改</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            type="danger"
            plain
            icon="Delete"
            :disabled="multiple"
            @click="handleDelete"
            v-hasPermi="['api_cache_data:cache_data:remove']"
          >删除</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            type="warning"
            plain
            icon="Download"
            @click="handleExport"
            v-hasPermi="['api_cache_data:cache_data:export']"
          >导出</el-button>
        </el-col>
        <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
      </el-row>

      <el-table v-loading="loading" :data="cache_dataList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="缓存数据ID" align="center" prop="id" />
        <el-table-column label="缓存键名" align="center" prop="cacheKey" />
        <el-table-column label="缓存值" align="center" prop="cacheValue" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['api_cache_data:cache_data:edit']">修改</el-button>
            <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['api_cache_data:cache_data:remove']">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="total>0"
        :total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />

      <!-- 添加或修改环境缓存对话框 -->
      <el-dialog :title="title" v-model="open" width="500px" append-to-body>
        <el-form ref="cache_dataRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item v-if="renderField(true, true)" label="缓存键名" prop="cacheKey">
          <el-input v-model="form.cacheKey" placeholder="请输入缓存键名" />
        </el-form-item>
        <el-form-item v-if="renderField(true, true)" label="缓存值" prop="cacheValue">
          <el-input v-model="form.cacheValue" type="textarea" placeholder="请输入内容" />
        </el-form-item>


        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button type="primary" @click="submitForm">确 定</el-button>
            <el-button @click="cancel">取 消</el-button>
          </div>
        </template>
      </el-dialog>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关 闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup name="CacheDataDialog">
import { listCache_data, getCache_data, delCache_data, addCache_data, updateCache_data } from "@/api/api_cache_data/cache_data";

// 定义组件属性
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  environmentId: {
    type: [String, Number],
    required: true
  },
  title: {
    type: String,
    default: '缓存数据管理'
  }
});

// 定义组件事件
const emit = defineEmits(['update:visible', 'close']);

const { proxy } = getCurrentInstance();

// 响应式数据
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
});

const dialogTitle = computed(() => props.title);

const cache_dataList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    cacheKey: null,
    environmentId: null,
    cacheValue: null,
    userId: null,
  },
  rules: {
    cacheKey: [
      { required: true, message: "缓存键名不能为空", trigger: "blur" }
    ],
    cacheValue: [
      { required: true, message: "缓存值不能为空", trigger: "blur" }
    ]
  }
});
const { queryParams, form, rules } = toRefs(data);

// 监听environmentId变化，自动设置到查询参数中
watch(() => props.environmentId, (newVal) => {
  if (newVal) {
    queryParams.value.environmentId = newVal;
    if (dialogVisible.value) {
      getList();
    }
  }
}, { immediate: true });

// 监听弹窗显示状态，显示时加载数据
watch(dialogVisible, (newVal) => {
  if (newVal && props.environmentId) {
    queryParams.value.environmentId = props.environmentId;
    getList();
  }
});

/** 查询环境缓存列表 */
function getList() {
  loading.value = true;
  listCache_data(queryParams.value).then(response => {
    cache_dataList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

/** 取消按钮 */
function cancel() {
  open.value = false;
  reset();
}

/** 表单重置 */
function reset() {
  form.value = {
    id: null,
    cacheKey: null,
    environmentId: props.environmentId, // 使用传入的环境ID
    cacheValue: null,
    sourceType: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null,
    description: null,
    sortNo: null,
    delFlag: null,
    userId: null,
  };
  proxy.resetForm("cache_dataRef");
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

/** 多选框选中数据  */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加环境缓存";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value;
  getCache_data(_id).then(response => {
    form.value = response.data;
    form.value.environmentId = props.environmentId; // 确保环境ID正确
    open.value = true;
    title.value = "修改环境缓存";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["cache_dataRef"].validate(valid => {
    if (valid) {
      // 确保表单数据包含环境ID
      form.value.environmentId = props.environmentId;
      
      if (form.value.id != null) {
        updateCache_data(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addCache_data(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功");
          open.value = false;
          getList();
        });
      }
    }
  });
}

/** 删除按钮操作 */
function handleDelete(row) {
  const _ids = row.id || ids.value;
  proxy.$modal.confirm('是否确认删除环境缓存编号为"' + _ids + '"的数据项？').then(function() {
    return delCache_data(_ids);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('api_cache_data/cache_data/export', {
    ...queryParams.value
  }, `cache_data_${new Date().getTime()}.xlsx`);
}

/** 是否渲染字段 */
function renderField(insert, edit) {
  return form.value.id == null ? insert : edit;
}

/** 关闭弹窗 */
function handleClose() {
  emit('close');
  emit('update:visible', false);
}
</script>

<style scoped>
.app-container {
  padding: 0;
}
</style>