## 项目说明

1. 项目的架构说明、技术栈、基本启动/构建/校验操作见 `DOCS.md`。
2. 后端微信端接口信息见 `weixin-api.md`。
3. 本地开发可使用 mock 登录和模拟数据，无需依赖后端服务。

## 本地运行

**Prerequisites:** Node.js

1. 安装依赖：
   `npm install`
2. 启动开发服务：
   `npm run dev`
3. 默认访问地址：
   `http://localhost:3000`

## Mock 使用方式

启动开发服务后，访问以下地址即可进入 mock 模式：

```text
http://localhost:3000/?mock_login=1&mock_token=dev-token&mock_nickname=测试用户
```

mock 模式说明：

- `mock_login=1`：开启前端 mock 登录和模拟数据。
- `mock_token=dev-token`：写入本地登录 token，受保护页面可直接访问。
- `mock_nickname=测试用户`：设置模拟微信昵称。
- 页面会返回本地模拟数据，包括首页、商品、商品详情、家人列表、留言、订单和“我的”页面数据。
