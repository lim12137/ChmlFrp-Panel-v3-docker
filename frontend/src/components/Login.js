/* 登录组件 - Author: linluo - 防盗标识: linluo */
import React, { useEffect, useRef, useState } from 'react';
import { Form, Input, Button, Card, message, Row, Col, Tabs, Alert, Space, Typography, Steps } from 'antd';
import { UserOutlined, LockOutlined, KeyOutlined, QrcodeOutlined, LoadingOutlined } from '@ant-design/icons';
import { login, loginWithToken, startTokenMonitoring, startDeviceAuthorization, pollDeviceAuthorization, loginWithAccessToken } from '../utils/auth';

const { Text, Paragraph } = Typography;

const Login = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('password');
  const [deviceState, setDeviceState] = useState({
    loading: false,
    pending: false,
    data: null,
    error: ''
  });
  const pollTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const finishLogin = async (payload) => {
    await loginWithAccessToken(payload);
    message.success('授权登录成功！');
    startTokenMonitoring();
    onLogin();
  };

  // 用户名密码登录
  const onPasswordLogin = async (values) => {
    setLoading(true);
    try {
      await login(values.username, values.password);
      message.success('登录成功！');
      startTokenMonitoring();
      onLogin();
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Token登录
  const onTokenLogin = async (values) => {
    setLoading(true);
    try {
      await loginWithToken(values.token);
      message.success('Token登录成功！');
      startTokenMonitoring();
      onLogin();
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const onStartDeviceLogin = async () => {
    setDeviceState({ loading: true, pending: false, data: null, error: '' });
    try {
      const data = await startDeviceAuthorization();
      setDeviceState({ loading: false, pending: true, data, error: '' });
      stopPolling();
      const pollInterval = Math.max(3000, Number(data.interval || 5) * 1000);
      pollTimerRef.current = setInterval(async () => {
        try {
          const tokenData = await pollDeviceAuthorization(data.device_code);
          stopPolling();
          setDeviceState((prev) => ({ ...prev, pending: false }));
          await finishLogin({
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresIn: tokenData.expires_in,
            tokenType: tokenData.token_type
          });
        } catch (error) {
          const pendingMessage = error.payload?.error_description || error.payload?.error || error.message || '';
          const isPending = error.payload?.state === 'pending'
            || String(pendingMessage).includes('authorization_pending')
            || String(pendingMessage).includes('slow_down')
            || String(pendingMessage).includes('尚未完成');
          if (!isPending) {
            stopPolling();
            setDeviceState({ loading: false, pending: false, data: null, error: pendingMessage || '设备授权失败' });
          }
        }
      }, pollInterval);
    } catch (error) {
      stopPolling();
      setDeviceState({ loading: false, pending: false, data: null, error: error.message });
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Row justify="center" align="middle" style={{ width: '100%' }}>
        <Col xs={22} sm={16} md={12} lg={8} xl={6}>
          <Card
            title={
              <div style={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold' }}>
                ChmlFrp 管理面板
              </div>
            }
            style={{
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              borderRadius: '10px'
            }}
          >
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              centered
              items={[
                {
                  key: 'password',
                  label: '密码登录',
                  children: (
                    <Form name="passwordLogin" onFinish={onPasswordLogin} size="large">
                      <Form.Item name="username" rules={[{ required: true, message: '请输入用户名或邮箱!' }]}>
                        <Input prefix={<UserOutlined />} placeholder="用户名或邮箱" />
                      </Form.Item>
                      <Form.Item name="password" rules={[{ required: true, message: '请输入密码!' }]}>
                        <Input.Password prefix={<LockOutlined />} placeholder="密码" />
                      </Form.Item>
                      <Form.Item>
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={loading}
                          style={{
                            width: '100%',
                            height: '45px',
                            fontSize: '16px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none'
                          }}
                        >
                          登录
                        </Button>
                      </Form.Item>
                    </Form>
                  )
                },
                {
                  key: 'token',
                  label: 'Token登录',
                  children: (
                    <Form name="tokenLogin" onFinish={onTokenLogin} size="large">
                      <Form.Item name="token" rules={[{ required: true, message: '请输入Token!' }]}>
                        <Input.Password prefix={<KeyOutlined />} placeholder="请输入用户Token" />
                      </Form.Item>
                      <Form.Item>
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={loading}
                          style={{
                            width: '100%',
                            height: '45px',
                            fontSize: '16px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none'
                          }}
                        >
                          Token登录
                        </Button>
                      </Form.Item>
                    </Form>
                  )
                },
                {
                  key: 'device',
                  label: '设备码登录',
                  children: (
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      <Button
                        type="primary"
                        icon={deviceState.loading ? <LoadingOutlined /> : <QrcodeOutlined />}
                        loading={deviceState.loading}
                        onClick={onStartDeviceLogin}
                        style={{
                          width: '100%',
                          height: '45px',
                          fontSize: '16px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          border: 'none'
                        }}
                      >
                        开始设备授权
                      </Button>

                      {deviceState.data && (
                        <Card size="small">
                          <Steps
                            size="small"
                            current={deviceState.pending ? 1 : 2}
                            items={[
                              { title: '申请设备码' },
                              { title: '前往授权页' },
                              { title: '完成登录' }
                            ]}
                          />
                          <div style={{ marginTop: 16 }}>
                            <Paragraph>
                              设备码: <Text code copyable>{deviceState.data.user_code}</Text>
                            </Paragraph>
                            <Paragraph>
                              授权地址: <Text copyable>{deviceState.data.verification_uri}</Text>
                            </Paragraph>
                            {deviceState.data.verification_uri_complete && (
                              <Paragraph>
                                完整链接: <Text copyable>{deviceState.data.verification_uri_complete}</Text>
                              </Paragraph>
                            )}
                            <Alert type="info" showIcon message="请在浏览器中完成授权后等待自动登录" />
                          </div>
                        </Card>
                      )}

                      {deviceState.error && <Alert type="error" showIcon message={deviceState.error} />}
                    </Space>
                  )
                }
              ]}
            />

            <div style={{ textAlign: 'center', color: '#999', marginTop: '20px' }}>
              <p>ChmlFrp 内网穿透管理系统</p>
              <p style={{ fontSize: '12px' }}>Powered by Docker</p>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Login;
