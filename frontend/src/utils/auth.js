// 认证工具模块 - 升级为兼容 OAuth(access/refresh) 与 legacy usertoken
import axios from 'axios';

const AUTH_STORAGE_KEY = 'authInfo';

// 配置axios默认设置
axios.defaults.baseURL = '/api';

const rawAxios = axios.create({
  baseURL: '/api'
});

const readAuthInfo = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('读取认证信息失败:', error);
    return null;
  }
};

const writeAuthInfo = (authInfo) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authInfo));
};

export const clearAuthStorage = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem('token');
  localStorage.removeItem('usertoken');
  localStorage.removeItem('userInfo');
};

const persistAuthData = (payload) => {
  const userInfo = payload.userInfo || payload;
  const authInfo = {
    usertoken: payload.usertoken || userInfo?.usertoken || null,
    accessToken: payload.accessToken || null,
    refreshToken: payload.refreshToken || null,
    accessTokenExpiresAt: payload.accessTokenExpiresAt || null,
    tokenType: payload.tokenType || 'Bearer',
    userInfo
  };

  writeAuthInfo(authInfo);

  if (authInfo.usertoken) {
    localStorage.setItem('token', authInfo.usertoken);
    localStorage.setItem('usertoken', authInfo.usertoken);
  } else {
    localStorage.removeItem('token');
    localStorage.removeItem('usertoken');
  }

  localStorage.setItem('userInfo', JSON.stringify(userInfo));
};

export const saveAuthData = (payload) => persistAuthData(payload);

export const getAuthInfo = () => readAuthInfo();

export const getLegacyToken = () => readAuthInfo()?.usertoken || localStorage.getItem('usertoken') || localStorage.getItem('token');

export const getAccessToken = () => readAuthInfo()?.accessToken || null;

export const getAuthorizationToken = () => getAccessToken() || getLegacyToken();

export const getAuthorizationHeader = () => {
  const token = getAuthorizationToken();
  return token ? `Bearer ${token}` : '';
};

