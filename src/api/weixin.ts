export interface ApiResponse<T> {
  success: boolean;
  code: string;
  message: string;
  data: T;
}

export interface WeixinUserProfile {
  userId?: number;
  nickname: string;
  avatarUrl: string;
  phone?: string;
}

export interface UpdateWeixinProfileRequest {
  nickname: string;
  phone: string;
}

export interface WechatLoginRequest {
  code: string;
  nickname?: string;
  avatarUrl?: string;
}

export interface LoginResult {
  userId: number;
  accessToken: string;
  tokenType: string;
  username: string;
  roles: string[];
}

export interface BannerView {
  id: number;
  title: string;
  imageUrl: string;
}

export interface SiteProfileView {
  communityName: string;
  introText: string;
  contactPhone: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface HomePageView {
  banners: BannerView[];
  bannerSlogan: string;
  siteProfile: SiteProfileView;
}

export interface HomeProductView {
  id: number;
  type: 'FAMILY_CARD' | 'VALUE_ADDED_SERVICE' | string;
  title: string;
  priceCents: number;
  top: boolean;
  publishStatus: string;
}

export interface FamilyCardPlanView {
  id: number;
  durationType: 'MONTH' | 'SEMESTER' | 'YEAR' | string;
  durationMonths: number;
  priceCents: number;
  maxFamilyMembers: number;
  enabled: boolean;
}

export interface ValueAddedSkuView {
  id: number;
  title: string;
  priceCents: number;
  enabled: boolean;
}

export interface HomeProductDetailView {
  id: number;
  productNo: string;
  type: string;
  title: string;
  subtitle: string;
  detailContent: string;
  imageUrls: string[];
  contactName: string;
  contactPhone: string;
  serviceStartAt: string;
  serviceEndAt: string;
  saleStartAt: string;
  saleEndAt: string;
  publishStatus: string;
  deleted: boolean;
  top: boolean;
  displayPriority: number;
  listVisibilityRuleId: number;
  detailVisibilityRuleId: number;
  categoryId: number;
  familyCardPlans: FamilyCardPlanView[];
  valueAddedSkus: ValueAddedSkuView[];
}

export interface CreateParentMessageRequest {
  content: string;
}

export interface ParentMessageView {
  id: number;
  nickname: string;
  avatarUrl: string;
  content: string;
  createdAt: string;
  replies?: ParentMessageReplyView[];
}

export interface ParentMessageReplyView {
  id: number;
  senderType: 'ADMIN' | 'USER' | string;
  nickname: string;
  avatarUrl: string;
  content: string;
  createdAt: string;
}

export interface CreateOrderRequest {
  productType: 'FAMILY_CARD' | 'VALUE_ADDED_SERVICE' | string;
  productId: number;
  durationType?: 'MONTH' | 'SEMESTER' | 'YEAR' | string;
  amountCents: number;
}

export interface WechatPayCreateResponse {
  prepayId: string;
  nonceStr: string;
  paySign: string;
  timeStamp: string;
}

export interface OrderCreateResult {
  orderNo: string;
  status: string;
  payableAmountCents: number;
  payParams: WechatPayCreateResponse;
}

export interface PurchasedProductView {
  orderNo: string;
  orderType: 'FAMILY_CARD' | 'VALUE_ADDED_SERVICE' | string;
  orderStatus: string;
  paidAt: string;
  productId: number;
  productType: string;
  productTitle: string;
  productBrief?: string;
  productImageUrls?: string;
  selectedDurationType?: string;
  selectedDurationMonths?: number;
  serviceStartAt?: string;
  serviceEndAt?: string;
  unitPriceCents?: number;
  quantity?: number;
  totalPriceCents?: number;
}

export interface PayNotifyRequest {
  outTradeNo: string;
  transactionId: string;
  totalAmountCents: number;
}

export interface AddFamilyMemberRequest {
  memberName: string;
  studentOrCardNo: string;
  phone: string;
  joinedAt: string;
}

export interface FamilyMemberView {
  memberNo: string;
  memberName: string;
  studentOrCardNo: string;
  phone: string;
  joinedAt: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | string;
  familyGroupExpireAt?: string;
  wechatAvatarUrl?: string;
}

export interface FamilyGroupQuotaView {
  hasActiveGroup: boolean;
  groupNo: string | null;
  maxMembers: number;
  currentMembers: number;
  availableMembers: number;
  status: string | null;
  expireAt: string | null;
}

export interface PageResult<T> {
  items: T[];
  total: number;
  pageNo: number;
  pageSize: number;
  totalPages: number;
}

const configuredApiBase = (import.meta.env.VITE_WEIXIN_API_BASE as string | undefined)?.trim() || '';
const useSameOriginApi =
  !configuredApiBase
  || /^https?:\/\/localhost:8080\/api\/weixin\/?$/i.test(configuredApiBase);
const API_BASE = useSameOriginApi ? '/api/weixin' : configuredApiBase.replace(/\/+$/, '');

const TOKEN_KEY = 'weixin_access_token';
const USER_PROFILE_KEY = 'weixin_user_profile';
const AUTH_EXPIRED_EVENT = 'weixin-auth-expired';
const HOME_INDEX_CACHE_KEY = 'weixin_home_index_cache';
const PRODUCT_DETAIL_CACHE_KEY_PREFIX = 'weixin_product_detail_cache_';
const MOCK_FAMILY_MEMBERS_KEY = 'weixin_mock_family_members';
const MOCK_HOME_MESSAGES_KEY = 'weixin_mock_home_messages';
const MOCK_PURCHASED_PRODUCTS_KEY = 'weixin_mock_purchased_products';
const REPLAY_GUARD_TTL_MS = 1500;
const PRODUCT_DETAIL_INFLIGHT = new Map<number, Promise<HomeProductDetailView>>();
const HOME_PRODUCTS_INFLIGHT = new Map<string, Promise<HomeProductView[]>>();
const FAMILY_MEMBERS_INFLIGHT = new Map<string, Promise<PageResult<FamilyMemberView>>>();
const PURCHASED_PRODUCTS_INFLIGHT = new Map<string, Promise<PageResult<PurchasedProductView>>>();
const FAMILY_GROUP_QUOTA_INFLIGHT = new Map<string, Promise<FamilyGroupQuotaView>>();
const MY_HOME_MESSAGES_INFLIGHT = new Map<string, Promise<PageResult<ParentMessageView>>>();
const PURCHASED_PRODUCTS_CACHE = new Map<string, { data: PageResult<PurchasedProductView>; expiresAt: number }>();
const FAMILY_GROUP_QUOTA_CACHE = new Map<string, { data: FamilyGroupQuotaView; expiresAt: number }>();
const MY_HOME_MESSAGES_CACHE = new Map<string, { data: PageResult<ParentMessageView>; expiresAt: number }>();

export const getWeixinAccessToken = (): string | null => localStorage.getItem(TOKEN_KEY);

export const setWeixinAccessToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getWeixinUserProfile = (): WeixinUserProfile | null => {
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WeixinUserProfile>;
    if (!parsed || typeof parsed.nickname !== 'string' || typeof parsed.avatarUrl !== 'string') {
      return null;
    }
    return {
      nickname: parsed.nickname,
      avatarUrl: parsed.avatarUrl,
    };
  } catch {
    return null;
  }
};

