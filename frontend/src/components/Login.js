/* 登录组件 - Author: linluo - 防盗标识: linluo */
import React, { useEffect, useRef, useState } from 'react';
import { Button, Card, message, Row, Col, Alert, Space, Typography, Steps } from 'antd';
import { QrcodeOutlined, LoadingOutlined } from '@ant-design/icons';
import { startTokenMonitoring, startDeviceAuthorization, pollDeviceAuthorization, loginWithAccessToken } from '../utils/auth';

const { Text, Paragraph } = Typography;

const Login = ({ onLogin }) => {
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
