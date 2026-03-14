<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
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
          v-hasPermi="['task_notification:notification:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['task_notification:notification:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['task_notification:notification:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['task_notification:notification:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="notificationList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="通知ID" align="center" prop="notificationId" />
      <el-table-column label="通知类型" align="center" prop="notificationType" />
      <el-table-column label="通知标题" align="center" prop="title" />
      <el-table-column label="通知内容" align="center" prop="message" />
      <el-table-column label="是否已读" align="center" prop="isRead" />
      <el-table-column label="阅读时间" align="center" prop="readTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.readTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['task_notification:notification:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['task_notification:notification:remove']">删除</el-button>
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

    <!-- 添加或修改通知消息对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="notificationRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item v-if="renderField(true, false)" label="接收用户ID" prop="userId">
        <el-input v-model="form.userId" placeholder="请输入接收用户ID" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="通知类型" prop="notificationType">
        <el-select v-model="form.notificationType" placeholder="请选择通知类型">
          <el-option label="请选择字典生成" value="" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="通知标题" prop="title">
        <el-input v-model="form.title" placeholder="请输入通知标题" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="通知内容" prop="message">
        <el-input v-model="form.message" type="textarea" placeholder="请输入内容" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="是否已读" prop="isRead">
        <el-input v-model="form.isRead" placeholder="请输入是否已读" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="阅读时间" prop="readTime">
        <el-date-picker clearable
          v-model="form.readTime"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择阅读时间">
        </el-date-picker>
      </el-form-item>
      <el-form-item v-if="renderField(true, false)" label="关联业务类型(workflow/test_case/report等)" prop="businessType">
        <el-select v-model="form.businessType" placeholder="请选择关联业务类型(workflow/test_case/report等)">
          <el-option label="请选择字典生成" value="" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="renderField(true, false)" label="关联业务ID" prop="businessId">
        <el-input v-model="form.businessId" placeholder="请输入关联业务ID" />
      </el-form-item>
      <el-form-item v-if="renderField(true, false)" label="备注" prop="remark">
        <el-input v-model="form.remark" placeholder="请输入备注" />
      </el-form-item>
      <el-form-item v-if="renderField(true, false)" label="描述" prop="description">
        <el-input v-model="form.description" placeholder="请输入描述" />
      </el-form-item>
      <el-form-item v-if="renderField(true, false)" label="排序值" prop="sortNo">
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

<script setup name="Notification">
import { listNotification, getNotification, delNotification, addNotification, updateNotification } from "@/api/task_notification/notification";

const { proxy } = getCurrentInstance();

const notificationList = ref([]);
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
    createTime: null,
  },
  rules: {
    userId: [
      { required: true, message: "接收用户ID不能为空", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询通知消息列表 */
function getList() {
  loading.value = true;
  listNotification(queryParams.value).then(response => {
    notificationList.value = response.rows;
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
    notificationId: null,
    userId: null,
    notificationType: null,
    title: null,
    message: null,
    isRead: null,
    readTime: null,
    businessType: null,
    businessId: null,
    extraData: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null,
    description: null,
    sortNo: null,
    delFlag: null,
  };
  proxy.resetForm("notificationRef");
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
  ids.value = selection.map(item => item.notificationId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加通知消息";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _notificationId = row.notificationId || ids.value;
  getNotification(_notificationId).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改通知消息";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["notificationRef"].validate(valid => {
    if (valid) {
      if (form.value.notificationId != null) {
        updateNotification(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addNotification(form.value).then(response => {
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
  const _notificationIds = row.notificationId || ids.value;
  proxy.$modal.confirm('是否确认删除通知消息编号为"' + _notificationIds + '"的数据项？').then(function() {
    return delNotification(_notificationIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}


/** 导出按钮操作 */
function handleExport() {
  proxy.download('task_notification/notification/export', {
    ...queryParams.value
  }, `notification_${new Date().getTime()}.xlsx`);
}

/** 是否渲染字段 */
function renderField(insert, edit) {
  return form.value.notificationId == null ? insert : edit;
}

getList();
</script>