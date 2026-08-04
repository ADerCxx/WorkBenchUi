import { RegexRulesDeleteApi } from '@/apis/regexRules/delete';
import { RegexRulesInsertApi } from '@/apis/regexRules/insert';
import { RegexRulesQueryApi } from '@/apis/regexRules/query';
import {
  RegexRuleEnableStatus,
  type RegexRule,
  type RegexRulesQueryForm,
} from '@/apis/regexRules/types';
import { RegexRulesUpdateApi } from '@/apis/regexRules/update';
import { useAntdTable, useRequest } from 'ahooks';
import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';

/**
 * 校验文件正则字面量是否可编译
 */
function validateFilePattern(_: unknown, value: string) {
  if (!value) {
    return Promise.reject(new Error('请输入文件正则'));
  }
  try {
    new RegExp(value);
    return Promise.resolve();
  } catch {
    return Promise.reject(new Error('正则语法无效'));
  }
}

/**
 * 目录名：非空 trim
 */
function validateFolderName(_: unknown, value: string) {
  if (!value?.trim()) {
    return Promise.reject(new Error('请输入目录名'));
  }
  return Promise.resolve();
}

/**
 * 正则表达式设置：扫描文件夹白名单（对接 /regexRules）
 */
function RegexSettings() {
  const [filterForm] = Form.useForm<RegexRulesQueryForm>();
  const [editForm] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RegexRule | null>(null);

  const { tableProps, search, refresh } = useAntdTable(RegexRulesQueryApi, {
    form: filterForm,
    defaultPageSize: 10,
  });

  const { run: runCreate, loading: creating } = useRequest(
    RegexRulesInsertApi,
    {
      manual: true,
      onSuccess: () => {
        message.success('已新建');
        setOpen(false);
        refresh();
      },
      onError: (e) => message.error(e.message),
    },
  );

  const { run: runUpdate, loading: updating } = useRequest(
    RegexRulesUpdateApi,
    {
      manual: true,
      onSuccess: () => {
        message.success('已保存');
        setOpen(false);
        refresh();
      },
      onError: (e) => message.error(e.message),
    },
  );

  const { run: runDelete } = useRequest(RegexRulesDeleteApi, {
    manual: true,
    onSuccess: () => {
      message.success('已删除');
      refresh();
    },
    onError: (e) => message.error(e.message),
  });

  const { run: runToggle } = useRequest(RegexRulesUpdateApi, {
    manual: true,
    onSuccess: () => {
      message.success('已更新启停');
      refresh();
    },
    onError: (e) => message.error(e.message),
  });

  const openCreate = () => {
    setEditing(null);
    editForm.resetFields();
    editForm.setFieldsValue({ enableStatus: RegexRuleEnableStatus.Enable });
    setOpen(true);
  };

  const openEdit = (row: RegexRule) => {
    setEditing(row);
    editForm.setFieldsValue(row);
    setOpen(true);
  };

  const submitEdit = async () => {
    const values = await editForm.validateFields();
    const payload = {
      ...values,
      folderName: String(values.folderName ?? '').trim(),
    };
    if (editing) {
      runUpdate({ id: editing.id, ...payload });
    } else {
      runCreate(payload);
    }
  };

  const columns: ColumnsType<RegexRule> = [
    { title: '名称', dataIndex: 'ruleName', width: 160 },
    {
      title: '目录名',
      dataIndex: 'folderName',
      width: 140,
      ellipsis: true,
      render: (v: string) => <Typography.Text code>{v}</Typography.Text>,
    },
    {
      title: '文件正则',
      dataIndex: 'filePattern',
      ellipsis: true,
      render: (v: string) => <Typography.Text code>{v}</Typography.Text>,
    },
    { title: '说明', dataIndex: 'description', ellipsis: true },
    {
      title: '启用',
      dataIndex: 'enableStatus',
      width: 90,
      render: (enableStatus: RegexRule['enableStatus'], row) => (
        <Switch
          checked={enableStatus === RegexRuleEnableStatus.Enable}
          onChange={(checked) =>
            runToggle({
              id: row.id,
              enableStatus: checked
                ? RegexRuleEnableStatus.Enable
                : RegexRuleEnableStatus.Disable,
            })
          }
        />
      ),
    },
    { title: '更新时间', dataIndex: 'updateTime', width: 180 },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_, row) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEdit(row)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除该规则？"
            onConfirm={() => runDelete({ ids: [row.id] })}
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <section style={{ padding: 24 }}>
      <Space
        style={{
          width: '100%',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            正则表达式设置
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            用于扫描文件夹的白名单（目录名 + 文件正则）。
          </Typography.Paragraph>
        </div>
        <Button type="primary" onClick={openCreate}>
          新建
        </Button>
      </Space>

      <Form form={filterForm} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item name="ruleNameSearchParam" label="名称">
          <Input allowClear placeholder="关键字" style={{ width: 180 }} />
        </Form.Item>
        <Form.Item name="enableStatus" label="启用">
          <Select
            allowClear
            placeholder="全部"
            style={{ width: 120 }}
            options={[
              { label: '启用', value: RegexRuleEnableStatus.Enable },
              { label: '停用', value: RegexRuleEnableStatus.Disable },
            ]}
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" onClick={search.submit}>
              查询
            </Button>
            <Button onClick={search.reset}>重置</Button>
          </Space>
        </Form.Item>
      </Form>

      <Table<RegexRule> rowKey="id" columns={columns} {...tableProps} />

      <Modal
        title={editing ? '编辑规则' : '新建规则'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={submitEdit}
        confirmLoading={creating || updating}
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item
            name="ruleName"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="folderName"
            label="目录名"
            rules={[{ required: true, validator: validateFolderName }]}
            extra="项目根下第一层目录名，如 .cursor、docs"
          >
            <Input placeholder=".cursor" />
          </Form.Item>
          <Form.Item
            name="filePattern"
            label="文件正则"
            rules={[{ required: true, validator: validateFilePattern }]}
            extra="匹配文件名格式，勿包首尾斜杠"
          >
            <Input.TextArea rows={2} placeholder="\.mdc?$" />
          </Form.Item>
          <Form.Item name="description" label="说明">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            name="enableStatus"
            label="启用"
            getValueFromEvent={(checked: boolean) =>
              checked
                ? RegexRuleEnableStatus.Enable
                : RegexRuleEnableStatus.Disable
            }
            getValueProps={(value: RegexRule['enableStatus']) => ({
              checked: value === RegexRuleEnableStatus.Enable,
            })}
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  );
}

export default RegexSettings;
