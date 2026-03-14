<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
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
          v-hasPermi="['provider:provider_config:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['provider:provider_config:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['provider:provider_config:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['provider:provider_config:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="provider_configList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="提供商配置ID" align="center" prop="providerId" />
      <el-table-column label="提供商标识(如openai/anthropic/google等)" align="center" prop="providerKey" />
      <el-table-column label="提供商显示名称(如OpenAI/Anthropic/Google等)" align="center" prop="providerName" />
      <el-table-column label="API密钥(建议加密存储)" align="center" prop="apiKey" />
      <el-table-column label="API密钥对(部分提供商需要)" align="center" prop="apiSecret" />
      <el-table-column label="API基础URL(自定义或代理时使用)" align="center" prop="baseUrl" />
      <el-table-column label="API版本(Azure等需要)" align="center" prop="apiVersion" />
      <el-table-column label="请求超时时间(秒)" align="center" prop="timeout" />
      <el-table-column label="最大重试次数" align="center" prop="maxRetries" />
      <el-table-column label="额外请求头(JSON格式)" align="center" prop="extraHeaders" />
      <el-table-column label="提供商图标URL" align="center" prop="iconUrl" />
      <el-table-column label="状态" align="center" prop="status" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['provider:provider_config:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['provider:provider_config:remove']">删除</el-button>
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

    <!-- 添加或修改LLM提供商配置对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="provider_configRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item v-if="renderField(true, true)" label="提供商标识(如openai/anthropic/google等)" prop="providerKey">
        <el-input v-model="form.providerKey" placeholder="请输入提供商标识(如openai/anthropic/google等)" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="提供商显示名称(如OpenAI/Anthropic/Google等)" prop="providerName">
        <el-input v-model="form.providerName" placeholder="请输入提供商显示名称(如OpenAI/Anthropic/Google等)" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="API密钥(建议加密存储)" prop="apiKey">
        <el-input v-model="form.apiKey" placeholder="请输入API密钥(建议加密存储)" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="API密钥对(部分提供商需要)" prop="apiSecret">
        <el-input v-model="form.apiSecret" placeholder="请输入API密钥对(部分提供商需要)" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="API基础URL(自定义或代理时使用)" prop="baseUrl">
        <el-input v-model="form.baseUrl" placeholder="请输入API基础URL(自定义或代理时使用)" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="API版本(Azure等需要)" prop="apiVersion">
        <el-input v-model="form.apiVersion" placeholder="请输入API版本(Azure等需要)" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="请求超时时间(秒)" prop="timeout">
        <el-input v-model="form.timeout" placeholder="请输入请求超时时间(秒)" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="最大重试次数" prop="maxRetries">
        <el-input v-model="form.maxRetries" placeholder="请输入最大重试次数" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="提供商图标URL" prop="iconUrl">
        <el-input v-model="form.iconUrl" placeholder="请输入提供商图标URL" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio label="请选择字典生成" value="" />
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="备注" prop="remark">
        <el-input v-model="form.remark" placeholder="请输入备注" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="描述" prop="description">
        <el-input v-model="form.description" placeholder="请输入描述" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="排序值" prop="sortNo">
        <el-input v-model="form.sortNo" placeholder="请输入排序值" />
      </el-form-item>
      <el-form-item v-if="renderField(true, false)" label="删除标志 0正常 1删除 2代表删除" prop="delFlag">
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
  </div>
</template>

<script setup name="Provider_config">
import { listProvider_config, getProvider_config, delProvider_config, addProvider_config, updateProvider_config } from "@/api/provider/provider_config";

const { proxy } = getCurrentInstance();

const provider_configList = ref([]);
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
  },
  rules: {
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询LLM提供商配置列表 */
function getList() {
  loading.value = true;
  listProvider_config(queryParams.value).then(response => {
    provider_configList.value = response.rows;
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
    providerId: null,
    providerKey: null,
    providerName: null,
    apiKey: null,
    apiSecret: null,
    baseUrl: null,
    apiVersion: null,
    timeout: null,
    maxRetries: null,
    extraHeaders: null,
    iconUrl: null,
    status: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null,
    description: null,
    sortNo: null,
    delFlag: null,
  };
  proxy.resetForm("provider_configRef");
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
  ids.value = selection.map(item => item.providerId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加LLM提供商配置";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _providerId = row.providerId || ids.value;
  getProvider_config(_providerId).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改LLM提供商配置";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["provider_configRef"].validate(valid => {
    if (valid) {
      if (form.value.providerId != null) {
        updateProvider_config(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addProvider_config(form.value).then(response => {
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
  const _providerIds = row.providerId || ids.value;
  proxy.$modal.confirm('是否确认删除LLM提供商配置编号为"' + _providerIds + '"的数据项？').then(function() {
    return delProvider_config(_providerIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}


/** 导出按钮操作 */
function handleExport() {
  proxy.download('provider/provider_config/export', {
    ...queryParams.value
  }, `provider_config_${new Date().getTime()}.xlsx`);
}

/** 是否渲染字段 */
function renderField(insert, edit) {
  return form.value.providerId == null ? insert : edit;
}

getList();
</script>