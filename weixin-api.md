# stuFamily Weixin API 文档

## 1. 通用说明

- 基础路径：`/api/weixin`
- 返回包裹结构：
  - `success`：是否成功
  - `code`：业务码（成功为 `OK`）
  - `message`：提示信息
  - `data`：业务数据
- 鉴权方式：`Authorization: Bearer {accessToken}`
- 免鉴权接口：
  - `POST /api/weixin/auth/login`
  - `POST /api/weixin/pay/notify`
  - `GET /api/weixin/home/index`
  - `GET /api/weixin/home/products`
  - `GET /api/weixin/home/products/{productId}`
- 全局重放限制：
  - GET：200ms 内同键重复请求返回 `429`（`TOO_MANY_REQUESTS`）
  - POST/PUT/DELETE：2s 内同键重复请求返回 `429`（`TOO_MANY_REQUESTS`）

## 2. 错误码说明

- `INVALID_PARAM`：参数校验失败或参数格式错误
- `UNAUTHORIZED`：未登录或 token 无效
- `FORBIDDEN`：无权限访问
- `BUSINESS_RULE_VIOLATION`：业务规则不满足
- `USER_NOT_FOUND`：用户不存在
- `LOGIN_FAILED`：登录失败
- `TOO_MANY_REQUESTS`：请求过于频繁
- `SERVER_ERROR`：服务端异常

---

## 3. 认证接口

### 3.1 微信登录

- 方法/路径：`POST /api/weixin/auth/login`
- 说明：使用微信 `code` 登录，返回小程序端 JWT。
- 鉴权：否

请求体：

| 字段 | 类型 | 必填 | 中文说明 |
| --- | --- | --- | --- |
| `code` | string | 是 | 微信登录 code |
| `nickname` | string | 否 | 微信昵称（首次/更新时可传） |
| `avatarUrl` | string | 否 | 微信头像 URL（首次/更新时可传） |

`data` 返回字段（`LoginResult`）：

| 字段 | 类型 | 中文说明 |
| --- | --- | --- |
| `userId` | long | 用户 ID |
| `accessToken` | string | JWT 访问令牌 |
| `tokenType` | string | 令牌类型（固定 `Bearer`） |
| `username` | string | 展示用户名 |
| `roles` | string[] | 角色列表（微信端通常为 `WECHAT`） |

### 3.2 更新当前微信用户资料

- 方法/路径：`PUT /api/weixin/auth/profile`
- 说明：当前登录用户更新昵称和手机号。
- 鉴权：是（`WECHAT` 或 `ADMIN`）

请求体：

| 字段 | 类型 | 必填 | 中文说明 |
| --- | --- | --- | --- |
| `nickname` | string | 是 | 昵称，最大 64 字符 |
| `phone` | string | 是 | 手机号，格式 `^1\\d{10}$`（11 位中国大陆手机号） |

`data` 返回字段（`WechatUserProfileView`）：

| 字段 | 类型 | 中文说明 |
| --- | --- | --- |
| `userId` | long | 用户 ID |
| `nickname` | string | 更新后的昵称 |
| `phone` | string | 更新后的手机号 |
| `avatarUrl` | string | 当前头像 URL |

---

## 4. 首页与商品

### 4.1 首页信息

- 方法/路径：`GET /api/weixin/home/index`
- 说明：返回首页轮播、轮播标语、站点信息和首页通知。
- 鉴权：否

`data` 返回字段（`HomePageView`）：

| 字段 | 类型 | 中文说明 |
| --- | --- | --- |
| `banners` | `BannerView[]` | 轮播图列表 |
| `bannerSlogan` | string | 轮播标语 |
| `siteProfile` | `SiteProfileView` | 站点信息 |
| `notices` | `NoticeView[]` | 首页通知列表（按优先级降序；无通知时为空数组） |

`BannerView`：

| 字段 | 类型 | 中文说明 |
| --- | --- | --- |
| `id` | long | 轮播图 ID |
| `title` | string | 标题 |
| `imageUrl` | string | 图片地址 |

`SiteProfileView`：

