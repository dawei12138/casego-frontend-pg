<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="键" prop="key">
        <el-input
          v-model="queryParams.key"
          placeholder="请输入键"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="值" prop="value">
        <el-input
          v-model="queryParams.value"
          placeholder="请输入值"
          clearable
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
          v-hasPermi="['api_formdata:formdata:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['api_formdata:formdata:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['api_formdata:formdata:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['api_formdata:formdata:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="formdataList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="ID" align="center" prop="formdataId" />
      <el-table-column label="关联的测试用例ID" align="center" prop="caseId" />
      <el-table-column label="键" align="center" prop="key" />
      <el-table-column v-if="formMode === 'multipart'" label="数据类型" align="center" prop="dataType" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.dataType === 'file' ? 'warning' : 'primary'">
              {{ scope.row.dataType === 'file' ? '文件' : '文本' }}
            </el-tag>
          </template>
        </el-table-column>
      <el-table-column label="值" align="center" prop="value">
          <template #default="scope">
            <div v-if="scope.row.dataType === 'file' && formMode === 'multipart'" class="file-value-container">
              <div v-if="scope.row.files && scope.row.files.length > 0" class="file-list">
                <el-tag 
                  v-for="file in scope.row.files" 
                  :key="file.id" 
                  closable 
                  @close="removeFile(scope.$index, file.id)"
                  class="file-tag"
                >
                  {{ file.filename }}
                </el-tag>
              </div>
              <div v-else class="no-files">未选择文件</div>
              <el-button 
                type="primary" 
                size="small" 
                @click="openFileSelector(scope.$index)"
                class="select-file-btn"
              >
                选择文件
              </el-button>
            </div>
            <div v-else>
              {{ scope.row.value }}
            </div>
          </template>
        </el-table-column>
      <el-table-column label="是否启用该表单值" align="center" prop="isRun" />
      <el-table-column label="描述" align="center" prop="description" />
      <el-table-column label="排序值" align="center" prop="sortNo" />
      <el-table-column label="删除标志 0正常 1删除 2代表删除" align="center" prop="delFlag" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['api_formdata:formdata:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['api_formdata:formdata:remove']">删除</el-button>
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

    <!-- 添加或修改接口单body对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="formdataRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item v-if="renderField(true, false)" label="关联的测试用例ID" prop="caseId">
        <el-input v-model="form.caseId" placeholder="请输入关联的测试用例ID" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="键" prop="key">
        <el-input v-model="form.key" placeholder="请输入键" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true) && formMode === 'multipart'" label="数据类型" prop="dataType">
        <el-select v-model="form.dataType" placeholder="请选择数据类型" @change="handleDataTypeChange">
          <el-option label="文本" value="text" />
          <el-option label="文件" value="file" />
        </el-select>
      </el-form-item>
      <!-- urlencoded模式下只显示文本类型 -->
      <el-form-item v-if="renderField(true, true) && formMode === 'urlencoded'" label="数据类型">
        <el-tag type="primary">文本</el-tag>
      </el-form-item>
      <el-form-item v-if="(form.dataType === 'text' || formMode === 'urlencoded') && renderField(true, true)" label="值" prop="value">
        <el-input v-model="form.value" placeholder="请输入值" />
      </el-form-item>
      <el-form-item v-if="form.dataType === 'file' && formMode === 'multipart' && renderField(true, true)" label="文件" prop="files">
        <div class="file-form-container">
          <div v-if="form.files && form.files.length > 0" class="selected-files">
            <el-tag 
              v-for="file in form.files" 
              :key="file.id" 
              closable 
              @close="removeFormFile(file.id)"
              class="file-tag"
            >
              {{ file.filename }}
            </el-tag>
          </div>
          <el-button type="primary" @click="openFormFileSelector">选择文件</el-button>
        </div>
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="是否启用该表单值" prop="isRun">
        <el-input v-model="form.isRun" placeholder="请输入是否启用该表单值" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="描述" prop="description">
        <el-input v-model="form.description" placeholder="请输入描述" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="排序值" prop="sortNo">
        <el-input v-model="form.sortNo" placeholder="请输入排序值" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="删除标志 0正常 1删除 2代表删除" prop="delFlag">
        <el-input v-model="form.delFlag" placeholder="请输入删除标志 0正常 1删除 2代表删除" />
      </el-form-item>

      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 文件管理弹窗 -->
    <FileManagerDialog
      v-model="fileManagerVisible"
      :multiple="true"
      @save="handleFileSelect"
    />
  </div>
