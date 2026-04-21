import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { Edit, X, Loader2, User, ShoppingBag, CreditCard, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  getWeixinAccessToken,
  getWeixinUserProfile,
  setWeixinUserProfile,
  PurchasedProductView,
  weixinApi,
} from '../api/weixin';

interface ProfilePageProps {
  setCurrentPage: (page: any) => void;
}

type ProductTypeFilter = 'ALL' | 'FAMILY_CARD' | 'VALUE_ADDED_SERVICE';

const DEFAULT_AVATAR = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="60" fill="#FFF8E6"/><circle cx="60" cy="46" r="20" fill="#FF8C00"/><path d="M24 102c5-17 19-27 36-27s31 10 36 27" fill="#FF8C00"/></svg>',
)}`;

const orderTypeMap: Record<string, string> = {
  FAMILY_CARD: '家庭卡',
  VALUE_ADDED_SERVICE: '增值服务',
};

const getProductTypeIcon = (type: string) => {
  if (type === 'FAMILY_CARD') return CreditCard;
  return Sparkles;
};

const getProductTypeColor = (type: string) => {
  if (type === 'FAMILY_CARD') return 'bg-emerald-50 text-emerald-600';
  return 'bg-purple-50 text-purple-600';
};

const formatAmount = (totalPriceCents?: number) => {
  if (typeof totalPriceCents !== 'number') return '--';
  return `¥${(totalPriceCents / 100).toFixed(2)}`;
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
  const [profile, setProfile] = useState(() => getWeixinUserProfile());
  const [products, setProducts] = useState<PurchasedProductView[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState<ProductTypeFilter>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const nickname = useMemo(() => {
    if (!token) return '未登录';
    return profile?.nickname || '微信用户';
  }, [token, profile]);

  const avatarUrl = useMemo(() => {
    if (!token) return DEFAULT_AVATAR;
    return profile?.avatarUrl || DEFAULT_AVATAR;
  }, [token, profile]);

  const loadPurchasedProducts = useCallback(
    async (pageNo: number, filter: ProductTypeFilter, append: boolean) => {
      if (!token) {
        setProducts([]);
        setHasMore(false);
        return;
      }

      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoadingProducts(true);
      setProductsError('');

      try {
        const params: { productType?: string; pageNo: number; pageSize: number } = {
          pageNo,
          pageSize: 20,
        };
        if (filter !== 'ALL') {
          params.productType = filter;
        }

        const data = await weixinApi.getPurchasedProducts(params);

        if (append) {
          setProducts((prev) => [...prev, ...(data.items || [])]);
        } else {
          setProducts(data.items || []);
        }
        setHasMore(pageNo < data.totalPages);
      } catch (error) {
        if (!append) {
          setProducts([]);
        }
        setProductsError('已购商品加载失败，请稍后重试');
      } finally {
        setLoadingProducts(false);
        loadingRef.current = false;
      }
    },
    [token],
  );

  useEffect(() => {
    setCurrentPage(1);
    setProducts([]);
    setHasMore(true);
    loadPurchasedProducts(1, productTypeFilter, false);
  }, [productTypeFilter, loadPurchasedProducts]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current && !loadingProducts) {
          const nextPage = currentPage + 1;
          setCurrentPage(nextPage);
          loadPurchasedProducts(nextPage, productTypeFilter, true);
        }
      },
      { threshold: 0.1 },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingProducts, currentPage, productTypeFilter, loadPurchasedProducts]);

  const handleOpenEditModal = () => {
    setEditNickname(profile?.nickname || '');
    setEditPhone(profile?.phone || '');
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!editNickname.trim()) {
      window.alert('请输入昵称');
      return;
    }
    if (!/^1\d{10}$/.test(editPhone)) {
      window.alert('请输入正确的手机号（11位中国大陆手机号）');
      return;
    }

    setSavingProfile(true);
    try {
      const updated = await weixinApi.updateProfile({
        nickname: editNickname.trim(),
        phone: editPhone,
      });
      setProfile(updated);
      setWeixinUserProfile(updated);
      setShowEditModal(false);
    } catch (error) {
      window.alert('更新失败，请稍后重试');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <main className="pt-20 pb-28 px-4 space-y-6 max-w-md mx-auto">
      <section className="bg-[#FFCC33] p-5 rounded-2xl flex items-center justify-between text-[#453900] shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/30 shadow-inner flex items-center justify-center">
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
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-3.5 h-3.5 opacity-70" />
              <span className="text-[10px] opacity-70 font-medium">我的资料</span>
            </div>
            <h4 className="text-base font-bold">{nickname}</h4>
            {profile?.phone && (
              <p className="text-[11px] opacity-70 mt-0.5">手机号：{profile.phone}</p>
            )}
          </div>
        </div>
        {token && (
          <button
            onClick={handleOpenEditModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/30 font-bold text-sm active:scale-95 transition-transform shadow-sm"
          >
            <Edit className="w-4 h-4" />
            编辑
          </button>
        )}
      </section>

      <section className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 overflow-hidden">
        <div className="px-4 py-4 border-b border-outline-variant/10">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-on-surface">我购买的商品</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'ALL' as ProductTypeFilter, label: '全部' },
              { key: 'FAMILY_CARD' as ProductTypeFilter, label: '家庭卡' },
              { key: 'VALUE_ADDED_SERVICE' as ProductTypeFilter, label: '增值服务' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setProductTypeFilter(item.key)}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                  productTypeFilter === item.key
                    ? 'bg-[#FF8C00] text-white shadow-md'
                    : 'bg-surface-container text-on-surface-variant active:bg-surface-container-high hover:bg-surface-container-low'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {!loadingProducts && !!productsError && (
          <div className="px-4 py-8 text-sm text-red-500 text-center">{productsError}</div>
        )}

        {!loadingProducts && !productsError && products.length === 0 && (
          <div className="px-4 py-8">
            <div className="text-center">
              <ShoppingBag className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
              <p className="text-sm text-on-surface-variant">暂无已购商品</p>
            </div>
          </div>
        )}

        <div className="divide-y divide-outline-variant/10">
          {products.map((item) => {
            const Icon = getProductTypeIcon(item.productType || item.orderType || '');
            const iconColor = getProductTypeColor(item.productType || item.orderType || '');
            return (
              <div key={item.orderNo} className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center ${iconColor} shadow-inner`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h4 className="text-sm font-bold text-on-surface leading-snug line-clamp-1">
                        {item.productTitle || '--'}
                      </h4>
                      <span className="text-[#FF8C00] font-bold text-lg whitespace-nowrap">
                        {formatAmount(item.totalPriceCents)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                        {orderTypeMap[item.productType || item.orderType] || item.productType || item.orderType || '--'}
                      </span>
                      <span className="text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                        x{item.quantity || 1}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-on-surface-variant">订单号：{item.orderNo || '--'}</p>
                      <p className="text-xs text-on-surface-variant">商品ID：{item.productId || '--'}</p>
                      <p className="text-xs text-on-surface-variant">支付时间：{formatPaidAt(item.paidAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div ref={loadMoreRef} className="px-4 py-5">
          {loadingProducts && (
            <div className="flex items-center justify-center gap-2 text-sm text-on-surface-variant">
              <Loader2 className="w-4 h-4 animate-spin" />
              加载中...
            </div>
          )}
          {!loadingProducts && !hasMore && products.length > 0 && (
            <div className="text-center text-xs text-on-surface-variant/60">—— 没有更多了 ——</div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {showEditModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="fixed inset-0 bg-black/40 z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="bg-[#FFCC33] px-5 py-4 flex items-center justify-between">
                <h3 className="text-base font-bold text-[#453900]">修改资料</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1.5 rounded-full bg-white/30 hover:bg-white/50 transition-colors"
                >
                  <X className="w-5 h-5 text-[#453900]" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1.5">昵称</label>
                  <input
                    type="text"
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
                    placeholder="请输入昵称"
                    maxLength={64}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-3.5 px-4 text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-[#FF8C00]/30 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1.5">手机号</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="请输入11位手机号"
                    maxLength={11}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-3.5 px-4 text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-[#FF8C00]/30 focus:outline-none transition-all"
                  />
                </div>
              </div>
              <div className="px-5 py-4 border-t border-outline-variant/10 flex gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  disabled={savingProfile}
                  className="flex-1 py-3.5 rounded-xl bg-surface-container text-on-surface font-bold text-sm active:bg-surface-container-high transition-colors disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="flex-1 py-3.5 rounded-xl bg-[#FF8C00] text-white font-bold text-sm active:bg-[#E67E00] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                >
                  {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                  {savingProfile ? '提交中...' : '提交'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
};

export default ProfilePage;