| 字段 | 类型 | 中文说明 |
| --- | --- | --- |
| `communityName` | string | 社区/民宿名称 |
| `introText` | string | 简介 |
| `contactPerson` | string | 联系人 |
| `contactPhone` | string | 联系电话 |
| `contactWechat` | string | 微信号 |
| `contactWechatQrUrl` | string | 微信二维码图片地址 |
| `address` | string | 地址 |
| `latitude` | number | 纬度 |
| `longitude` | number | 经度 |

`NoticeView`：

| 字段 | 类型 | 中文说明 |
| --- | --- | --- |
| `title` | string | 通知主标题（最长 50 字） |
| `content` | string | 通知内容（可为空） |

### 4.2 商品列表

- 方法/路径：`GET /api/weixin/home/products`
- 说明：按销售日期窗口查询可展示商品。
- 鉴权：否

查询参数：

| 参数 | 类型 | 必填 | 格式 | 中文说明 |
| --- | --- | --- | --- | --- |
| `sale_start_at` | string | 是 | `yyyy-MM-dd` | 查询开始日期 |
| `sale_end_at` | string | 是 | `yyyy-MM-dd` | 查询结束日期 |

注意：代码中此两参数业务上必填，缺失或非法会返回 `INVALID_PARAM`。

`data` 返回字段：`HomeProductView[]`

| 字段 | 类型 | 中文说明 |
| --- | --- | --- |
| `id` | long | 商品 ID |
| `type` | string | 商品类型（`FAMILY_CARD` / `VALUE_ADDED_SERVICE`） |
| `title` | string | 商品标题 |
| `priceCents` | long | 价格（分） |
| `top` | boolean | 是否置顶 |
| `publishStatus` | string | 发布状态（通常为 `ON_SHELF`） |

### 4.3 商品详情

- 方法/路径：`GET /api/weixin/home/products/{productId}`
- 说明：查询商品详情；若商品未上架或不在销售期内，返回业务异常。
- 鉴权：否

路径参数：

| 参数 | 类型 | 必填 | 中文说明 |
| --- | --- | --- | --- |
| `productId` | long | 是 | 商品 ID |

`data` 返回字段（`HomeProductDetailView`）：

| 字段 | 类型 | 中文说明 |
| --- | --- | --- |
| `id` | long | 商品 ID |
| `productNo` | string | 商品编号 |
| `type` | string | 商品类型 |
| `title` | string | 标题 |
| `subtitle` | string | 副标题 |
| `detailContent` | string | 商品详情说明 |
| `imageUrls` | string[] | 商品图片 URL 列表 |
| `contactName` | string | 联系人 |
| `contactPhone` | string | 联系电话 |
| `serviceStartAt` | string(datetime) | 服务开始时间（ISO-8601） |
| `serviceEndAt` | string(datetime) | 服务结束时间（ISO-8601） |
| `saleStartAt` | string(datetime) | 销售开始时间（ISO-8601） |
| `saleEndAt` | string(datetime) | 销售结束时间（ISO-8601） |
| `publishStatus` | string | 发布状态 |
| `deleted` | boolean | 是否删除 |
| `top` | boolean | 是否置顶 |
| `displayPriority` | int | 展示优先级 |
| `listVisibilityRuleId` | long | 列表可见规则 ID |
| `detailVisibilityRuleId` | long | 详情可见规则 ID |
| `categoryId` | long | 分类 ID |
| `familyCardPlans` | `FamilyCardPlanView[]` | 家庭卡套餐列表 |
| `valueAddedSkus` | `ValueAddedSkuView[]` | 增值服务 SKU 列表 |

`FamilyCardPlanView`：

| 字段 | 类型 | 中文说明 |
| --- | --- | --- |
| `id` | long | 套餐 ID |
| `durationType` | string | 时长类型（`MONTH`/`SEMESTER`/`YEAR`） |
| `durationMonths` | int | 时长（月） |
| `priceCents` | long | 价格（分） |
| `maxFamilyMembers` | int | 最大可添加家人数 |
| `enabled` | boolean | 是否启用 |

`ValueAddedSkuView`：

| 字段 | 类型 | 中文说明 |
| --- | --- | --- |
| `id` | long | SKU ID |
| `title` | string | SKU 标题 |
| `priceCents` | long | 价格（分） |
| `enabled` | boolean | 是否启用 |