export const setWeixinUserProfile = (profile: WeixinUserProfile) => {
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
};

export const clearWeixinAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_PROFILE_KEY);
};

const isTruthyParam = (value: string | null): boolean => {
  if (value === null) return false;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
};

export const isWeixinMockEnabled = (token?: string | null): boolean => {
  if (typeof window !== 'undefined') {
    const query = new URLSearchParams(window.location.search);
    if (isTruthyParam(query.get('mock_login')) || isTruthyParam(query.get('mockLogin'))) {
      return true;
    }
  }
  const tokenValue = token ?? getWeixinAccessToken() ?? '';
  return tokenValue === 'dev-token' || tokenValue.startsWith('mock-');
};

const emitAuthExpired = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
};

export const onWeixinAuthExpired = (handler: () => void) => {
  if (typeof window === 'undefined') return () => {};
  const listener = () => handler();
  window.addEventListener(AUTH_EXPIRED_EVENT, listener);
  return () => window.removeEventListener(AUTH_EXPIRED_EVENT, listener);
};

const buildHeaders = (token?: string | null, withJsonBody = false): HeadersInit => {
  const headers: Record<string, string> = {};
  if (withJsonBody) {
    headers['Content-Type'] = 'application/json';
  }
  if (token === null) {
    return headers;
  }
  const finalToken = token || getWeixinAccessToken() || '';
  if (finalToken) {
    headers.Authorization = `Bearer ${finalToken}`;
  }
  return headers;
};

