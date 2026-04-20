import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Menu, Edit2, X, Loader2, CreditCard, Package, Calendar, Hash, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  getWeixinAccessToken,
  getWeixinUserProfile,
  PurchasedProductView,
  setWeixinUserProfile,
  weixinApi,
} from '../api/weixin';

interface ProfilePageProps {
  setCurrentPage: (page: any) => void;
}

const DEFAULT_AVATAR = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="60" fill="#EEF2F7"/><circle cx="60" cy="46" r="20" fill="#C6CEDA"/><path d="M24 102c5-17 19-27 36-27s31 10 36 27" fill="#C6CEDA"/></svg>',
)}`;

const orderTypeMap: Record<string, { text: string; color: string }> = {
  FAMILY_CARD: { text: '家庭卡', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  VALUE_ADDED_SERVICE: { text: '增值服务', color: 'bg-purple-50 text-purple-700 border-purple-200' },
};

const formatAmount = (item: PurchasedProductView) => {
  const cents = typeof item.totalPriceCents === 'number' ? item.totalPriceCents : item.unitPriceCents;
  if (typeof cents !== 'number') return '--';
  return `¥${(cents / 100).toFixed(2)}`;
};

const formatPaidAt = (value?: string) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
};

const ProfilePage = ({ setCurrentPage: _setCurrentPage }: ProfilePageProps) => {
  const token = getWeixinAccessToken();
  const profile = getWeixinUserProfile();
  const [products, setProducts] = useState<PurchasedProductView[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState('');
  const [selectedProductType, setSelectedProductType] = useState<string>('');
  const [pageNo, setPageNo] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const listContainerRef = useRef<HTMLDivElement>(null);

  const nickname = useMemo(() => {
    if (!token) return '未登录';
    return profile?.nickname || '微信用户';
  }, [token, profile]);

  const avatarUrl = useMemo(() => {
    if (!token) return DEFAULT_AVATAR;
    return profile?.avatarUrl || DEFAULT_AVATAR;
  }, [token, profile]);

  const loadPurchasedProducts = async (productType: string, page: number, append: boolean = false) => {
    if (!token) {
      setProducts([]);
      return;
    }

    if (append) {
      setLoadingMore(true);
    } else {
      setLoadingProducts(true);
    }
    setProductsError('');

    try {
      const data = await weixinApi.getPurchasedProducts({
        productType: productType || undefined,
        pageNo: page,
        pageSize: 20,
      });

      const items = data.items || [];
      if (append) {
        setProducts((prev) => [...prev, ...items]);
      } else {
        setProducts(items);
      }

      setHasMore(items.length >= 20);
    } catch (error) {
      if (!append) {
        setProducts([]);
        setProductsError('我购买的商品加载失败，请稍后重试');
      }
    } finally {
      setLoadingProducts(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!token) {
        setProducts([]);
        return;
      }
      setLoadingProducts(true);
      setProductsError('');
      try {
        const data = await weixinApi.getPurchasedProducts({
          productType: selectedProductType || undefined,
          pageNo: 1,
          pageSize: 20,
        });
        if (cancelled) return;
        setProducts(data.items || []);
        setHasMore((data.items || []).length >= 20);
        setPageNo(1);
      } catch (error) {
        if (cancelled) return;
        setProducts([]);
        setProductsError('我购买的商品加载失败，请稍后重试');
      } finally {
        if (!cancelled) {
          setLoadingProducts(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [token, selectedProductType]);

  useEffect(() => {
    const container = listContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (loadingMore || !hasMore || loadingProducts) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < 100) {
        setLoadingMore(true);
        const nextPage = pageNo + 1;
        setPageNo(nextPage);
        loadPurchasedProducts(selectedProductType, nextPage, true);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMore, pageNo, selectedProductType, loadingProducts]);

  const handleProductTypeChange = (type: string) => {
    setSelectedProductType(type);
    setPageNo(1);
    setProducts([]);
    setHasMore(true);
  };

  const handleEditProfile = () => {
    setEditNickname(nickname === '微信用户' ? '' : nickname);
    setEditPhone('');
    setEditError('');
    setShowEditProfile(true);
  };

  const handleSubmitProfile = async () => {
    const trimmedNickname = editNickname.trim();
    const trimmedPhone = editPhone.trim();

    if (!trimmedNickname) {
      setEditError('昵称不能为空');
      return;
    }

    if (trimmedNickname.length > 64) {
      setEditError('昵称最多64个字符');
      return;
    }

    if (!/^1\d{10}$/.test(trimmedPhone)) {
      setEditError('请输入正确的11位手机号');
      return;
    }

    setEditLoading(true);
    setEditError('');

    try {
      const result = await weixinApi.updateProfile({
        nickname: trimmedNickname,
        phone: trimmedPhone,
      });

      setWeixinUserProfile({
        nickname: result.nickname,
        avatarUrl: result.avatarUrl,
      });

      setShowEditProfile(false);
    } catch (error) {
      setEditError('更新失败，请稍后重试');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <main className="pt-20 pb-28 px-4 max-w-md mx-auto min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md z-50 flex items-center justify-between px-6 border-b border-outline-variant/30">
        <div className="flex items-center gap-3">
          <Menu className="w-5 h-5 text-on-surface-variant" />
          <h1 className="text-on-surface font-bold text-base">我</h1>
        </div>
      </header>

      <section className="mt-5">
        <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-secondary/5 rounded-2xl p-5 shadow-sm border border-primary/10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-surface-container border-2 border-white shadow-lg">
                <img
                  src={avatarUrl}
                  alt="微信头像"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== DEFAULT_AVATAR) {
                      target.src = DEFAULT_AVATAR;
                    }
                  }}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-white">
                <span className="text-white text-[8px] font-bold">V</span>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-on-surface-variant font-medium mb-0.5">我的昵称</p>
              <p className="text-base font-bold text-on-surface truncate">{nickname}</p>
              <p className="text-[10px] text-primary font-medium mt-1">会员用户</p>
            </div>
            <button
              onClick={handleEditProfile}
              className="shrink-0 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm border border-outline-variant/20 active:scale-90 transition-transform"
            >
              <Edit2 className="w-4 h-4 text-primary" />
            </button>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-px bg-outline-variant/20" />
          <span className="text-xs text-on-surface-variant font-medium">商品筛选</span>
          <div className="flex-1 h-px bg-outline-variant/20" />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleProductTypeChange('')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
              selectedProductType === ''
                ? 'bg-primary text-white shadow-md'
                : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => handleProductTypeChange('FAMILY_CARD')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
              selectedProductType === 'FAMILY_CARD'
                ? 'bg-primary text-white shadow-md'
                : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container'
            }`}
          >
            家庭卡
          </button>
          <button
            onClick={() => handleProductTypeChange('VALUE_ADDED_SERVICE')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
              selectedProductType === 'VALUE_ADDED_SERVICE'
                ? 'bg-primary text-white shadow-md'
                : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container'
            }`}
          >
            增值服务
          </button>
        </div>
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-on-surface">我购买的商品</h3>
          {products.length > 0 && (
            <span className="text-xs text-on-surface-variant">共 {products.length} 件</span>
          )}
        </div>

        <div ref={listContainerRef} className="space-y-3 max-h-[60vh] overflow-y-auto">
          {loadingProducts && (
            <div className="bg-surface-container-lowest rounded-2xl p-8 text-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
              <p className="text-sm text-on-surface-variant">正在加载...</p>
            </div>
          )}
          {!!productsError && !loadingProducts && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <p className="text-sm text-red-600">{productsError}</p>
            </div>
          )}
          {!loadingProducts && !productsError && products.length === 0 && (
            <div className="bg-surface-container-lowest rounded-2xl p-8 text-center border border-outline-variant/20">
              <Package className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-2" />
              <p className="text-sm text-on-surface-variant">暂无已购商品</p>
            </div>
          )}

          {!loadingProducts && !productsError && products.length > 0 && (
            <>
              {products.map((item, index) => {
                const typeConfig = orderTypeMap[item.orderType] || { text: item.orderType || '--', color: 'bg-gray-50 text-gray-700 border-gray-200' };
                return (
                  <motion.div
                    key={item.orderNo}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/20 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-on-surface truncate mb-1">{item.productTitle || '--'}</h4>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${typeConfig.color}`}>
                          {typeConfig.text}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-primary">{formatAmount(item)}</p>
                        <p className="text-[10px] text-on-surface-variant">x{item.quantity || 1}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-outline-variant/10">
                      <div className="flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-on-surface-variant/60" />
                        <span className="text-[10px] text-on-surface-variant">订单号</span>
                      </div>
                      <p className="text-xs text-on-surface truncate text-right">{item.orderNo || '--'}</p>

                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-on-surface-variant/60" />
                        <span className="text-[10px] text-on-surface-variant">支付时间</span>
                      </div>
                      <p className="text-xs text-on-surface text-right">{formatPaidAt(item.paidAt)}</p>
                    </div>
                  </motion.div>
                );
              })}
              {loadingMore && (
                <div className="bg-surface-container-lowest rounded-2xl p-4 text-center border border-outline-variant/20">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    <span className="text-sm text-on-surface-variant">加载中...</span>
                  </div>
                </div>
              )}
              {!loadingMore && !hasMore && products.length > 0 && (
                <div className="text-center py-3">
                  <span className="text-xs text-on-surface-variant">— 没有更多了 —</span>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <AnimatePresence>
        {showEditProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEditProfile(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 pb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-on-surface">修改资料</h2>
                  <button
                    onClick={() => setShowEditProfile(false)}
                    className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <X className="w-4 h-4 text-on-surface-variant" />
                  </button>
                </div>
              </div>

              <div className="p-6 pt-4 space-y-4">
                <div>
                  <label className="block text-xs text-on-surface-variant font-medium mb-2">昵称</label>
                  <input
                    type="text"
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
                    placeholder="请输入昵称"
                    maxLength={64}
                    className="w-full bg-surface-container border-2 border-transparent rounded-xl py-3 px-4 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary/30 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-on-surface-variant font-medium mb-2">手机号</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="请输入11位手机号"
                    maxLength={11}
                    className="w-full bg-surface-container border-2 border-transparent rounded-xl py-3 px-4 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary/30 focus:outline-none transition-colors"
                  />
                </div>

                {!!editError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs text-red-600">{editError}</p>
                  </div>
                )}

                <button
                  onClick={handleSubmitProfile}
                  disabled={editLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
                >
                  {editLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editLoading ? '提交中...' : '提交修改'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default ProfilePage;