### 4.4 提交家长留言（我的）

- 方法/路径：`POST /api/weixin/home/messages`
- 说明：当前登录用户提交留言；留言无需审核，提交后即为本人可见。
- 鉴权：是（`WECHAT` 或 `ADMIN`）

请求体：

| 字段 | 类型 | 必填 | 中文说明 |
| --- | --- | --- | --- |
| `content` | string | 是 | 留言内容，最大 500 字符 |

`data` 返回字段（`ParentMessageView`）：

| 字段 | 类型 | 中文说明 |
| --- | --- | --- |
| `id` | long | 留言 ID |
| `nickname` | string | 昵称快照 |
| `avatarUrl` | string | 头像快照 URL |
| `content` | string | 留言内容 |
| `createdAt` | string(datetime) | 创建时间（ISO-8601） |
| `replies` | `ParentMessageReplyView[]` | 当前留言下的回复列表（按时间升序） |

`ParentMessageReplyView`：

| 字段 | 类型 | 中文说明 |
| --- | --- | --- |
| `id` | long | 回复 ID |
| `senderType` | string | 发送者类型（`ADMIN` / `USER`） |
| `nickname` | string | 回复人昵称快照 |
| `avatarUrl` | string | 回复人头像快照 URL |
| `content` | string | 回复内容 |
| `createdAt` | string(datetime) | 回复时间（ISO-8601） |

### 4.5 查询我的留言列表

- 方法/路径：`GET /api/weixin/home/messages/mine`
- 说明：仅返回当前登录用户自己的留言，其他用户不可见；每条留言会包含管理员回复记录。
- 鉴权：是（`WECHAT` 或 `ADMIN`）

查询参数：

| 参数 | 类型 | 必填 | 中文说明 |
| --- | --- | --- | --- |
| `page_no` | int | 否 | 页码，默认 1 |
| `page_size` | int | 否 | 每页条数，默认 20，最大 200 |

返回：`data` 为分页结构
- `items`：`ParentMessageView[]`
- `total`、`pageNo`、`pageSize`、`totalPages`

---

## 5. 订单与支付

### 5.1 创建订单

- 方法/路径：`POST /api/weixin/orders/create`
- 说明：创建待支付订单并返回微信支付参数。
- 鉴权：是（`WECHAT` 或 `ADMIN`）

请求体：

| 字段 | 类型 | 必填 | 中文说明 |
| --- | --- | --- | --- |
| `productType` | string | 是 | 商品类型（`FAMILY_CARD` / `VALUE_ADDED_SERVICE`） |
| `productId` | long | 是 | 商品 ID |
| `skuId` | long | 条件必填 | 增值服务 SKU ID，当 `productType=VALUE_ADDED_SERVICE` 时建议传入，用于精确下单指定 SKU |
| `durationType` | string | 条件必填 | 家庭卡时长类型（`MONTH`/`SEMESTER`/`YEAR`），当 `productType=FAMILY_CARD` 必填 |
| `cardApplyDate` | string | 条件必填 | 卡片申请日期，格式 `yyyy-MM-dd`，当 `productType=FAMILY_CARD` 必填 |
| `applicantName` | string | 条件必填 | 申请人姓名，当 `productType=FAMILY_CARD` 必填 |
| `applicantStudentOrCardNo` | string | 条件必填 | 申请人学号/卡号，当 `productType=FAMILY_CARD` 必填 |
| `applicantPhone` | string | 条件必填 | 申请人手机号（11位中国大陆手机号），当 `productType=FAMILY_CARD` 必填 |
| `amountCents` | long | 是 | 支付金额（分，最小 1） |

`data` 返回字段（`OrderCreateResult`）：

| 字段 | 类型 | 中文说明 |
| --- | --- | --- |
| `orderNo` | string | 订单号 |
| `status` | string | 订单状态（创建后通常 `PENDING_PAYMENT`） |
| `payableAmountCents` | long | 应付金额（分） |
| `payParams` | `WechatPayCreateResponse` | 微信支付拉起参数 |

`WechatPayCreateResponse`：

