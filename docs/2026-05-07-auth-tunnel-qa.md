# 2026-05-07 认证与隧道测试记录

## 测试范围
- OAuth access token 刷新
- `/userinfo` 认证校验
- `/node`、`/tunnel` 读取
- `/create_tunnel` 创建
- `/delete_tunnel` 删除

## 测试命令
- `POST https://account-api.qzhua.net/oauth2/token`，使用 `refresh_token` 刷新 access token
- `GET http://cf-v2.uapis.cn/userinfo`，使用 `Authorization: Bearer <access_token>`
- `GET http://cf-v2.uapis.cn/node`
- `GET http://cf-v2.uapis.cn/tunnel`
- `POST http://cf-v2.uapis.cn/create_tunnel`
- `POST http://cf-v2.uapis.cn/delete_tunnel?tunnelid=...`

## 结果
- access token 刷新成功
- `userinfo` 读取成功，返回 `usertoken`
- `node`、`tunnel` 读取成功
- 使用 `Authorization: Bearer <access_token>` 创建临时隧道成功
- 临时隧道已删除，复查列表确认清理完成

## 结论
- 新版认证链路可用
- 创建/删除隧道需要走 `access_token`，不能再优先使用旧 `usertoken`