async function request<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const withJsonBody = typeof options.body === 'string' && options.body.length > 0;
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...buildHeaders(token, withJsonBody),
      ...(options.headers || {}),
    },
  });
  let body: ApiResponse<T> | null = null;
  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    body = null;
  }
  const unauthorized = response.status === 401 || body?.code === 'UNAUTHORIZED';
  if (unauthorized) {
    clearWeixinAuth();
    emitAuthExpired();
  }
  if (!response.ok || !body?.success) {
    throw new Error(body?.message || `Request failed: ${response.status}`);
  }
  return body.data;
}

function readHomeIndexCache(): HomePageView | null {
  try {
    const raw = localStorage.getItem(HOME_INDEX_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as HomePageView;
  } catch {
    return null;
  }
}

function writeHomeIndexCache(data: HomePageView) {
  try {
    localStorage.setItem(HOME_INDEX_CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore localStorage write failure (e.g. private mode/quota).
  }
}

function readProductDetailCache(productId: number): HomeProductDetailView | null {
  try {
    const raw = localStorage.getItem(`${PRODUCT_DETAIL_CACHE_KEY_PREFIX}${productId}`);
    if (!raw) return null;
    return JSON.parse(raw) as HomeProductDetailView;
  } catch {
    return null;
  }
}

function writeProductDetailCache(productId: number, data: HomeProductDetailView) {
  try {
    localStorage.setItem(`${PRODUCT_DETAIL_CACHE_KEY_PREFIX}${productId}`, JSON.stringify(data));
  } catch {
    // Ignore localStorage write failure (e.g. private mode/quota).
  }
}

function normalizeMyHomeMessagesResult(
  data: PageResult<ParentMessageView> | ParentMessageView[],
  pageNo: number,
  pageSize: number,
): PageResult<ParentMessageView> {
  if (Array.isArray(data)) {
    const items = data;
    const total = items.length;
    const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;
    return {
      items,
      total,
      pageNo,
      pageSize,
      totalPages,
    };
  }
  return {
    items: Array.isArray(data.items) ? data.items : [],
    total: typeof data.total === 'number' ? data.total : 0,
    pageNo: typeof data.pageNo === 'number' ? data.pageNo : pageNo,
    pageSize: typeof data.pageSize === 'number' ? data.pageSize : pageSize,
    totalPages: typeof data.totalPages === 'number' ? data.totalPages : 0,
  };
}

const MOCK_AVATAR = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="60" fill="#E8F7F2"/><circle cx="60" cy="44" r="20" fill="#45B08C"/><path d="M24 104c6-18 20-28 36-28s30 10 36 28" fill="#45B08C"/></svg>',
)}`;

const mockPageResult = <T,>(items: T[], pageNo = 1, pageSize = 20): PageResult<T> => {
  const start = Math.max(0, (pageNo - 1) * pageSize);
  const pagedItems = items.slice(start, start + pageSize);
  return {
    items: pagedItems,
    total: items.length,
    pageNo,
    pageSize,
    totalPages: pageSize > 0 ? Math.max(1, Math.ceil(items.length / pageSize)) : 1,
  };
};

const readMockArray = <T,>(key: string, fallback: T[]): T[] => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback.slice();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback.slice();
  } catch {
    return fallback.slice();
  }
};

const writeMockArray = <T,>(key: string, data: T[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore localStorage write failure in mock mode.
  }
};

const getMockProfile = () => getWeixinUserProfile() || {
  nickname: '测试用户',
  avatarUrl: MOCK_AVATAR,
};

const mockHomeIndex = (): HomePageView => ({
  banners: [
    {
      id: 1,
      title: '学子之家家庭服务',
      imageUrl: 'https://images.unsplash.com/photo-1523240715630-9918c13d190c?auto=format&fit=crop&q=80&w=900',
    },
    {
      id: 2,
      title: '安心陪伴与社区支持',
      imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6958?auto=format&fit=crop&q=80&w=900',
    },
  ],
  bannerSlogan: 'mock 数据：学子之家服务正在本地预览',
  siteProfile: {
    communityName: '学子之家示范站',
    introText: '为来访家庭提供短住、陪护、家人卡、代办与社区生活支持。当前页面使用前端 mock 数据，不依赖后端接口。',
    contactPhone: '13800138000',
    address: '北京市海淀区中关村南大街 1 号',
    latitude: 39.9587,
    longitude: 116.3192,
  },
});

const mockProductDetails: Record<number, HomeProductDetailView> = {
  101: {
    id: 101,
    productNo: 'MOCK-FAMILY-001',
    type: 'FAMILY_CARD',
    title: '学期家庭陪伴卡',
    subtitle: '适合一学期内多次探访、陪读与短住的家庭',
    detailContent: '包含家庭成员权益、社区活动预约、应急联系人登记与到访服务支持。mock 模式下可直接创建模拟订单。',
    imageUrls: [
      'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=900',
      'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?auto=format&fit=crop&q=80&w=900',
    ],
    contactName: '王老师',
    contactPhone: '13800138000',
    serviceStartAt: '2026-04-16T00:00:00+08:00',
    serviceEndAt: '2026-09-01T23:59:59+08:00',
    saleStartAt: '2026-04-01T00:00:00+08:00',
    saleEndAt: '2026-08-31T23:59:59+08:00',
    publishStatus: 'ON_SHELF',
    deleted: false,
    top: true,
    displayPriority: 100,
    listVisibilityRuleId: 0,
    detailVisibilityRuleId: 0,
    categoryId: 1,
    familyCardPlans: [
      { id: 1001, durationType: 'MONTH', durationMonths: 1, priceCents: 19900, maxFamilyMembers: 2, enabled: true },
      { id: 1002, durationType: 'SEMESTER', durationMonths: 5, priceCents: 69900, maxFamilyMembers: 4, enabled: true },
      { id: 1003, durationType: 'YEAR', durationMonths: 12, priceCents: 129900, maxFamilyMembers: 6, enabled: true },
    ],
    valueAddedSkus: [],
  },
  201: {
    id: 201,
    productNo: 'MOCK-SERVICE-001',
    type: 'VALUE_ADDED_SERVICE',
    title: '到校物品代办服务',
    subtitle: '资料打印、生活用品采购、临时跑腿',
    detailContent: '适合临时需要协助的家庭。可选择不同服务包，订单创建后由站点工作人员联系确认。',
    imageUrls: [
      'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&q=80&w=900',
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=900',
    ],
    contactName: '李管家',
    contactPhone: '13900139000',
    serviceStartAt: '2026-04-16T08:00:00+08:00',
    serviceEndAt: '2026-12-31T20:00:00+08:00',
    saleStartAt: '2026-04-01T00:00:00+08:00',
    saleEndAt: '2026-12-31T23:59:59+08:00',
    publishStatus: 'ON_SHELF',
    deleted: false,
    top: false,
    displayPriority: 80,
    listVisibilityRuleId: 0,
    detailVisibilityRuleId: 0,
    categoryId: 2,
    familyCardPlans: [],
    valueAddedSkus: [
      { id: 2001, title: '基础代办 1 次', priceCents: 3900, enabled: true },
      { id: 2002, title: '加急代办 1 次', priceCents: 6900, enabled: true },
    ],
  },
  202: {
    id: 202,
    productNo: 'MOCK-SERVICE-002',
    type: 'VALUE_ADDED_SERVICE',
    title: '周末亲子活动预约',
    subtitle: '社区共学、城市参访、亲子体验',
    detailContent: '提供周末活动报名和现场协助，适合陪读家庭快速熟悉周边社区环境。',
    imageUrls: [
      'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&q=80&w=900',
    ],
    contactName: '赵老师',
    contactPhone: '13700137000',
    serviceStartAt: '2026-04-20T08:00:00+08:00',
    serviceEndAt: '2026-12-31T20:00:00+08:00',
    saleStartAt: '2026-04-01T00:00:00+08:00',
    saleEndAt: '2026-12-31T23:59:59+08:00',
    publishStatus: 'ON_SHELF',
    deleted: false,
    top: false,
    displayPriority: 70,
    listVisibilityRuleId: 0,
    detailVisibilityRuleId: 0,
    categoryId: 2,
    familyCardPlans: [],
    valueAddedSkus: [
      { id: 2021, title: '单人活动名额', priceCents: 9900, enabled: true },
      { id: 2022, title: '家庭双人名额', priceCents: 15900, enabled: true },
    ],
  },
};

const mockHomeProducts = (): HomeProductView[] =>
  Object.values(mockProductDetails)
    .sort((a, b) => b.displayPriority - a.displayPriority)
    .map((product) => {
      const prices = [
        ...product.familyCardPlans.filter((plan) => plan.enabled).map((plan) => plan.priceCents),
        ...product.valueAddedSkus.filter((sku) => sku.enabled).map((sku) => sku.priceCents),
      ];
      return {
        id: product.id,
        type: product.type,
        title: product.title,
        priceCents: prices.length > 0 ? Math.min(...prices) : 0,
        top: product.top,
        publishStatus: product.publishStatus,
      };
    });

const defaultMockFamilyMembers = (): FamilyMemberView[] => [
  {
    memberNo: 'M202604160001',
    memberName: '张小禾',
    studentOrCardNo: 'STU20260001',
    phone: '13800138001',
    joinedAt: '2026-04-16T09:00:00+08:00',
    status: 'ACTIVE',
    familyGroupExpireAt: '2026-09-01T23:59:59+08:00',
    wechatAvatarUrl: getMockProfile().avatarUrl,
  },
  {
    memberNo: 'M202604160002',
    memberName: '李明',
    studentOrCardNo: 'CARD20260002',
    phone: '13800138002',
    joinedAt: '2026-04-10T10:30:00+08:00',
    status: 'ACTIVE',
    familyGroupExpireAt: '2026-09-01T23:59:59+08:00',
    wechatAvatarUrl: getMockProfile().avatarUrl,
  },
];

const defaultMockHomeMessages = (): ParentMessageView[] => {
  const profile = getMockProfile();
  return [
    {
      id: 1,
      nickname: profile.nickname,
      avatarUrl: profile.avatarUrl,
      content: '第一次用mock数据预览，首页、商品、家人和订单都能先跑通。',
      createdAt: '2026-04-16T10:00:00+08:00',
      replies: [
        {
          id: 101,
          senderType: 'ADMIN',
          nickname: '站点管理员',
          avatarUrl: MOCK_AVATAR,
          content: '收到，后续接入真实后端时前端交互可以保持一致。',
          createdAt: '2026-04-16T10:30:00+08:00',
        },
      ],
    },
    {
      id: 2,
      nickname: profile.nickname,
      avatarUrl: profile.avatarUrl,
      content: '周末想预约亲子活动，看看模拟列表里的服务包。',
      createdAt: '2026-04-15T18:20:00+08:00',
      replies: [],
    },
  ];
};

const defaultMockPurchasedProducts = (): PurchasedProductView[] => [
  {
    orderNo: 'MOCK202604160001',
    orderType: 'FAMILY_CARD',
    orderStatus: 'PAID',
    paidAt: '2026-04-16T09:30:00+08:00',
    productId: 101,
    productType: 'FAMILY_CARD',
    productTitle: '学期家庭陪伴卡',
    productBrief: 'mock 已购家庭卡',
    productImageUrls: JSON.stringify(mockProductDetails[101].imageUrls),
    selectedDurationType: 'SEMESTER',
    selectedDurationMonths: 5,
    serviceStartAt: '2026-04-16T00:00:00+08:00',
    serviceEndAt: '2026-09-01T23:59:59+08:00',
    unitPriceCents: 69900,
    quantity: 1,
    totalPriceCents: 69900,
  },
  {
    orderNo: 'MOCK202604150001',
    orderType: 'VALUE_ADDED_SERVICE',
    orderStatus: 'PAID',
    paidAt: '2026-04-15T16:10:00+08:00',
    productId: 201,
    productType: 'VALUE_ADDED_SERVICE',
    productTitle: '到校物品代办服务',
    productBrief: 'mock 已购增值服务',
    productImageUrls: JSON.stringify(mockProductDetails[201].imageUrls),
    serviceStartAt: '2026-04-16T08:00:00+08:00',
    serviceEndAt: '2026-12-31T20:00:00+08:00',
    unitPriceCents: 3900,
    quantity: 1,
    totalPriceCents: 3900,
  },
];

const getMockFamilyMembers = () => readMockArray(MOCK_FAMILY_MEMBERS_KEY, defaultMockFamilyMembers());
const setMockFamilyMembers = (members: FamilyMemberView[]) => writeMockArray(MOCK_FAMILY_MEMBERS_KEY, members);
const getMockHomeMessages = () => readMockArray(MOCK_HOME_MESSAGES_KEY, defaultMockHomeMessages());
const setMockHomeMessages = (messages: ParentMessageView[]) => writeMockArray(MOCK_HOME_MESSAGES_KEY, messages);
const getMockPurchasedProducts = () => readMockArray(MOCK_PURCHASED_PRODUCTS_KEY, defaultMockPurchasedProducts());
const setMockPurchasedProducts = (products: PurchasedProductView[]) => writeMockArray(MOCK_PURCHASED_PRODUCTS_KEY, products);

export const weixinApi = {
  login(payload: WechatLoginRequest) {
    if (isWeixinMockEnabled()) {
      return Promise.resolve<LoginResult>({
        userId: 1,
        accessToken: payload.code || 'dev-token',
        tokenType: 'Bearer',
        username: payload.nickname || getMockProfile().nickname,
        roles: ['WECHAT'],
      });
    }
    return request<LoginResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, null);
  },

  async getHomeIndex(options?: { forceRefresh?: boolean }) {
    if (isWeixinMockEnabled(null)) {
      return mockHomeIndex();
    }
    const forceRefresh = options?.forceRefresh === true;
    if (!forceRefresh) {
      const cached = readHomeIndexCache();
      if (cached) {
        return cached;
      }
    }
    const data = await request<HomePageView>('/home/index', {}, null);
    writeHomeIndexCache(data);
    return data;
  },

  getHomeProducts(
    params: { saleStartAt: string; saleEndAt: string },
    options?: { forceRefresh?: boolean },
  ) {
    if (isWeixinMockEnabled(null)) {
      return Promise.resolve(mockHomeProducts());
    }
    const query = new URLSearchParams({
      sale_start_at: params.saleStartAt,
      sale_end_at: params.saleEndAt,
    });
    const key = `${params.saleStartAt}|${params.saleEndAt}`;
    const forceRefresh = options?.forceRefresh === true;
    if (!forceRefresh) {
      const inflight = HOME_PRODUCTS_INFLIGHT.get(key);
      if (inflight) return inflight;
    }
    const task = request<HomeProductView[]>(`/home/products?${query.toString()}`, {}, null)
      .finally(() => {
        HOME_PRODUCTS_INFLIGHT.delete(key);
      });
    HOME_PRODUCTS_INFLIGHT.set(key, task);
    return task;
  },

  getHomeProductDetail(productId: number, options?: { forceRefresh?: boolean }) {
    if (isWeixinMockEnabled(null)) {
      return Promise.resolve(mockProductDetails[productId] || mockProductDetails[101]);
    }
    const forceRefresh = options?.forceRefresh === true;
    if (!forceRefresh) {
      const cached = readProductDetailCache(productId);
      if (cached) {
        return Promise.resolve(cached);
      }
      const inflight = PRODUCT_DETAIL_INFLIGHT.get(productId);
      if (inflight) {
        return inflight;
      }
    }
    const task = request<HomeProductDetailView>(`/home/products/${productId}`, {}, null)
      .then((data) => {
        writeProductDetailCache(productId, data);
        return data;
      })
      .finally(() => {
        PRODUCT_DETAIL_INFLIGHT.delete(productId);
      });
    PRODUCT_DETAIL_INFLIGHT.set(productId, task);
    return task;
  },

  createHomeMessage(payload: CreateParentMessageRequest, token?: string) {
    if (isWeixinMockEnabled(token)) {
      const profile = getMockProfile();
      const messages = getMockHomeMessages();
      const nextId = Math.max(0, ...messages.map((item) => item.id)) + 1;
      const created: ParentMessageView = {
        id: nextId,
        nickname: profile.nickname,
        avatarUrl: profile.avatarUrl,
        content: payload.content,
        createdAt: new Date().toISOString(),
        replies: [],
      };
      setMockHomeMessages([created, ...messages]);
      return Promise.resolve(created);
    }
    return request<ParentMessageView>('/home/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token);
  },

  getMyHomeMessages(
    params: { pageNo?: number; pageSize?: number } = {},
    token?: string,
  ) {
    const pageNo = params.pageNo || 1;
    const pageSize = params.pageSize || 20;
    if (isWeixinMockEnabled(token)) {
      const messages = getMockHomeMessages()
        .slice()
        .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
      return Promise.resolve(mockPageResult(messages, pageNo, pageSize));
    }
    const query = new URLSearchParams();
    query.set('page_no', String(pageNo));
    query.set('page_size', String(pageSize));
    const queryString = query.toString();
    const tokenValue = token || getWeixinAccessToken() || '';
    const key = `${tokenValue || 'anon'}|${pageNo}|${pageSize}`;
    const cached = MY_HOME_MESSAGES_CACHE.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return Promise.resolve(cached.data);
    }
    const inflight = MY_HOME_MESSAGES_INFLIGHT.get(key);
    if (inflight) {
      return inflight;
    }
    const task = request<PageResult<ParentMessageView> | ParentMessageView[]>(
      `/home/messages/mine${queryString ? `?${queryString}` : ''}`,
      {},
      token,
    )
      .then((data) => {
        const normalized = normalizeMyHomeMessagesResult(data, pageNo, pageSize);
        MY_HOME_MESSAGES_CACHE.set(key, {
          data: normalized,
          expiresAt: Date.now() + REPLAY_GUARD_TTL_MS,
        });
        return normalized;
      })
      .finally(() => {
        MY_HOME_MESSAGES_INFLIGHT.delete(key);
      });
    MY_HOME_MESSAGES_INFLIGHT.set(key, task);
    return task;
  },

  createOrder(payload: CreateOrderRequest, token?: string) {
    if (isWeixinMockEnabled(token)) {
      const product = mockProductDetails[payload.productId] || mockProductDetails[101];
      const familyPlan = product.familyCardPlans.find((plan) => plan.durationType === payload.durationType)
        || product.familyCardPlans[0];
      const orderNo = `MOCK${Date.now()}`;
      const purchased: PurchasedProductView = {
        orderNo,
        orderType: payload.productType,
        orderStatus: 'PAID',
        paidAt: new Date().toISOString(),
        productId: payload.productId,
        productType: payload.productType,
        productTitle: product.title,
        productBrief: product.subtitle,
        productImageUrls: JSON.stringify(product.imageUrls),
        selectedDurationType: familyPlan?.durationType,
        selectedDurationMonths: familyPlan?.durationMonths,
        serviceStartAt: product.serviceStartAt,
        serviceEndAt: product.serviceEndAt,
        unitPriceCents: payload.amountCents,
        quantity: 1,
        totalPriceCents: payload.amountCents,
      };
      setMockPurchasedProducts([purchased, ...getMockPurchasedProducts()]);
      return Promise.resolve<OrderCreateResult>({
        orderNo,
        status: 'PENDING_PAYMENT',
        payableAmountCents: payload.amountCents,
        payParams: {
          prepayId: `mock-prepay-${orderNo}`,
          nonceStr: 'mock-nonce',
          paySign: 'mock-pay-sign',
          timeStamp: String(Math.floor(Date.now() / 1000)),
        },
      });
    }
    return request<OrderCreateResult>('/orders/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token);
  },

  getOrderStatus(orderNo: string, token?: string) {
    if (isWeixinMockEnabled(token)) {
      const paidOrder = getMockPurchasedProducts().find((item) => item.orderNo === orderNo);
      return Promise.resolve(paidOrder?.orderStatus || 'PENDING_PAYMENT');
    }
    return request<string>(`/orders/${encodeURIComponent(orderNo)}/status`, {}, token);
  },

  getPurchasedProducts(
    params: { productType?: string; pageNo?: number; pageSize?: number } = {},
    token?: string,
  ) {
    if (isWeixinMockEnabled(token)) {
      const pageNo = params.pageNo || 1;
      const pageSize = params.pageSize || 20;
      let products = getMockPurchasedProducts();
      if (params.productType) {
        products = products.filter((p) => p.productType === params.productType);
      }
      return Promise.resolve(mockPageResult(products, pageNo, pageSize));
    }
    const query = new URLSearchParams();
    if (params.productType) query.set('product_type', params.productType);
    if (params.pageNo) query.set('page_no', String(params.pageNo));
    if (params.pageSize) query.set('page_size', String(params.pageSize));
    const queryString = query.toString();
    const tokenValue = token || getWeixinAccessToken() || '';
    const key = `${tokenValue}|${params.productType || ''}|${params.pageNo || 1}|${params.pageSize || 20}`;
    const cached = PURCHASED_PRODUCTS_CACHE.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return Promise.resolve(cached.data);
    }
    const inflight = PURCHASED_PRODUCTS_INFLIGHT.get(key);
    if (inflight) {
      return inflight;
    }
    const task = request<PageResult<PurchasedProductView>>(
      `/orders/purchased-products${queryString ? `?${queryString}` : ''}`,
      {},
      token,
    ).then((data) => {
      PURCHASED_PRODUCTS_CACHE.set(key, {
        data,
        expiresAt: Date.now() + REPLAY_GUARD_TTL_MS,
      });
      return data;
    }).finally(() => {
      PURCHASED_PRODUCTS_INFLIGHT.delete(key);
    });
    PURCHASED_PRODUCTS_INFLIGHT.set(key, task);
    return task;
  },

  updateProfile(payload: UpdateWeixinProfileRequest, token?: string) {
    if (isWeixinMockEnabled(token)) {
      const profile = getMockProfile();
      const updated = {
        ...profile,
        nickname: payload.nickname,
        phone: payload.phone,
      };
      setWeixinUserProfile(updated);
      return Promise.resolve(updated);
    }
    return request<WeixinUserProfile>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }, token);
  },

  notifyPay(payload: PayNotifyRequest) {
    if (isWeixinMockEnabled()) {
      return Promise.resolve();
    }
    return request<void>('/pay/notify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  addFamilyMember(payload: AddFamilyMemberRequest, token?: string) {
    if (isWeixinMockEnabled(token)) {
      const profile = getMockProfile();
      const members = getMockFamilyMembers();
      const created: FamilyMemberView = {
        memberNo: `M${Date.now()}`,
        memberName: payload.memberName,
        studentOrCardNo: payload.studentOrCardNo,
        phone: payload.phone,
        joinedAt: payload.joinedAt,
        status: 'ACTIVE',
        familyGroupExpireAt: '2026-09-01T23:59:59+08:00',
        wechatAvatarUrl: profile.avatarUrl,
      };
      setMockFamilyMembers([created, ...members]);
      return Promise.resolve(created);
    }
    return request<FamilyMemberView>('/family/members', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token);
  },

  listFamilyMembers(
    params: { keyword?: string; pageNo?: number; pageSize?: number } = {},
    token?: string,
  ) {
    if (isWeixinMockEnabled(token)) {
      const keyword = (params.keyword || '').trim().toLowerCase();
      const members = getMockFamilyMembers().filter((member) => {
        if (!keyword) return true;
        return [
          member.memberNo,
          member.memberName,
          member.studentOrCardNo,
          member.phone,
        ].some((value) => (value || '').toLowerCase().includes(keyword));
      });
      return Promise.resolve(mockPageResult(members, params.pageNo || 1, params.pageSize || 20));
    }
    const query = new URLSearchParams();
    if (params.keyword) query.set('keyword', params.keyword);
    if (params.pageNo) query.set('page_no', String(params.pageNo));
    if (params.pageSize) query.set('page_size', String(params.pageSize));
    const queryString = query.toString();
    const tokenValue = token || getWeixinAccessToken() || '';
    const key = `${tokenValue}|${params.keyword || ''}|${params.pageNo || ''}|${params.pageSize || ''}`;
    const inflight = FAMILY_MEMBERS_INFLIGHT.get(key);
    if (inflight) {
      return inflight;
    }
    const task = request<PageResult<FamilyMemberView>>(
      `/family/members${queryString ? `?${queryString}` : ''}`,
      {},
      token,
    ).finally(() => {
      FAMILY_MEMBERS_INFLIGHT.delete(key);
    });
    FAMILY_MEMBERS_INFLIGHT.set(key, task);
    return task;
  },

  cancelFamilyMember(memberNo: string, token?: string) {
    if (isWeixinMockEnabled(token)) {
      const members = getMockFamilyMembers().map((member) =>
        member.memberNo === memberNo
          ? { ...member, status: 'CANCELLED' }
          : member,
      );
      setMockFamilyMembers(members);
      return Promise.resolve();
    }
    return request<void>(`/family/members/${encodeURIComponent(memberNo)}`, {
      method: 'DELETE',
    }, token);
  },

  getFamilyGroupQuota(token?: string) {
    if (isWeixinMockEnabled(token)) {
      const activeMembers = getMockFamilyMembers().filter((member) => member.status === 'ACTIVE');
      const maxMembers = 6;
      return Promise.resolve<FamilyGroupQuotaView>({
        hasActiveGroup: true,
        groupNo: 'G202604160001',
        maxMembers,
        currentMembers: activeMembers.length,
        availableMembers: Math.max(0, maxMembers - activeMembers.length),
        status: 'ACTIVE',
        expireAt: '2026-09-01T23:59:59+08:00',
      });
    }
    const tokenValue = token || getWeixinAccessToken() || '';
    const key = tokenValue || 'anon';
    const cached = FAMILY_GROUP_QUOTA_CACHE.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return Promise.resolve(cached.data);
    }
    const inflight = FAMILY_GROUP_QUOTA_INFLIGHT.get(key);
    if (inflight) {
      return inflight;
    }
    const task = request<FamilyGroupQuotaView>('/family/group/quota', {}, token)
      .then((data) => {
        FAMILY_GROUP_QUOTA_CACHE.set(key, {
          data,
          expiresAt: Date.now() + REPLAY_GUARD_TTL_MS,
        });
        return data;
      })
      .finally(() => {
        FAMILY_GROUP_QUOTA_INFLIGHT.delete(key);
      });
    FAMILY_GROUP_QUOTA_INFLIGHT.set(key, task);
    return task;
  },
};