| 字段 | 类型 | 中文说明 |
| --- | --- | --- |
| `prepayId` | string | 微信预支付 ID |
| `nonceStr` | string | 随机串 |
| `paySign` | string | 支付签名 |
| `timeStamp` | string | 时间戳 |

### 5.2 查询订单状态

- 方法/路径：`GET /api/weixin/orders/{orderNo}/status`
- 说明：查询订单状态字符串。
- 鉴权：是（`WECHAT` 或 `ADMIN`）

路径参数：

| 参数 | 类型 | 必填 | 中文说明 |
| --- | --- | --- | --- |
| `orderNo` | string | 是 | 订单号 |

`data`：string，可能值包括：
- `PENDING_PAYMENT`
- `PAID`
- `CANCELLED`
- `EXPIRED`
- `REFUNDED`

### 5.3 查询我的已购商品列表

- 方法/路径：`GET /api/weixin/orders/purchased-products`
- 说明：查询当前登录用户已支付成功（`PAID`）的已购订单列表（按订单维度每个 `orderNo` 仅返回一条），支持分页和商品类型筛选。
- 鉴权：是（`WECHAT` 或 `ADMIN`）

查询参数：

| 参数 | 类型 | 必填 | 中文说明 |
| --- | --- | --- | --- |
| `product_type` | string | 否 | 商品类型过滤：`FAMILY_CARD` / `VALUE_ADDED_SERVICE`；不传则返回全部 |
| `page_no` | int | 否 | 页码，默认 1 |
| `page_size` | int | 否 | 每页条数，默认 20，最大 200 |

`data` 返回字段：
- `items`：`PurchasedProductView[]`
- `total`、`pageNo`、`pageSize`、`totalPages`

`PurchasedProductView` 字段：

| 字段 | 类型 | 中文说明 |
| --- | --- | --- |
| `orderNo` | string | 订单号 |
| `orderType` | string | 订单类型（`FAMILY_CARD` / `VALUE_ADDED_SERVICE`） |
| `orderStatus` | string | 订单状态（固定为 `PAID`） |
| `paidAt` | string(datetime) | 支付时间 |
| `productId` | long | 商品 ID |
| `productType` | string | 商品类型 |
| `productTitle` | string | 商品名称快照 |
| `productBrief` | string | 商品简介快照 |
| `productImageUrls` | string | 商品图片 JSON 字符串 |
| `selectedDurationType` | string | 购买时长类型（家庭卡可能为 `MONTH`/`SEMESTER`/`YEAR`） |
| `selectedDurationMonths` | int | 购买时长（月） |
| `serviceStartAt` | string(datetime) | 服务开始时间 |
| `serviceEndAt` | string(datetime) | 服务结束时间 |
| `unitPriceCents` | long | 单价（分） |
| `quantity` | int | 数量 |
| `totalPriceCents` | long | 小计金额（分） |
| `reviewStars` | int | 服务评分（1-5），未评价时为 `null` |
| `reviewContent` | string | 文字评价内容，未评价时为 `null` |
| `reviewedAt` | string(datetime) | 评价更新时间（ISO-8601），未评价时为 `null` |

### 5.4 提交服务评价

- 方法/路径：`POST /api/weixin/orders/{orderNo}/review`
- 说明：当前登录用户对自己已支付订单提交服务评价；同一订单重复提交会覆盖更新原评价。
- 鉴权：是（`WECHAT` 或 `ADMIN`）

路径参数：

| 参数 | 类型 | 必填 | 中文说明 |
| --- | --- | --- | --- |
| `orderNo` | string | 是 | 订单号 |

请求体：

| 字段 | 类型 | 必填 | 中文说明 |
| --- | --- | --- | --- |
| `stars` | int | 是 | 星级评分，范围 `1~5` |
| `content` | string | 是 | 文字评价，最大 500 字符 |

返回：`data=null`

### 5.5 微信支付回调通知

- 方法/路径：`POST /api/weixin/pay/notify`
- 说明：支付成功回调，标记订单为已支付，并在家庭卡场景自动开通家庭组；会基于微信支付 SDK 校验回调签名和报文合法性。对于家庭卡订单，会将下单时的申请表单信息（姓名/学号卡号/手机号/申请日期）自动写入家人卡记录作为首位成员。
- 鉴权：否（由微信服务端调用）

