import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, User, Edit2, Loader2, Package, CreditCard, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  getWeixinAccessToken,
  getWeixinUserProfile,
  PurchasedProductView,
  setWeixinUserProfile,
  WeixinUserProfile,
  weixinApi,
} from '../api/weixin';

type PageId = 'home' | 'parents' | 'student-card' | 'family' | 'product-detail' | 'stories' | 'profile' | 'site-profile';

interface ProfilePageProps {
  setCurrentPage: (page: PageId) => void;
}

type ProductFilterType = '' | 'FAMILY_CARD' | 'VALUE_ADDED_SERVICE';

const DEFAULT_AVATAR = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="60" fill="#E8F7F2"/><circle cx="60" cy="44" r="20" fill="#45B08C"/><path d="M24 104c6-18 20-28 36-28s30 10 36 28" fill="#45B08C"/></svg>',
)}`;

const orderTypeMap: Record<string, string> = {
  FAMILY_CARD: '家庭卡',
  VALUE_ADDED_SERVICE: '增值服务',
};

const orderTypeStyleMap: Record<string, string> = {
  FAMILY_CARD: 'bg-[#C1FFEB] text-[#2D5A4C]',
  VALUE_ADDED_SERVICE: 'bg-[#FFE4B5] text-[#8B4513]',
};

const formatAmount = (cents?: number) => {
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

const PHONE_REGEX = /^1\d{10}$/;

const ProfilePage = ({ setCurrentPage }: ProfilePageProps) => {
  const token = getWeixinAccessToken();
  const profile = getWeixinUserProfile();
  const [products, setProducts] = useState<PurchasedProductView[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState('');
  const [productFilter, setProductFilter] = useState<ProductFilterType>('');
  const [pageNo, setPageNo] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const nickname = useMemo(() => {
    if (!token) return '未登录';
    return profile?.nickname || '微信用户';
  }, [token, profile]);

  const avatarUrl = useMemo(() => {
    if (!token) return DEFAULT_AVATAR;
    return profile?.avatarUrl || DEFAULT_AVATAR;
  }, [token, profile]);

  const loadPurchasedProducts = async (page: number, filter: ProductFilterType, isLoadMore: boolean = false) => {
    if (!token) return;
    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setLoadingProducts(true);
      setProductsError('');
    }
    try {
      const data = await weixinApi.getPurchasedProducts({
        productType: filter || undefined,
        pageNo: page,
        pageSize: 20,
      });
      if (isLoadMore) {
        setProducts((prev) => [...prev, ...(data.items || [])]);
      } else {
        setProducts(data.items || []);
      }
      setHasMore(data.items?.length === 20 && page < (data.totalPages || 1));
    } catch (error) {
      if (!isLoadMore) {
        setProducts([]);
        setProductsError('我购买的商品加载失败，请稍后重试');
      }
    } finally {
      if (isLoadMore) {
        setIsLoadingMore(false);
      } else {
        setLoadingProducts(false);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!token || cancelled) return;
      await loadPurchasedProducts(1, productFilter, false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [token, productFilter]);

  const handleFilterChange = (filter: ProductFilterType) => {
    setProductFilter(filter);
    setPageNo(1);
    setHasMore(true);
  };

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    const nextPage = pageNo + 1;
    await loadPurchasedProducts(nextPage, productFilter, true);
    setPageNo(nextPage);
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    if (scrollHeight - scrollTop - clientHeight < 50) {
      handleLoadMore();
    }
  };

  const openEditModal = () => {
    setEditNickname(profile?.nickname || '');
    setEditPhone('');
    setEditError('');
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    if (editLoading) return;
    setShowEditModal(false);
  };

  const handleSubmitProfile = async () => {
    const nickname = editNickname.trim();
    const phone = editPhone.trim();

    if (!nickname) {
      setEditError('请输入昵称');
      return;
    }
    if (nickname.length > 64) {
      setEditError('昵称最多64个字符');
      return;
    }
    if (!phone) {
      setEditError('请输入手机号');
      return;
    }
    if (!PHONE_REGEX.test(phone)) {
      setEditError('请输入11位中国大陆手机号');
      return;
    }

    setEditLoading(true);
    setEditError('');
    try {
      const result = await weixinApi.updateProfile({ nickname, phone });
      const updatedProfile: WeixinUserProfile = {
        nickname: result.nickname,
        avatarUrl: result.avatarUrl || profile?.avatarUrl || DEFAULT_AVATAR,
      };
      setWeixinUserProfile(updatedProfile);
      setShowEditModal(false);
    } catch (error) {
      setEditError('更新失败，请稍后重试');
    } finally {
      setEditLoading(false);
    }
  };

  const filterButtons: { key: ProductFilterType; label: string; icon: React.ElementType }[] = [
    { key: '', label: '全部', icon: Package },
    { key: 'FAMILY_CARD', label: '家庭卡', icon: CreditCard },
    { key: 'VALUE_ADDED_SERVICE', label: '增值服务', icon: Sparkles },
  ];

  return (
    <main className="pt-20 pb-32 px-6 max-w-md mx-auto space-y-4 min-h-screen bg-background">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setCurrentPage('home')} className="p-2 -ml-2 active:scale-95 transition-transform">
          <ArrowLeft className="w-6 h-6 text-[#8B4513]" />
        </button>
        <h2 className="text-xl font-bold text-[#1A1A1A]">我</h2>
        <div className="p-2 -mr-2">
          <User className="w-6 h-6 text-[#8B4513]" />
        </div>
      </div>

      <section className="bg-white rounded-[3rem] p-8 shadow-sm border border-[#F0F0F0]">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-[#E8F7F2] border-4 border-[#C1FFEB]">
              <img
                src={avatarUrl}
                alt="avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.src = DEFAULT_AVATAR;
                }}
              />
            </div>
            <button
              onClick={openEditModal}
              className="absolute -bottom-1 -right-1 w-9 h-9 bg-gradient-to-r from-[#D2691E] to-[#FF8C00] rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              <Edit2 className="w-4 h-4 text-white" />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-2xl font-serif font-bold text-[#1A1A1A] truncate">{nickname}</h3>
            <p className="text-sm text-[#8B4513]/70 mt-2 font-medium">{token ? '已登录' : '未登录'}</p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-[3rem] p-8 shadow-sm border border-[#F0F0F0]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-[#1A1A1A]">我购买的商品</h3>
        </div>

        <div className="flex gap-3 mb-6">
          {filterButtons.map((btn) => {
            const isActive = productFilter === btn.key;
            return (
              <button
                key={btn.key}
                onClick={() => handleFilterChange(btn.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-2xl text-xs font-bold transition-all active:scale-95 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#D2691E] to-[#FF8C00] text-white shadow-lg shadow-orange-500/20'
                    : 'bg-[#F7F7F7] text-[#666666]'
                }`}
              >
                <btn.icon className="w-4 h-4" />
                <span className="truncate">{btn.label}</span>
              </button>
            );
          })}
        </div>

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="max-h-[360px] overflow-y-auto space-y-4 no-scrollbar"
        >
          {loadingProducts && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 text-[#D2691E] animate-spin" />
              <span className="ml-3 text-sm text-[#8B4513]">加载中...</span>
            </div>
          )}

          {!!productsError && !loadingProducts && (
            <div className="py-8 text-sm text-red-500 text-center">{productsError}</div>
          )}

          {!loadingProducts && !productsError && products.length === 0 && (
            <div className="py-10 text-sm text-[#8B4513]/60 text-center">
              <Package className="w-12 h-12 mx-auto mb-3 text-[#8B4513]/30" />
              暂无已购商品
            </div>
          )}

          {!loadingProducts &&
            products.map((item) => (
              <motion.div
                key={item.orderNo}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#F7F7F7] rounded-2xl p-5 border border-[#E8E8E8]"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${orderTypeStyleMap[item.orderType] || 'bg-gray-100 text-gray-600'}`}>
                        {orderTypeMap[item.orderType] || item.orderType}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-[#1A1A1A] truncate">{item.productTitle}</h4>
                    <div className="space-y-1">
                      <p className="text-xs text-[#666666]">
                        订单号：{item.orderNo}
                      </p>
                      <p className="text-xs text-[#8B4513]/70">
                        支付时间：{formatPaidAt(item.paidAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <p className="text-lg font-bold text-[#D2691E]">{formatAmount(item.totalPriceCents)}</p>
                    <p className="text-xs text-[#666666]">x{item.quantity || 1}</p>
                  </div>
                </div>
              </motion.div>
            ))}

          {isLoadingMore && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 text-[#D2691E] animate-spin" />
              <span className="ml-2 text-xs text-[#8B4513]">加载更多...</span>
            </div>
          )}

          {!hasMore && products.length > 0 && (
            <div className="text-center py-4 text-xs text-[#8B4513]/50">没有更多了</div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-24">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeEditModal}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm mx-6 bg-white rounded-[2.5rem] overflow-hidden shadow-2xl z-10"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-[#1A1A1A]">编辑资料</h3>
                  <button
                    onClick={closeEditModal}
                    className="p-2 -mr-2 text-[#8B4513]/60 hover:text-[#8B4513] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-5 mb-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#333333] ml-1">昵称</label>
                    <div className="bg-[#F7F7F7] rounded-xl p-4">
                      <input
                        type="text"
                        value={editNickname}
                        onChange={(e) => setEditNickname(e.target.value)}
                        placeholder="请输入昵称"
                        maxLength={64}
                        className="w-full bg-transparent outline-none text-sm text-[#333333] placeholder:text-[#CCCCCC]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#333333] ml-1">手机号</label>
                    <div className="bg-[#F7F7F7] rounded-xl p-4">
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="请输入11位手机号"
                        maxLength={11}
                        inputMode="numeric"
                        className="w-full bg-transparent outline-none text-sm text-[#333333] placeholder:text-[#CCCCCC]"
                      />
                    </div>
                  </div>

                  {!!editError && <p className="text-sm text-red-500 text-center">{editError}</p>}
                </div>

                <button
                  onClick={handleSubmitProfile}
                  disabled={editLoading}
                  className="w-full py-4 bg-gradient-to-r from-[#D2691E] to-[#FF8C00] text-white rounded-2xl font-bold text-base shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  {editLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editLoading ? '保存中...' : '保存'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default ProfilePage;
