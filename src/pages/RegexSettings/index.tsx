import { RegexCreateApi } from '@/apis/regex/create';
import { RegexDeleteApi } from '@/apis/regex/delete';
import { RegexListApi } from '@/apis/regex/list';
import { RegexToggleApi } from '@/apis/regex/toggle';
import type { RegexListForm, RegexRule } from '@/apis/regex/types';
import { RegexUpdateApi } from '@/apis/regex/update';
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
 * 校验正则字面量是否可编译
 */
function validatePattern(_: unknown, value: string) {
  if (!value) {
    return Promise.reject(new Error('请输入正则'));
  }
  try {
    new RegExp(value);
    return Promise.resolve();
  } catch {
    return Promise.reject(new Error('正则语法无效'));
  }
}

/**
 * 正则表达式设置：扫描文件夹白名单（Antd CRUD Demo）
 */
function RegexSettings() {
  const [filterForm] = Form.useForm<RegexListForm>();
  const [editForm] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RegexRule | null>(null);

  const { tableProps, search, refresh } = useAntdTable(RegexListApi, {
    form: filterForm,
    defaultPageSize: 10,
  });

  const { run: runCreate, loading: creating } = useRequest(RegexCreateApi, {
    manual: true,
    onSuccess: () => {
      message.success('已新建');
      setOpen(false);
      refresh();
    },
    onError: (e) => message.error(e.message),
  });

  const { run: runUpdate, loading: updating } = useRequest(RegexUpdateApi, {
    manual: true,
    onSuccess: () => {
      message.success('已保存');
      setOpen(false);
      refresh();
    },
    onError: (e) => message.error(e.message),
  });

  const { run: runDelete } = useRequest(RegexDeleteApi, {
    manual: true,
    onSuccess: () => {
      message.success('已删除');
      refresh();
    },
    onError: (e) => message.error(e.message),
  });

  const { run: runToggle } = useRequest(RegexToggleApi, {
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
    editForm.setFieldsValue({ enabled: true });
    setOpen(true);
  };

  const openEdit = (row: RegexRule) => {
    setEditing(row);
    editForm.setFieldsValue(row);
    setOpen(true);
  };

  const submitEdit = async () => {
    const values = await editForm.validateFields();
    if (editing) {
      runUpdate({ id: editing.id, ...values });
    } else {
      runCreate(values);
    }
  };

  const columns: ColumnsType<RegexRule> = [
    { title: '名称', dataIndex: 'name', width: 160 },
    {
      title: '正则',
      dataIndex: 'pattern',
      ellipsis: true,
      render: (v: string) => <Typography.Text code>{v}</Typography.Text>,
    },
    { title: '说明', dataIndex: 'description', ellipsis: true },
    {
      title: '启用',
      dataIndex: 'enabled',
      width: 90,
      render: (enabled: boolean, row) => (
        <Switch
          checked={enabled}
          onChange={(checked) => runToggle({ id: row.id, enabled: checked })}
        />
      ),
    },
    { title: '更新时间', dataIndex: 'updatedAt', width: 120 },
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
            onConfirm={() => runDelete({ id: row.id })}
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
            用于扫描文件夹的白名单规则（Demo，数据为内存 mock）。
          </Typography.Paragraph>
        </div>
        <Button type="primary" onClick={openCreate}>
          新建
        </Button>
      </Space>

      <Form form={filterForm} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item name="name" label="名称">
          <Input allowClear placeholder="关键字" style={{ width: 180 }} />
        </Form.Item>
        <Form.Item name="enabled" label="启用">
          <Select
            allowClear
            placeholder="全部"
            style={{ width: 120 }}
            options={[
              { label: '启用', value: true },
              { label: '停用', value: false },
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
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="pattern"
            label="正则"
            rules={[{ required: true, validator: validatePattern }]}
          >
            <Input.TextArea rows={3} placeholder="正则字面量，勿包首尾斜杠" />
          </Form.Item>
          <Form.Item name="description" label="说明">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  );
}

export default RegexSettings;