请求体（生产回调）：

- `Content-Type: application/xml`（或 `text/xml`）
- 报文：微信支付回调 XML 原文（含签名字段）

返回（生产回调）：
- 成功：`<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>`
- 失败：`<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[FAIL]]></return_msg></xml>`

请求体（本地/联调用 mock，`Content-Type: application/json`）：

| 字段 | 类型 | 必填 | 中文说明 |
| --- | --- | --- | --- |
| `outTradeNo` | string | 是 | 商户订单号（本系统订单号） |
| `transactionId` | string | 是 | 微信支付交易号 |
| `totalAmountCents` | long | 是 | 支付金额（分，最小 1） |

mock 返回：`data=null`（仅当 `app.wechat.pay.mock-notify-enabled=true` 时可用）

---

## 6. 家庭成员管理

### 6.1 新增家庭成员

- 方法/路径：`POST /api/weixin/family/members`
- 说明：在当前登录用户有效家庭组下新增家人。
- 鉴权：是（`WECHAT` 或 `ADMIN`）

请求体：

| 字段 | 类型 | 必填 | 中文说明 |
| --- | --- | --- | --- |
| `groupNo` | string | 否 | 家庭组编号；传入时将新增到指定有效家庭组，不传则默认使用最新有效家庭组 |
| `memberName` | string | 是 | 家人姓名 |
| `studentOrCardNo` | string | 是 | 学号/卡号 |
| `phone` | string | 是 | 手机号 |
| `joinedAt` | string(datetime) | 是 | 加入时间（格式：`yyyy-MM-dd'T'HH:mm:ss`，例如 `2026-03-27T00:00:00`） |

`data` 返回字段（`FamilyMemberView`）：

| 字段 | 类型 | 中文说明 |
| --- | --- | --- |
| `memberNo` | string | 家人编号 |
| `memberName` | string | 家人姓名 |
| `studentOrCardNo` | string | 学号/卡号 |
| `phone` | string | 手机号 |
| `joinedAt` | string(datetime) | 加入时间 |
| `status` | string | 状态（`ACTIVE`/`EXPIRED`/`CANCELLED`） |
| `familyGroupExpireAt` | string(datetime) | 家庭组过期时间 |
| `wechatAvatarUrl` | string | 微信头像（归属用户头像） |

### 6.2 家庭卡打卡

- 方法/路径：`POST /api/weixin/family/check-ins`
- 说明：仅当当前用户在家庭卡有效期内时可打卡，记录经纬度、地址和打卡时间；同一用户 5 分钟内最多打卡 1 次。
- 鉴权：是（`WECHAT` 或 `ADMIN`）

请求体：

| 字段 | 类型 | 必填 | 中文说明 |
| --- | --- | --- | --- |
| `groupNo` | string | 否 | 家庭组编号；传入时校验该组在 `checkedInAt` 时刻有效，不传则默认使用该时刻最新有效家庭组 |
| `familyMemberId` | long | 否 | 家庭成员 ID；传入后打卡将关联到该成员，并校验该成员归属当前用户且在 `checkedInAt` 时刻有效 |
| `latitude` | number | 是 | 纬度，范围 `[-90, 90]` |
| `longitude` | number | 是 | 经度，范围 `[-180, 180]` |
| `addressText` | string | 是 | 打卡地址，最大 255 字符 |
| `checkedInAt` | string(datetime) | 是 | 打卡时间（格式：`yyyy-MM-dd'T'HH:mm:ss`，例如 `2026-03-31T09:00:00`） |

说明：
- 当前登录用户 ID（`userId`）由 token 自动获取并关联打卡记录，不需要前端单独传。
- 若传 `familyMemberId`，会额外建立“成员打卡”关联。

`data` 返回字段（`FamilyCheckInView`）：

| 字段 | 类型 | 中文说明 |
| --- | --- | --- |
| `checkinNo` | string | 打卡编号 |
| `groupNo` | string | 家庭组编号 |
| `checkinUserId` | long | 打卡用户 ID（当前登录用户） |
| `familyMemberId` | long | 关联的家庭成员 ID（未传时为 `null`） |
| `latitude` | number | 纬度 |
| `longitude` | number | 经度 |
| `addressText` | string | 打卡地址 |
| `checkedInAt` | string(datetime) | 打卡时间 |