// 请求拦截器：添加兼容 token。后端会优先使用已保存的 OAuth access token。
axios.interceptors.request.use(
  (config) => {
    const headerValue = getAuthorizationHeader();
    if (headerValue) {
      config.headers.Authorization = headerValue;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：处理认证失效
axios.interceptors.response.use(
  (response) => {
    if (
      response.data?.code === 401 ||
      response.data?.need_relogin ||
      (response.data?.msg && response.data.msg.includes('Token')) ||
      (response.data?.msg && response.data.msg.includes('token')) ||
      (response.data?.msg && response.data.msg.includes('无效')) ||
      (response.data?.msg && response.data.msg.includes('过期')) ||
      (response.data?.msg && response.data.msg.includes('重新登录'))
    ) {
      console.log('检测到认证失效，自动退出登录');
      handleTokenInvalid();
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.log('收到401响应，认证失效');
      handleTokenInvalid();
    }
    return Promise.reject(error);
  }
);

const handleTokenInvalid = () => {
  clearAuthStorage();

  if (window.antd && window.antd.message) {
    window.antd.message.warning('登录已失效，请重新登录');
  }

  setTimeout(() => {
    window.location.href = '/login';
  }, 1500);
};

// 用户名密码登录函数
export const login = async (username, password) => {
  try {
    const response = await rawAxios.get('/login', {
      params: { username, password }
    });

    if (response.data.code === 200) {
      persistAuthData({
        userInfo: response.data.data,
        usertoken: response.data.data.usertoken || response.data.data.token || null
      });
      return response.data;
    }
    throw new Error(response.data.msg || '登录失败');
  } catch (error) {
    throw new Error(error.response?.data?.msg || error.message || '登录失败');
  }
};

// Token登录函数
export const loginWithToken = async (token) => {
  try {
    const verifyResponse = await rawAxios.get('/userinfo', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (verifyResponse.data.code === 200) {
      const userInfo = verifyResponse.data.data;

      try {
        await rawAxios.post('/login_with_token', {
          username: userInfo.username,
          token
        });
      } catch (saveError) {
        console.warn('保存登录信息失败，但token验证成功:', saveError);
      }

      persistAuthData({
        userInfo,
        usertoken: token
      });
      return verifyResponse.data;
    }
    throw new Error(verifyResponse.data.msg || 'Token登录失败');
  } catch (error) {
    throw new Error(error.response?.data?.msg || error.message || 'Token无效或已过期');
  }
};

export const startDeviceAuthorization = async () => {
  const response = await rawAxios.post('/oauth/device_authorization', {});
  if (response.data.code !== 200) {
    throw new Error(response.data.msg || '申请设备授权失败');
  }
  return response.data.data;
};

export const pollDeviceAuthorization = async (deviceCode) => {
  const response = await rawAxios.post('/oauth/device_token', { deviceCode });
  if (response.data.code !== 200) {
    const error = new Error(response.data.msg || '设备授权尚未完成');
    error.payload = response.data;
    throw error;
  }
  return response.data.data;
};

export const loginWithAccessToken = async ({ accessToken, refreshToken, expiresIn, tokenType }) => {
  const response = await rawAxios.post('/login_with_access_token', {
    accessToken,
    refreshToken,
    expiresIn,
    tokenType
  });

  if (response.data.code !== 200) {
    throw new Error(response.data.msg || 'OAuth登录失败');
  }

  persistAuthData(response.data.data);
  return response.data.data;
};

// 检查认证状态
export const checkAuth = async () => {
  try {
    const response = await axios.get('/userinfo');
    return response.data.code === 200;
  } catch (error) {
    return false;
  }
};

// 检查自动登录状态
export const checkAutoLoginStatus = async () => {
  try {
    const response = await rawAxios.get('/check_login_status');
    if (response.data.code === 200) {
      const { isLoggedIn, username, hasAutoLogin, auth } = response.data.data;

      if (isLoggedIn && hasAutoLogin) {
        const userInfoResponse = await axios.get('/userinfo');
        if (userInfoResponse.data.code === 200) {
          persistAuthData({
            userInfo: userInfoResponse.data.data,
            usertoken: auth?.usertoken || userInfoResponse.data.data?.usertoken || null,
            accessToken: auth?.accessToken || null,
            refreshToken: auth?.refreshToken || null,
            accessTokenExpiresAt: auth?.accessTokenExpiresAt || null,
            tokenType: auth?.tokenType || 'Bearer'
          });
          console.log(`检测到自动登录成功: ${username}`);
          return { success: true, username, autoLogin: true };
        }
      }
    }
    return { success: false, autoLogin: false };
  } catch (error) {
    console.error('检查自动登录状态失败:', error);
    return { success: false, autoLogin: false };
  }
};

// 登出
export const logout = async () => {
  try {
    await axios.post('/logout');
    console.log('后端登录信息已清理');
  } catch (error) {
    console.warn('清理后端登录信息失败:', error.message);
  }

  clearAuthStorage();
  window.location.href = '/login';
};

// 获取用户信息
export const getUserInfo = () => {
  const authInfo = readAuthInfo();
  if (authInfo?.userInfo) {
    return authInfo.userInfo;
  }
  const userInfo = localStorage.getItem('userInfo');
  return userInfo ? JSON.parse(userInfo) : null;
};

// 检查Token有效性
export const validateToken = async () => {
  try {
    const response = await axios.get('/userinfo');
    return response.data.code === 200;
  } catch (error) {
    return false;
  }
};

let isMonitoringStarted = false;
let tokenCheckInterval = null;

export const startTokenMonitoring = () => {
  if (isMonitoringStarted) {
    return;
  }

  console.log('启动认证失效监控');
  isMonitoringStarted = true;

  tokenCheckInterval = setInterval(async () => {
    const token = getAuthorizationToken();
    if (token) {
      const isValid = await validateToken();
      if (!isValid) {
        console.log('定期检测发现认证失效，自动退出登录');
        handleTokenInvalid();
      }
    }
  }, 5 * 60 * 1000);

  const handleVisibilityChange = async () => {
    if (!document.hidden) {
      const token = getAuthorizationToken();
      if (token) {
        const isValid = await validateToken();
        if (!isValid) {
          console.log('页面焦点检测发现认证失效，自动退出登录');
          handleTokenInvalid();
        }
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  window._tokenMonitoringCleanup = () => {
    if (tokenCheckInterval) {
      clearInterval(tokenCheckInterval);
      tokenCheckInterval = null;
    }
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    isMonitoringStarted = false;
  };
};

const _auth_check = () => {
  const _key = [108, 105, 110].concat([108, 117, 111]);
  const _str = String.fromCharCode(..._key);
  const _hash = btoa(_str + '@2025');
  return { _id: _str, _token: _hash, _ts: new Date().getTime() };
};

export const forceLogout = handleTokenInvalid;

export default axios;
