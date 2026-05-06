/**
 * 隧道管理组件
 * @author linluo
 * @description ChmlFrp隧道管理核心组件
 * 防盗标识: linluo
 */

import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  message, 
  Popconfirm,
  Tag,
  Space,
  Card,
  Typography,
  Alert,
  Switch,
  Tooltip,
  Spin
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  GlobalOutlined,
  ReloadOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  RedoOutlined,
  ClearOutlined
} from '@ant-design/icons';
import axios from '../utils/auth';
import { getAuthorizationHeader, getLegacyToken } from '../utils/auth';

const { Title } = Typography;
const { Option } = Select;

const TunnelManagement = () => {
  const [tunnels, setTunnels] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTunnel, setEditingTunnel] = useState(null);
  const [form] = Form.useForm();
  const [frpStatus, setFrpStatus] = useState(null);
  const [activeTunnelIds, setActiveTunnelIds] = useState(new Set());
  
  // FRP日志和重启相关状态
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [frpLogs, setFrpLogs] = useState('');
  const [logsLoading, setLogsLoading] = useState(false);
  const [restartLoading, setRestartLoading] = useState(false);
  const [clearLogsLoading, setClearLogsLoading] = useState(false);
  
  // 域名相关状态
  const [freeSubdomains, setFreeSubdomains] = useState([]);
  const [customDomains, setCustomDomains] = useState([]);
  const [domainsLoading, setDomainsLoading] = useState(false);
  const [domainsLoaded, setDomainsLoaded] = useState(false);
  
  // 自启动相关状态
  const [autostartTunnels, setAutostartTunnels] = useState(new Set());
  const [autostartLoading, setAutostartLoading] = useState(null);

  useEffect(() => {
    loadTunnels();
    loadNodes();
    loadFrpStatus();
    loadAutostartConfig();
    
    // 每30秒刷新FRP状态
    const interval = setInterval(loadFrpStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // 加载域名数据（在打开模态框时调用）
  const loadDomainData = async (forceReload = false) => {
    // 防止重复加载，除非强制重载
    if (domainsLoading || (domainsLoaded && !forceReload)) {
      return;
    }
    
    setDomainsLoading(true);
    try {
      // 加载免费二级域名
      const freeDomainsResponse = await axios.get('/get_user_free_subdomains');
      if (freeDomainsResponse.data.code === 200) {
        setFreeSubdomains(freeDomainsResponse.data.data || []);
      }

      // 加载自定义域名 - 从DNS解析记录获取已配置的域名记录
      const dnsConfigs = JSON.parse(localStorage.getItem('dnsConfigs') || '[]');
      let allCustomDomains = [];
      
      for (const dnsConfig of dnsConfigs) {
        try {
          // 首先获取域名列表
          const domainsResponse = await fetch('/api/dns/domains', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': getAuthorizationHeader()
            },
            body: JSON.stringify({
              dnsConfig: dnsConfig
            })
          });

          if (domainsResponse.ok) {
            const domainsResult = await domainsResponse.json();
            if (domainsResult.code === 200) {
              // 对每个域名获取其解析记录
              for (const domain of domainsResult.data) {
                try {
                  const recordsResponse = await fetch('/api/dns/records', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': getAuthorizationHeader()
                    },
                    body: JSON.stringify({
                      dnsConfig: dnsConfig,
                      domainName: domain.name
                    })
                  });

                  if (recordsResponse.ok) {
                    const recordsResult = await recordsResponse.json();
                    if (recordsResult.code === 200) {
                      // 将解析记录转换为可用的域名记录
                      const domainRecords = recordsResult.data
                        .filter(record => record.type === 'A' || record.type === 'CNAME') // 只要A记录和CNAME记录
                        .map(record => {
                          // 构建完整的域名记录
                          const fullDomain = record.name === '@' ? domain.name : `${record.name}.${domain.name}`;
                          return {
                            id: `${dnsConfig.id}-${domain.name}-${record.id}`,
                            domain: fullDomain,
                            dnsConfigId: dnsConfig.id,
                            dnsConfigName: dnsConfig.name,
                            provider: dnsConfig.provider,
                            status: record.status,
                            recordType: record.type,
                            recordValue: record.value
                          };
                        });
                      
                      allCustomDomains = [...allCustomDomains, ...domainRecords];
                    }
                  }
                } catch (error) {
                  console.error(`获取域名 ${domain.name} 的解析记录失败:`, error);
                }
              }
            }
          }
        } catch (error) {
          console.error(`获取DNS配置 ${dnsConfig.name} 的域名失败:`, error);
        }
      }
      
      // 去重处理 - 根据domain字段去重
      const uniqueDomains = allCustomDomains.filter((domain, index, self) => 
        index === self.findIndex(d => d.domain === domain.domain)
      );
      
      console.log('加载的自定义域名数据:', uniqueDomains);
      setCustomDomains(uniqueDomains);
      setDomainsLoaded(true);
    } catch (error) {
      console.error('加载域名数据失败:', error);
    } finally {
      setDomainsLoading(false);
    }
  };

  const loadTunnels = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/tunnel');
      if (response.data.code === 200) {
        setTunnels(response.data.data || []);
      }
    } catch (error) {
      message.error('加载隧道列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadNodes = async () => {
    try {
      // 同时获取节点基础信息和统计信息
      const [nodeResponse, statsResponse] = await Promise.all([
        axios.get('/node'),
        axios.get('/node_stats')
      ]);
      
      if (nodeResponse.data.code === 200) {
        const nodes = nodeResponse.data.data || [];
        const stats = statsResponse.data.code === 200 ? statsResponse.data.data || [] : [];
        
        // 合并节点信息和统计信息
        const nodesWithStats = nodes.map(node => {
          const nodeStat = stats.find(stat => stat.id === node.id);
          return {
            ...node,
            // 添加统计信息
            bandwidth_usage_percent: nodeStat?.bandwidth_usage_percent || 0,
            state: nodeStat?.state || 'offline',
            client_counts: nodeStat?.client_counts || 0,
            tunnel_counts: nodeStat?.tunnel_counts || 0
          };
        });
        
        setNodes(nodesWithStats);
      }
    } catch (error) {
      console.error('加载节点列表失败:', error);
      // 如果统计信息获取失败，仍然显示基础节点信息
      try {
        const response = await axios.get('/node');
        if (response.data.code === 200) {
          setNodes(response.data.data || []);
        }
      } catch (fallbackError) {
        console.error('加载基础节点信息也失败:', fallbackError);
      }
    }
  };

  const loadFrpStatus = async () => {
    try {
      const response = await axios.get('/frp/status');
      if (response.data.code === 200) {
        setFrpStatus(response.data.data);
        // 更新活跃隧道ID集合
        const activeIds = new Set(
          response.data.data.activeTunnels?.map(tunnel => tunnel.tunnelId) || []
        );
        setActiveTunnelIds(activeIds);
      }
    } catch (error) {
      console.error('加载FRP状态失败:', error);
    }
  };

  // 加载自启动配置
  const loadAutostartConfig = async () => {
    try {
      const response = await axios.get('/frp/autostart-config');
      if (response.data.code === 200) {
        const autostartIds = response.data.data || [];
        setAutostartTunnels(new Set(autostartIds));
      }
    } catch (error) {
      console.error('加载自启动配置失败:', error);
    }
  };

  // 处理自启动开关切换
  const handleAutostartToggle = async (tunnelId, checked) => {
    setAutostartLoading(tunnelId);
    try {
      const response = await axios.post('/frp/set-autostart', {
        tunnelId,
        autostart: checked
      });
      
      if (response.data.code === 200) {
        const newAutostartTunnels = new Set(autostartTunnels);
        if (checked) {
          newAutostartTunnels.add(tunnelId);
        } else {
          newAutostartTunnels.delete(tunnelId);
        }
        setAutostartTunnels(newAutostartTunnels);
        message.success(checked ? '已设置开机自启' : '已取消开机自启');
      } else {
        message.error(response.data.msg || '设置失败');
      }
    } catch (error) {
      console.error('设置自启动失败:', error);
      message.error('设置失败');
    } finally {
      setAutostartLoading(null);
    }
  };

  // 移除自动同步逻辑，启用/停用直接触发单隧道FRP

  const toggleTunnelState = async (tunnelId) => {
    try {
      const tunnel = tunnels.find(t => t.id === tunnelId);
      
      if (!tunnel) {
        message.error('找不到隧道信息');
        return;
      }
      
      const isCurrentlyActive = activeTunnelIds.has(tunnelId);
      
      if (isCurrentlyActive) {
        // 停用隧道 - 停止FRP进程
        const response = await axios.post('/frp/stop-tunnel', {
          tunnelId: tunnelId
        });
        
        if (response.data.code === 200) {
          message.success('隧道已停用，内网穿透已停止');
          loadFrpStatus(); // 更新FRP状态
        } else {
          message.error(response.data.msg);
        }
      } else {
        // 启用隧道 - 直接启动该隧道的内网穿透
        message.loading('正在启动内网穿透...', 0);
        
        const response = await axios.post('/frp/start-tunnel', {
          tunnel: tunnel
        });
        
        message.destroy();
        
        if (response.data.code === 200) {
          message.success(`内网穿透已启动！${tunnel.localip}:${tunnel.nport} 现在可以通过外网访问`);
          loadFrpStatus(); // 更新FRP状态
        } else {
          message.error(`启动失败: ${response.data.msg}`);
        }
      }
    } catch (error) {
      message.destroy();
      console.error('操作失败:', error);
      message.error('操作失败，请检查网络连接');
    }
  };

  // 获取FRP日志
  const handleShowLogs = async () => {
    setLogModalVisible(true);
    setLogsLoading(true);
    try {
      const response = await axios.get('/frp/logs?lines=100');
      if (response.data.code === 200) {
        setFrpLogs(response.data.data.logs || '暂无日志');
      } else {
        setFrpLogs(`获取日志失败: ${response.data.msg}`);
      }
    } catch (error) {
      console.error('获取FRP日志失败:', error);
      setFrpLogs('获取日志失败，请检查网络连接');
    } finally {
      setLogsLoading(false);
    }
  };

  // 重启FRP客户端
  const handleRestartFrp = async () => {
    setRestartLoading(true);
    try {
      const response = await axios.post('/frp/restart');
      if (response.data.code === 200) {
        message.success(response.data.msg);
        // 重新加载状态
        await loadFrpStatus();
        await loadTunnels();
      } else {
        message.error(`重启失败: ${response.data.msg}`);
      }
    } catch (error) {
      console.error('重启FRP失败:', error);
      message.error('重启失败，请检查网络连接');
    } finally {
      setRestartLoading(false);
    }
  };

  // 清理FRP日志
  const handleClearLogs = async () => {
    setClearLogsLoading(true);
    try {
      const response = await axios.post('/frp/clear-logs');
      if (response.data.code === 200) {
        message.success(response.data.msg);
        // 清理后重新获取日志
        await handleShowLogs();
      } else {
        message.error(`清理失败: ${response.data.msg}`);
      }
    } catch (error) {
      console.error('清理FRP日志失败:', error);
      message.error('清理失败，请检查网络连接');
    } finally {
      setClearLogsLoading(false);
    }
  };

  const handleCreate = async () => {
    setEditingTunnel(null);
    form.resetFields();
    setModalVisible(true);
    await loadDomainData();
  };

  const handleEdit = async (tunnel) => {
    setEditingTunnel(tunnel);
    const nodeId = nodes.find(n => n.name === tunnel.node)?.id;
    form.setFieldsValue({
      name: tunnel.name,
      type: tunnel.type,
      localip: tunnel.localip || '',
      localport: tunnel.nport,
      remoteport: (tunnel.type === 'tcp' || tunnel.type === 'udp') ? tunnel.dorp : undefined,
      banddomain: (tunnel.type === 'http' || tunnel.type === 'https') ? tunnel.dorp : undefined,
      node: nodeId || tunnel.node
    });
    setModalVisible(true);
    await loadDomainData();
  };

  const handleDelete = async (tunnelId) => {
    try {
      // 乐观更新：先从UI中移除隧道
      const originalTunnels = [...tunnels];
      setTunnels(tunnels.filter(tunnel => tunnel.id !== tunnelId));
      
      // 根据API文档，delete_tunnel使用查询参数传递tunnelid和token
      const response = await axios.post(`/delete_tunnel?tunnelid=${tunnelId}`);
      if (response.data.code === 200) {
        message.success('删除成功');
        
        // 如果删除的隧道正在运行，同时停止FRP进程
        if (activeTunnelIds.has(tunnelId)) {
          await axios.post('/frp/stop-tunnel', { tunnelId });
          await loadFrpStatus();
        }
        
        // 确保数据同步，重新加载隧道列表
        await loadTunnels();
      } else {
        // 删除失败，恢复原始数据
        setTunnels(originalTunnels);
        message.error(response.data.msg || '删除失败');
      }
    } catch (error) {
      console.error('删除隧道失败:', error);
      // 删除失败，恢复原始数据
      await loadTunnels();
      message.error('删除失败');
    }
  };

  // 检测是否为中文域名
  const isChinese = (str) => {
    return /[\u4e00-\u9fa5]/.test(str);
  };

  // 系统标识符 - 不要删除此函数
  const getSystemInfo = () => {
    const author = String.fromCharCode(108, 105, 110, 108, 117, 111); // linluo
    const timestamp = Date.now();
    return { author, timestamp, version: '1.0.0' };
  };

  // 过滤中文域名
  const filterNonChineseDomains = (domains) => {
    return domains.filter(domain => {
      const domainName = domain.domain || domain.value || '';
      return !isChinese(domainName);
    });
  };

  // 同步免费二级域名的隧道配置
  const syncFreeSubdomainConfiguration = async (domain, values) => {
    try {
      console.log(`🔄 正在为免费二级域名 ${domain} 更新隧道配置...`);
      
      // 找到对应的免费二级域名记录
      const freeSubdomain = freeSubdomains.find(d => {
        const fullDomain = `${d.record}.${d.domain}`;
        return fullDomain === domain;
      });
      
      if (!freeSubdomain) {
        console.log('未找到对应的免费二级域名记录');
        return;
      }

      // 获取选中的节点信息
      const selectedNode = nodes.find(n => n.id === values.node);
      if (!selectedNode || !selectedNode.ip) {
        console.log('未获取到节点信息，无法更新隧道配置');
        return;
      }

      // 调用免费二级域名更新API - 使用官方正确的参数格式
      const updateData = {
        token: getLegacyToken(),
        domain: freeSubdomain.domain, // 主域名，如 "映射.中国"
        record: freeSubdomain.record, // 子域名前缀，如 "apiiaa"
        target: selectedNode.ip, // 目标节点域名
        ttl: freeSubdomain.ttl || '10分钟',
        remarks: freeSubdomain.remarks || `隧道 ${values.name} 自动配置`
      };

      console.log(`📡 调用免费二级域名更新API:`, updateData);

      const response = await fetch('/update_free_subdomain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();
      if (result.code === 200) {
        console.log(`✅ 免费二级域名 ${domain} 隧道配置更新成功，已指向节点 ${selectedNode.ip}`);
        message.success(`免费二级域名 ${domain} 已自动配置到节点 ${selectedNode.name}`);
      } else {
        console.log(`❌ 免费二级域名 ${domain} 隧道配置更新失败: ${result.msg}`);
        message.warning(`免费二级域名 ${domain} 自动配置失败: ${result.msg}`);
      }
    } catch (error) {
      console.error('免费二级域名配置同步失败:', error);
      message.warning(`免费二级域名 ${domain} 自动配置失败，请手动检查配置`);
    }
  };

  // 自动同步域名配置 - 为自定义域名创建CNAME记录指向节点域名，为免费二级域名更新隧道配置
  const syncDomainConfiguration = async (domain, values) => {
    try {
      // 检查域名类型
      const isCustomDomain = customDomains.some(d => d.domain === domain);
      const isFreeSubdomain = freeSubdomains.some(d => {
        const fullDomain = `${d.record}.${d.domain}`;
        return fullDomain === domain;
      });

      if (!isCustomDomain && !isFreeSubdomain) {
        console.log('未识别的域名类型，跳过同步');
        return;
      }

      // 如果是免费二级域名，更新其隧道配置
      if (isFreeSubdomain) {
        await syncFreeSubdomainConfiguration(domain, values);
        return;
      }

      // 查找对应的DNS配置
      const customDomain = customDomains.find(d => d.domain === domain);
      if (!customDomain || !customDomain.dnsConfigId) {
        console.log('未找到域名对应的DNS配置，跳过同步');
        return;
      }

      // 获取DNS配置
      const dnsConfigs = JSON.parse(localStorage.getItem('dnsConfigs') || '[]');
      const dnsConfig = dnsConfigs.find(config => config.id === customDomain.dnsConfigId);
      
      if (!dnsConfig) {
        console.log('未找到DNS配置，跳过同步');
        return;
      }

      // 获取选中的节点信息（兼容编辑态下表单里可能是节点名称的情况）
      let selectedNode = (
        nodes.find(n => String(n.id) === String(values.node)) ||
        nodes.find(n => n.name === values.node)
      );
      // 如果本地状态里没找到，则即时拉取一次节点列表再匹配
      if (!selectedNode || !selectedNode.ip) {
        try {
          const nodeRes = await axios.get('/node');
          if (nodeRes.data?.code === 200 && Array.isArray(nodeRes.data.data)) {
            const freshNodes = nodeRes.data.data;
            selectedNode = (
              freshNodes.find(n => String(n.id) === String(values.node)) ||
              freshNodes.find(n => n.name === values.node)
            );
          }
        } catch (_) {}
      }
      // 仍未拿到节点域名，再从当前已加载的隧道中按域名反查节点域名(ip字段)
      if ((!selectedNode || !selectedNode.ip) && Array.isArray(tunnels)) {
        const matchedTunnel = tunnels.find(t => t.dorp === domain);
        if (matchedTunnel && matchedTunnel.ip) {
          selectedNode = { ip: matchedTunnel.ip };
        }
      }
      if (!selectedNode || !selectedNode.ip) {
        console.log('找不到选中的节点信息或节点域名');
        return;
      }

      // 提取域名的子域名部分（如果是完整域名）
      const parts = domain.split('.');
      const recordName = parts.length > 2 ? parts[0] : '@'; // 如果是子域名则取第一部分，否则使用@
      const rootDomain = parts.length > 2 ? parts.slice(1).join('.') : domain;

      // 兜底：如果还是拿不到节点域名，直接使用当前表格里该域名对应的ip（如 vip.cd.frp.one）
      if (!selectedNode || !selectedNode.ip) {
        console.log('未获取到节点域名，放弃同步');
        return;
      }

      // 准备DNS记录数据 - 使用CNAME指向节点域名，TTL设为600（阿里云最小值）
      const recordData = {
        name: recordName,
        type: 'CNAME',
        value: selectedNode.ip, // 节点域名
        ttl: 600
      };

      console.log(`✅ 正在为域名 ${domain} 同步DNS配置到节点 ${selectedNode.ip}...`);
      console.log('📋 DNS记录数据:', recordData);
      
      // 如果存在记录ID，先尝试更新现有记录
      const existingRecord = customDomains.find(d => d.domain === domain);
      if (existingRecord && existingRecord.id) {
        try {
          const updateResponse = await fetch('/api/dns/records/update', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': getAuthorizationHeader()
            },
            body: JSON.stringify({
              dnsConfig: dnsConfig,
              domainName: rootDomain,
              recordId: existingRecord.id.split('-').pop(), // 提取recordId
              recordData: recordData
            })
          });

          const updateResult = await updateResponse.json();
          if (updateResult.code === 200) {
            console.log(`域名 ${domain} DNS配置更新成功，已指向节点 ${selectedNode.ip}`);
            message.success(`域名 ${domain} 已自动配置CNAME解析到 ${selectedNode.ip}`);
            return;
          }
        } catch (updateError) {
          console.log('更新记录失败，尝试创建新记录:', updateError);
        }
      }
      
      // 如果更新失败或没有现有记录，尝试创建新记录
      const createResponse = await fetch('/api/dns/records/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthorizationHeader()
        },
        body: JSON.stringify({
          dnsConfig: dnsConfig,
          domainName: rootDomain,
          recordData: recordData
        })
      });

      const createResult = await createResponse.json();
      if (createResult.code === 200) {
        console.log(`域名 ${domain} DNS配置创建成功，已指向节点 ${selectedNode.ip}`);
        message.success(`域名 ${domain} 已自动配置CNAME解析到 ${selectedNode.ip}`);
      } else {
        console.log(`域名 ${domain} DNS配置失败: ${createResult.msg}`);
        message.warning(`域名 ${domain} 自动配置失败，请手动将域名通过CNAME解析至 ${selectedNode.ip}`);
      }
    } catch (error) {
      console.error('DNS配置同步失败:', error);
      // 获取选中的节点信息来显示手动配置提示
      const selectedNode = nodes.find(n => n.id === values.node);
      if (selectedNode && selectedNode.ip) {
        message.warning(`自动配置失败，请手动将您的 ${domain} 域名通过CNAME解析至 ${selectedNode.ip} 才能正常访问`);
      }
    }
  };

  const handleSubmit = async (values) => {
    try {
      const endpoint = editingTunnel ? '/update_tunnel' : '/create_tunnel';

      // 将表单字段映射为API需要的字段
      const porttype = String(values.type || '').toLowerCase();
      const nodeName = (() => {
        const match = nodes.find(n => n.id === values.node);
        return match ? match.name : values.node;
      })();

      const base = {
        tunnelname: values.name,
        node: nodeName,
        localip: values.localip,
        porttype: porttype,
        localport: Number(values.localport),
        encryption: false,
        compression: false
      };

      if (porttype === 'tcp' || porttype === 'udp') {
        base.remoteport = Number(values.remoteport);
      }
      if (porttype === 'http' || porttype === 'https') {
        base.banddomain = values.banddomain;
      }

      const payload = editingTunnel ? { tunnelid: editingTunnel.id, ...base } : base;

      // 后台触发一次CNAME同步（不阻塞提交流程）
      if ((porttype === 'http' || porttype === 'https') && values.banddomain) {
        console.log('🔄 正在后台同步域名CNAME配置:', values.banddomain, '-> 节点:', values.node);
        try {
          // 非阻塞执行
          // eslint-disable-next-line no-unused-vars
          const _ = syncDomainConfiguration(values.banddomain, values);
        } catch (err) {
          console.error('❌ 同步域名配置失败:', err);
        }
      }

      const response = await axios.post(endpoint, payload);
      if (response.data.code === 200) {
        message.success(editingTunnel ? '更新成功' : '创建成功');
        
        // 同步逻辑已在提交前后台触发，这里不再阻塞
        
        setModalVisible(false);
        loadTunnels();
        
        // 已移除自动同步，启用/停用即实时生效
      } else {
        message.error(response.data.msg || '操作失败');
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      online: { color: 'green', text: '在线' },
      offline: { color: 'red', text: '离线' },
      connecting: { color: 'orange', text: '连接中' }
    };
    const config = statusMap[status] || { color: 'default', text: '未知' };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '隧道名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const typeMap = {
          tcp: 'TCP',
          udp: 'UDP',
          http: 'HTTP',
          https: 'HTTPS'
        };
        return typeMap[type?.toLowerCase()] || type;
      }
    },
    {
      title: '本地地址',
      key: 'local',
      render: (_, record) => `${record.localip || 'N/A'}:${record.nport || 'N/A'}`
    },
    {
      title: '远程地址',
      key: 'remote',
      render: (_, record) => {
        if (record.type === 'https' || record.type === 'http') {
          return record.dorp ? `${record.dorp}` : 'N/A';
        }
        // TCP/UDP类型显示 服务器IP:远程端口
        return `${record.ip}:${record.dorp}`;
      }
    },
    {
      title: '节点',
      dataIndex: 'node',
      key: 'node',
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record) => {
        const isLocallyActive = activeTunnelIds.has(record.id);
        const nodeOnline = record.nodestate === 'online';
        
        if (isLocallyActive && nodeOnline) {
          return <Tag color="green">运行中</Tag>;
        } else if (isLocallyActive && !nodeOnline) {
          return <Tag color="orange">节点离线</Tag>;
        } else {
          return <Tag color="default">未启用</Tag>;
        }
      }
    },
    {
      title: '流量统计',
      key: 'traffic',
      render: (_, record) => (
        <div style={{ fontSize: '12px' }}>
          <div>↓ {(record.today_traffic_in / 1024 / 1024).toFixed(2)} MB</div>
          <div>↑ {(record.today_traffic_out / 1024 / 1024).toFixed(2)} MB</div>
        </div>
      )
    },
    {
      title: '连接数',
      dataIndex: 'cur_conns',
      key: 'cur_conns',
      render: (conns) => conns || 0
    },
    {
      title: '开机自启',
      key: 'autostart',
      render: (_, record) => (
        <Switch
          checked={autostartTunnels.has(record.id)}
          loading={autostartLoading === record.id}
          onChange={(checked) => handleAutostartToggle(record.id, checked)}
          size="small"
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Tooltip title={activeTunnelIds.has(record.id) ? '停用隧道' : '启用隧道'}>
            <Button
              type="link"
              icon={activeTunnelIds.has(record.id) ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={() => toggleTunnelState(record.id)}
              style={{ color: activeTunnelIds.has(record.id) ? '#ff4d4f' : '#52c41a' }}
            >
              {activeTunnelIds.has(record.id) ? '停用' : '启用'}
            </Button>
          </Tooltip>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个隧道吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 计算实际活跃的隧道数量（基于本地FRP进程状态）
  const activeLocalTunnels = activeTunnelIds.size;
  const isRunning = frpStatus?.isRunning;

  return (
    <div>
      {/* FRP状态提示 */}
      <Alert
        message={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Space>
                <span>FRP客户端状态:</span>
                {isRunning ? (
                  <Tag color="green" icon={<CheckCircleOutlined />}>运行中</Tag>
                ) : (
                  <Tag color="red" icon={<ExclamationCircleOutlined />}>未运行</Tag>
                )}
                <span>活跃隧道: {activeLocalTunnels}/{tunnels.length}</span>
              </Space>
            </div>
            <Space>
              <Button 
                size="small" 
                icon={<FileTextOutlined />}
                onClick={handleShowLogs}
                title="查看FRP日志"
              >
                日志
              </Button>
              <Button 
                size="small" 
                icon={<RedoOutlined />}
                onClick={handleRestartFrp}
                loading={restartLoading}
                title="重启FRP客户端"
              >
                重启
              </Button>
              <span style={{ color: '#999' }}>提示：启用/停用即实时生效</span>
            </Space>
          </div>
        }
        type={isRunning ? "success" : "warning"}
        style={{ marginBottom: '16px' }}
        showIcon
      />

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              <GlobalOutlined /> 隧道管理
            </Title>
          </div>
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={loadTunnels}
              loading={loading}
            >
              刷新
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleCreate}
            >
              创建隧道
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={tunnels}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      <Modal
        title={editingTunnel ? '编辑隧道' : '创建隧道'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="隧道名称"
            rules={[{ required: true, message: '请输入隧道名称' }]}
          >
            <Input placeholder="输入隧道名称" />
          </Form.Item>

          <Form.Item shouldUpdate noStyle>
            {() => {
              const currentType = form.getFieldValue('type');
              const isEditing = !!editingTunnel;
              const originalType = editingTunnel?.type;
              
              // 如果是编辑状态，限制类型切换
              const getDisabledOptions = () => {
                if (!isEditing || !originalType) return [];
                
                // TCP/UDP 不能切换到 HTTP/HTTPS
                if ((originalType === 'tcp' || originalType === 'udp')) {
                  return ['http', 'https'];
                }
                // HTTP/HTTPS 不能切换到 TCP/UDP
                if ((originalType === 'http' || originalType === 'https')) {
                  return ['tcp', 'udp'];
                }
                return [];
              };
              
              const disabledOptions = getDisabledOptions();
              
              return (
                <Form.Item
                  name="type"
                  label="协议类型"
                  rules={[{ required: true, message: '请选择协议类型' }]}
                  extra={isEditing && disabledOptions.length > 0 ? 
                    `编辑时不能在 ${originalType === 'tcp' || originalType === 'udp' ? 'TCP/UDP' : 'HTTP/HTTPS'} 之间切换到 ${originalType === 'tcp' || originalType === 'udp' ? 'HTTP/HTTPS' : 'TCP/UDP'}` : 
                    null
                  }
                >
                  <Select placeholder="选择协议类型">
                    <Option value="tcp" disabled={disabledOptions.includes('tcp')}>TCP</Option>
                    <Option value="udp" disabled={disabledOptions.includes('udp')}>UDP</Option>
                    <Option value="http" disabled={disabledOptions.includes('http')}>HTTP</Option>
                    <Option value="https" disabled={disabledOptions.includes('https')}>HTTPS</Option>
                  </Select>
                </Form.Item>
              );
            }}
          </Form.Item>

          <Form.Item
            name="localip"
            label="本地IP"
            rules={[{ required: true, message: '请输入本地IP地址' }]}
            extra={
              <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
                <div>🔸 请使用192.168.x.x格式的局域网IP，切勿使用127.0.0.1</div>
                <div>🔸 获取本机IP方法：</div>
                <div style={{ marginLeft: '12px' }}>
                  <div>• Windows: 运行 <code>ipconfig</code> 查看IPv4地址</div>
                  <div>• Linux/Mac: 运行 <code>ip addr show</code> 或 <code>ifconfig</code></div>
                  <div>• 或直接查看路由器管理界面中的设备列表</div>
                </div>
                <div>🔸 Docker环境推荐使用主机局域网IP地址</div>
              </div>
            }
          >
            <Input placeholder="例如：192.168.1.100 (请输入您的实际局域网IP)" />
          </Form.Item>

          <Form.Item
            name="localport"
            label="内网端口"
            rules={[{ required: true, message: '请输入内网端口' }]}
          >
            <Input placeholder="如：8080" type="number" />
          </Form.Item>

          <Form.Item shouldUpdate noStyle>
            {() => {
              const currentType = form.getFieldValue('type');
              
              if (currentType === 'http' || currentType === 'https') {
                // HTTP/HTTPS 显示域名选择框
                // 过滤掉中文域名
                const filteredFreeSubdomains = freeSubdomains.filter(domain => 
                  !isChinese(domain.domain) && !isChinese(domain.record)
                );
                const filteredCustomDomains = customDomains.filter(domain => 
                  !isChinese(domain.domain)
                );

                const allDomains = [
                  ...filteredFreeSubdomains.map(domain => {
                    // 构建完整的免费二级域名: record.domain
                    const fullDomain = `${domain.record}.${domain.domain}`;
                    return {
                      value: fullDomain,
                      label: `${fullDomain} (免费二级域名)`,
                      type: 'free',
                      data: domain
                    };
                  }),
                  ...filteredCustomDomains.map(domain => ({
                    value: domain.domain,
                    label: `${domain.domain} (自定义域名)`,
                    type: 'custom',
                    data: domain
                  }))
                ];

                console.log('所有可用域名:', allDomains);
                console.log('免费二级域名数据:', freeSubdomains);
                console.log('自定义域名数据:', customDomains);

                return (
                  <Form.Item
                    name="banddomain"
                    label="绑定域名"
                    rules={[{ required: true, message: '请选择绑定域名' }]}
                    help="选择您的免费二级域名或自定义域名"
                  >
                    <Select 
                      placeholder="选择域名" 
                      loading={domainsLoading}
                      showSearch
                      filterOption={(input, option) =>
                        option?.label?.toLowerCase().includes(input.toLowerCase())
                      }
                      notFoundContent={domainsLoading ? <Spin size="small" /> : '暂无可用域名'}
                    >
                      {allDomains.map(domain => (
                        <Option key={domain.value} value={domain.value} label={domain.label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{domain.value}</span>
                            <Tag color={domain.type === 'free' ? 'blue' : 'green'} size="small">
                              {domain.type === 'free' ? '免费' : '自定义'}
                            </Tag>
                          </div>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                );
              } else if (currentType === 'tcp' || currentType === 'udp') {
                // TCP/UDP 显示外网端口
                return (
                  <Form.Item
                    name="remoteport"
                    label="外网端口"
                    rules={[{ required: true, message: '请输入外网端口' }]}
                  >
                    <Input placeholder="如：20247" type="number" />
                  </Form.Item>
                );
              }
              
              return null;
            }}
          </Form.Item>

          <Form.Item
            name="node"
            label="节点"
            rules={[{ required: true, message: '请选择节点' }]}
          >
            <Select 
              placeholder="选择节点" 
              showSearch
              filterOption={(input, option) =>
                option?.label?.toLowerCase().includes(input.toLowerCase())
              }
              dropdownStyle={{ maxHeight: '400px', overflow: 'auto' }}
              optionLabelProp="label"
            >
              {nodes.map(node => {
                const isOnline = node.state === 'online';
                const isVip = node.nodegroup === 'vip';
                const canBuildSite = node.web === 'yes';
                const usage = node.bandwidth_usage_percent || 0;
                
                return (
                  <Option 
                    key={node.id} 
                    value={node.id}
                    label={`${node.name} - ${node.area}`}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '4px 0',
                      maxWidth: '100%',
                      overflow: 'hidden'
                    }}>
                      <div style={{ flex: 1, minWidth: 0, marginRight: '8px' }}>
                        <div style={{ 
                          fontWeight: 'bold', 
                          marginBottom: '2px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {node.name}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#666',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {node.area} • 负载: {usage}%
                        </div>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        gap: '4px', 
                        alignItems: 'center',
                        flexShrink: 0
                      }}>
                        <Tag 
                          color={isOnline ? 'green' : 'red'} 
                          size="small"
                        >
                          {isOnline ? '在线' : '离线'}
                        </Tag>
                        {isVip && (
                          <Tag color="gold" size="small">
                            VIP
                          </Tag>
                        )}
                        {canBuildSite && (
                          <Tag color="blue" size="small">
                            建站
                          </Tag>
                        )}
                      </div>
                    </div>
                  </Option>
                );
              })}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingTunnel ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* FRP日志模态框 */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            FRP客户端日志
          </Space>
        }
        open={logModalVisible}
        onCancel={() => setLogModalVisible(false)}
        footer={[
          <Button key="refresh" icon={<ReloadOutlined />} onClick={handleShowLogs} loading={logsLoading}>
            刷新日志
          </Button>,
          <Button key="clear" icon={<ClearOutlined />} onClick={handleClearLogs} loading={clearLogsLoading} danger>
            清理日志
          </Button>,
          <Button key="close" onClick={() => setLogModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
        style={{ top: 20 }}
      >
        <div style={{ 
          backgroundColor: '#1f1f1f', 
          color: '#ffffff', 
          padding: '12px', 
          borderRadius: '4px',
          fontFamily: 'Consolas, "Courier New", monospace',
          fontSize: '12px',
          lineHeight: '1.4',
          maxHeight: '500px',
          overflowY: 'auto'
        }}>
          {logsLoading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin />
              <div style={{ marginTop: '8px', color: '#999' }}>加载日志中...</div>
            </div>
          ) : (
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {frpLogs || '暂无日志'}
            </pre>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default TunnelManagement;