</template>

<script setup name="Formdata">
import { listFormdata, getFormdata, delFormdata, addFormdata, updateFormdata } from "@/api/api_formdata/formdata";
import FileManagerDialog from "@/components/FileUpload/FileManagerDialog.vue";

const { proxy } = getCurrentInstance();

const formdataList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");

// 文件管理相关
const fileManagerVisible = ref(false);
const currentEditIndex = ref(-1);
const isFormFileSelector = ref(false);

// 表单模式控制
const formMode = ref('multipart'); // 'multipart' 或 'urlencoded'
const props = defineProps({
  mode: {
    type: String,
    default: 'multipart', // multipart/form-data 或 x-www-form-urlencoded
    validator: (value) => ['multipart', 'urlencoded'].includes(value)
  }
});

// 监听模式变化
watch(() => props.mode, (newMode) => {
  formMode.value = newMode;
  // 如果切换到urlencoded模式，隐藏所有文件类型的行
  if (newMode === 'urlencoded') {
    // 过滤掉文件类型的数据
    formdataList.value = formdataList.value.filter(item => item.dataType !== 'file');
  }
}, { immediate: true });

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    caseId: null,
    key: null,
    value: null,
  },
  rules: {
    caseId: [
      { required: true, message: "关联的测试用例ID不能为空", trigger: "blur" }
    ],
    key: [
      { required: true, message: "键不能为空", trigger: "blur" }
    ],
    dataType: [
      { required: true, message: "数据类型不能为空", trigger: "change" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询表单数据列表 */
function getList() {
  loading.value = true;
  listFormdata(queryParams.value).then(response => {
    // 处理返回的数据，恢复文件信息
    formdataList.value = response.rows.map(item => {
      const processedItem = { ...item };
      
      // 如果有formFileConfig，说明是文件类型
      if (item.formFileConfig && item.formFileConfig.length > 0) {
        processedItem.dataType = 'file';
        processedItem.files = item.formFileConfig.map(fileConfig => ({
          id: fileConfig.fileId,
          filename: fileConfig.filename,
          url: fileConfig.filePath,
          path: fileConfig.filePath
        }));
      } else {
        processedItem.dataType = 'text';
        processedItem.files = [];
      }
      
      return processedItem;
    });
    
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
    formdataId: null,
    caseId: null,
    key: null,
    value: null,
    dataType: formMode.value === 'urlencoded' ? 'text' : 'text', // 默认为文本类型
    files: [],
    isRun: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null,
    description: null,
    sortNo: null,
    delFlag: null,
  };
  proxy.resetForm("formdataRef");
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef");
  handleQuery();
}

/** 多选框选中数据  */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.formdataId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加接口单body";
}

/** 修改按钮 */
function handleUpdate(row) {
  reset();
  const formdataId = row.formdataId || ids.value
  getFormdata(formdataId).then(response => {
    form.value = response.data;
    
    // 恢复文件信息
    if (response.data.formFileConfig && response.data.formFileConfig.length > 0) {
      form.value.dataType = 'file';
      form.value.files = response.data.formFileConfig.map(fileConfig => ({
        id: fileConfig.fileId,
        filename: fileConfig.filename,
        url: fileConfig.filePath,
        path: fileConfig.filePath
      }));
    } else {
      form.value.dataType = 'text';
      form.value.files = [];
    }
    
    open.value = true;
    title.value = "修改表单数据";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["formdataRef"].validate(valid => {
    if (valid) {
      // 准备提交数据
      const submitData = { ...form.value };
      
      // 处理文件配置
      if (form.value.dataType === 'file' && form.value.files && form.value.files.length > 0) {
        submitData.formFileConfig = form.value.files.map(file => ({
          fileId: file.id,
          filename: file.filename,
          filePath: file.url || file.path
        }));
        // 清空value字段，文件信息存储在formFileConfig中
        submitData.value = null;
      } else {
        submitData.formFileConfig = [];
      }
      
      if (form.value.formdataId != null) {
        updateFormdata(submitData).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addFormdata(submitData).then(response => {
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
  const _formdataIds = row.formdataId || ids.value;
  proxy.$modal.confirm('是否确认删除接口单body编号为"' + _formdataIds + '"的数据项？').then(function() {
    return delFormdata(_formdataIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}


/** 导出按钮操作 */
function handleExport() {
  proxy.download('api_formdata/formdata/export', {
    ...queryParams.value
  }, `formdata_${new Date().getTime()}.xlsx`);
}

/** 是否渲染字段 */
function renderField(insert, edit) {
  return form.value.formdataId == null ? insert : edit;
}

/** 数据类型变化处理 */
function handleDataTypeChange(value) {
  if (value === 'file' && formMode.value === 'multipart') {
    form.value.value = null;
    form.value.files = form.value.files || [];
  } else {
    form.value.files = [];
    if (value === 'text') {
      form.value.value = form.value.value || '';
    }
  }
}

/** 打开文件选择器 - 表格行 */
function openFileSelector(index) {
  currentEditIndex.value = index;
  isFormFileSelector.value = false;
  fileManagerVisible.value = true;
}

/** 打开文件选择器 - 表单 */
function openFormFileSelector() {
  isFormFileSelector.value = true;
  fileManagerVisible.value = true;
}

/** 文件选择确认 */
function handleFileSelect(selectedFiles) {
  if (isFormFileSelector.value) {
    // 表单文件选择
    form.value.files = selectedFiles;
  } else {
    // 表格行文件选择
    if (currentEditIndex.value >= 0) {
      formdataList.value[currentEditIndex.value].files = selectedFiles;
    }
  }
  fileManagerVisible.value = false;
}

/** 移除文件 - 表格行 */
function removeFile(rowIndex, fileId) {
  const files = formdataList.value[rowIndex].files;
  const index = files.findIndex(f => f.id === fileId);
  if (index > -1) {
    files.splice(index, 1);
  }
}

/** 移除文件 - 表单 */
function removeFormFile(fileId) {
  const index = form.value.files.findIndex(f => f.id === fileId);
  if (index > -1) {
    form.value.files.splice(index, 1);
  }
}

/** 获取数据方法 - 供其他组件调用 */
function getdata() {
  const result = {
    formData: [],
    fileConfig: [],
    mode: formMode.value
  };
  
  formdataList.value.forEach(item => {
    if (item.dataType === 'file' && item.files && item.files.length > 0 && formMode.value === 'multipart') {
      // 文件类型数据（仅在multipart模式下）
      result.formData.push({
        key: item.key,
        value: item.files.map(f => f.filename).join(', '), // 显示文件名
        dataType: 'file'
      });
      
      // 文件配置信息
      item.files.forEach(file => {
        result.fileConfig.push({
          key: item.key,
          fileId: file.id,
          filename: file.filename,
          filePath: file.url || file.path
        });
      });
    } else {
      // 文本类型数据
      result.formData.push({
        key: item.key,
        value: item.value,
        dataType: 'text'
      });
    }
  });
  
  return result;
}

// 暴露getdata方法给父组件
defineExpose({
  getdata
});

getList();
</script>

<style scoped>
.file-value-container {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.file-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-right: 8px;
}

.file-tag {
  margin: 2px;
}

.no-files {
  color: #909399;
  font-size: 12px;
}

.select-file-btn {
  flex-shrink: 0;
}

.file-form-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selected-files {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>