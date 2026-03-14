<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="文件名称" prop="storedName">
        <el-input
          v-model="queryParams.storedName"
          placeholder="请输入文件存储名称"
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
          icon="Upload"
          @click="showUploadDialog"
          v-hasPermi="['system:file:add']"
        >上传附件</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['system:file:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['system:file:remove']"
        >删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="fileList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="文件ID" align="center" prop="fileId" width="80" />
      <el-table-column label="原始名称" align="center" prop="originalName" show-overflow-tooltip />
      <el-table-column label="存储名称" align="center" prop="storedName" show-overflow-tooltip />
      <el-table-column label="文件类型" align="center" prop="mimeType" width="150">
        <template #default="scope">
          <el-tag size="small">{{ scope.row.mimeType || '未知' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="文件大小" align="center" prop="fileSize" width="100">
        <template #default="scope">
          {{ formatFileSize(scope.row.fileSize) }}
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180" />
      <el-table-column label="访问URL" align="center" prop="fileUrl" show-overflow-tooltip>
        <template #default="scope">
          <el-link @click="downloadFile(scope.row)" type="primary" style="cursor: pointer;">
            {{ scope.row.fileUrl }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="160">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['system:file:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['system:file:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 修改附件信息对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="fileRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="原始名称" prop="originalName">
          <el-input v-model="form.originalName" placeholder="请输入原始文件名称" />
        </el-form-item>
        <!-- <el-form-item label="存储名称" prop="storedName">
          <el-input v-model="form.storedName" placeholder="请输入文件存储名称" />
        </el-form-item> -->
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 文件上传组件 -->
    <FileUploadDialog
      v-model="uploadDialogVisible"
      title="上传附件"
      :multiple="true"
      :max-size="50"
      :max-count="20"
      accept="*/*"
      :upload-api="uploadFiles"
      @upload-success="handleUploadSuccess"
      @upload-error="handleUploadError"
    />
  </div>
</template>

<script setup name="File">
import { listFile, getFile, delFile, updateFile, uploadFiles } from "@/api/system/file";
import FileUploadDialog from "@/components/FileUpload/FileUploadDialog.vue";
import { getToken } from "@/utils/auth";
import axios from 'axios';

const { proxy } = getCurrentInstance();

const fileList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");
const uploadDialogVisible = ref(false);

// 获取环境变量中的项目前缀
const baseApi = import.meta.env.VITE_APP_BASE_API || '';

// 获取完整文件URL的函数
const getFullFileUrl = (fileUrl) => {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) return fileUrl;
  
  const baseUrl = window.location.origin;
  const prefix = baseApi && baseApi !== '/' ? baseApi : '';
  const url = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
  const apiprefix = "/system/file";
  return baseUrl + prefix + apiprefix + url;
}

// 下载文件（带token验证）
const downloadFile = async (row) => {
  try {
    const loading = proxy.$loading({
      text: '正在下载文件...',
      background: 'rgba(0, 0, 0, 0.7)'
    });

    const fullUrl = getFullFileUrl(row.fileUrl);
    const token = getToken();
    
    const response = await axios({
      method: 'GET',
      url: fullUrl,
      headers: {
        'Authorization': `Bearer ${token}`
      },
      responseType: 'blob'
    });

    // 创建下载链接
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = row.originalName || row.storedName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    
    loading.close();
    proxy.$modal.msgSuccess('文件下载成功');
  } catch (error) {
    console.error('文件下载失败:', error);
    proxy.$modal.msgError('文件下载失败: ' + (error.message || '网络错误'));
  }
}

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    storedName: null,
  },
  rules: {
    originalName: [
      { required: true, message: "原始文件名称不能为空", trigger: "blur" }
    ],
    // storedName: [
    //   { required: true, message: "文件存储名称不能为空", trigger: "blur" }
    // ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询附件管理列表 */
function getList() {
  loading.value = true;
  listFile(queryParams.value).then(response => {
    fileList.value = response.rows;
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
    fileId: null,
    originalName: null,
    storedName: null,
    fileExt: null,
    mimeType: null,
    fileSize: null,
    filePath: null,
    fileUrl: null,
    storageType: null,
    isTemp: null,
    fileHash: null,
    bizTag: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null,
    description: null,
    sortNo: null,
    delFlag: null,
  };
  proxy.resetForm("fileRef");
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

/** 多选框选中数据 */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.fileId);
  single.value = selection.length !== 1;
  multiple.value = !selection.length;
}

/** 显示上传对话框 */
function showUploadDialog() {
  uploadDialogVisible.value = true;
}

/** 处理上传成功 */
function handleUploadSuccess(successFiles) {
  console.log('上传成功的文件:', successFiles);
  // 刷新列表
  getList();
  // 关闭上传弹窗
  uploadDialogVisible.value = false;
}

/** 处理上传错误 */
function handleUploadError(errorFiles) {
  console.error('上传失败的文件:', errorFiles);
  errorFiles.forEach(({ fileItem, error }) => {
    proxy.$modal.msgError(`文件 ${fileItem.name} 上传失败: ${error.message || '未知错误'}`);
  });
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _fileId = row.fileId || ids.value;
  getFile(_fileId).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改附件信息";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["fileRef"].validate(valid => {
    if (valid) {
      updateFile(form.value).then(response => {
        proxy.$modal.msgSuccess("修改成功");
        open.value = false;
        getList();
      });
    }
  });
}

/** 删除按钮操作 */
function handleDelete(row) {
  const _fileIds = row.fileId || ids.value;
  proxy.$modal.confirm('是否确认删除附件编号为"' + _fileIds + '"的数据项？').then(function() {
    return delFile(_fileIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 格式化文件大小 */
function formatFileSize(size) {
  if (!size) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index++;
  }
  return Math.round(size * 100) / 100 + ' ' + units[index];
}

getList();
</script>