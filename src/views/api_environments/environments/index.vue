<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="环境名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入环境名称"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>

      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择创建时间"
          clearable
          style="width: 240px"
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
          v-hasPermi="['api_environments:environments:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['api_environments:environments:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['api_environments:environments:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['api_environments:environments:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="environmentsList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="环境ID" align="center" prop="id" />
      <el-table-column label="环境名称" align="center" prop="name" />
      <el-table-column label="是否默认" align="center" prop="isDefault">
          <template #default="scope">
              <dict-tag v-if="scope.row.isDefault" :options="user_is_defalut" :value="scope.row.isDefault"/>
              <span v-else>-</span>  <!-- 非默认时显示短横线 -->
          </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="500">
        <template #default="scope">
          <el-button link type="success" icon="Link" @click="handleServices(scope.row)">服务地址</el-button>
          <el-button link type="warning" icon="Setting" @click="handleCacheData(scope.row)">环境变量</el-button>
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['api_environments:environments:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['api_environments:environments:remove']">删除</el-button>
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

    <!-- 添加或修改环境配置对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="environmentsRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item v-if="renderField(true, true)" label="环境名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入环境名称" />
      </el-form-item>

      <el-form-item v-if="renderField(true, true)" label="是否默认" prop="isDefault">
        <el-radio-group v-model="form.isDefault">
          <el-radio
            v-for="dict in user_is_defalut"
            :key="dict.value"
            :label="parseInt(dict.value)"
>
{{ dict.label }}          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="备注" prop="remark">
        <el-input v-model="form.remark" placeholder="请输入备注" />
      </el-form-item>

      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 服务地址管理弹窗 -->
    <ServicesDialog 
      v-model="servicesDialogVisible" 
      :environment-id="currentEnvironmentId"
      :environment-name="currentEnvironmentName"
      @refresh="handleServicesRefresh"
    />

    <!-- 缓存数据管理弹窗 -->
    <CacheDialog
      v-model:visible="cacheDialogVisible"
      :environment-id="currentCacheEnvironmentId"
      :title="'环境变量管理 - ' + currentEnvironmentName"
      @close="handleCacheDialogClose"
    />
  </div>
</template>

<script setup name="Environments">
import { listEnvironments, getEnvironments, delEnvironments, addEnvironments, updateEnvironments } from "@/api/api_environments/environments";
import ServicesDialog from "../components/ServicesDialog.vue";
import CacheDialog from "../components/CacheDialog.vue";

const { proxy } = getCurrentInstance();
const { user_is_defalut } = proxy.useDict('user_is_defalut');

const environmentsList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");

// 服务地址弹窗相关
const servicesDialogVisible = ref(false);
const currentEnvironmentId = ref(null);

// 缓存数据弹窗相关
const cacheDialogVisible = ref(false);
const currentCacheEnvironmentId = ref(null);
const currentEnvironmentName = ref('');

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    name: null,
    projectId: null,
    createTime: null,
  },
  rules: {
    name: [
      { required: true, message: "环境名称不能为空", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询环境配置列表 */
function getList() {
  loading.value = true;
  listEnvironments(queryParams.value).then(response => {
    environmentsList.value = response.rows;
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
    name: null,
    projectId: null,
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
  proxy.resetForm("environmentsRef");
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
  ids.value = selection.map(item => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加环境配置";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value;
  getEnvironments(_id).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改环境配置";
  });
}

/** 服务地址管理按钮操作 */
function handleServices(row) {
  currentEnvironmentId.value = row.id;
  currentEnvironmentName.value = row.name; // 新增：传递环境名称
  servicesDialogVisible.value = true;
}

/** 缓存数据管理按钮操作 */
function handleCacheData(row) {
  currentCacheEnvironmentId.value = row.id;
  currentEnvironmentName.value = row.name || `环境${row.id}`;
  cacheDialogVisible.value = true;
}

/** 处理服务地址数据刷新 */
function handleServicesRefresh() {
  // 这里可以处理服务地址数据更新后的逻辑
  // 比如刷新当前环境列表或者显示提示信息
  console.log('服务地址数据已更新');
}

/** 处理缓存数据弹窗关闭 */
function handleCacheDialogClose() {
  console.log('缓存数据弹窗已关闭');
  // 这里可以处理弹窗关闭后的逻辑
  // 比如刷新当前页面数据或显示提示信息
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["environmentsRef"].validate(valid => {
    if (valid) {
      if (form.value.id != null) {
        updateEnvironments(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addEnvironments(form.value).then(response => {
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
  proxy.$modal.confirm('是否确认删除环境配置编号为"' + _ids + '"的数据项？').then(function() {
    return delEnvironments(_ids);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('api_environments/environments/export', {
    ...queryParams.value
  }, `environments_${new Date().getTime()}.xlsx`);
}

/** 是否渲染字段 */
function renderField(insert, edit) {
  return form.value.id == null ? insert : edit;
}

getList();
</script>