### 6.3 查询家庭成员列表

- 方法/路径：`GET /api/weixin/family/members`
- 说明：查询当前用户家庭组下的成员，支持关键字过滤 + 分页（小程序下拉加载）。
- 鉴权：是（`WECHAT` 或 `ADMIN`）

查询参数：

| 参数 | 类型 | 必填 | 中文说明 |
| --- | --- | --- | --- |
| `group_no` | string | 否 | 指定家庭组编号；不传则查询当前用户所有有效家庭组的成员 |
| `keyword` | string | 否 | 关键字，匹配 `memberName` / `studentOrCardNo` / `phone` / `memberNo` / 归属用户昵称 |
| `page_no` | int | 否 | 页码，默认 1 |
| `page_size` | int | 否 | 每页条数，默认 20，最大 200 |

返回：`data` 为分页结构
- `items`：`FamilyMemberView[]`
- `total`、`pageNo`、`pageSize`、`totalPages`
- `items[].familyGroupExpireAt`：家庭组过期时间
- `items[].wechatAvatarUrl`：归属微信用户头像

返回示例：

```json
{
  "success": true,
  "code": "OK",
  "message": "success",
  "data": {
    "items": [
      {
        "memberNo": "M202603260001",
        "memberName": "张三",
        "studentOrCardNo": "20260001",
        "phone": "13800138000",
        "joinedAt": "2026-03-26T10:00:00+08:00",
        "status": "ACTIVE",
        "familyGroupExpireAt": "2026-09-01T00:00:00+08:00",
        "wechatAvatarUrl": "https://wx.qlogo.cn/mmopen/xxx/132"
      }
    ],
    "total": 1,
    "pageNo": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

### 6.4 注销家庭成员卡

- 方法/路径：`DELETE /api/weixin/family/members/{memberNo}`
- 说明：将成员卡状态置为 `CANCELLED`。
- 鉴权：是（`WECHAT` 或 `ADMIN`）

路径参数：

| 参数 | 类型 | 必填 | 中文说明 |
| --- | --- | --- | --- |
| `memberNo` | string | 是 | 家人编号 |

返回：`data=null`

### 6.5 查询家庭组名额信息

- 方法/路径：`GET /api/weixin/family/group/quota`
- 说明：查询当前登录用户所有可用家庭组（剔除关闭和过期），并返回每个组的名额与套餐信息，供前端选择。
- 鉴权：是（`WECHAT` 或 `ADMIN`）

`data` 返回字段（`FamilyGroupQuotaView`）：

| 字段 | 类型 | 中文说明 |
| --- | --- | --- |
| `hasActiveGroup` | boolean | 是否存在有效家庭组 |
| `groups` | `GroupQuotaView[]` | 可用家庭组列表（按激活时间/创建时间倒序） |

`GroupQuotaView` 字段：

| 字段 | 类型 | 中文说明 |
| --- | --- | --- |
| `groupNo` | string | 家庭组编号 |
| `status` | string | 家庭组状态（固定 `ACTIVE`） |
| `expireAt` | string(datetime) | 家庭组到期时间 |
| `maxMembers` | int | 最大可添加人数 |
| `currentMembers` | int | 已添加人数 |
| `availableMembers` | int | 剩余可添加人数 |
| `productType` | string | 套餐商品类型（固定 `FAMILY_CARD`） |
| `productId` | long | 家庭卡商品 ID |
| `productTitle` | string | 家庭卡商品标题 |
| `planId` | long | 套餐计划 ID |
| `durationType` | string | 套餐时长类型（`MONTH`/`SEMESTER`/`YEAR`） |
| `durationMonths` | int | 套餐时长（月） |

---

## 7. 响应示例

成功示例：

```json
{
  "success": true,
  "code": "OK",
  "message": "success",
  "data": {}
}
```

失败示例：

```json
{
  "success": false,
  "code": "INVALID_PARAM",
  "message": "request validation failed",
  "data": null
}
```
