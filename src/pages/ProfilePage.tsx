import React, { useEffect, useMemo, useState } from 'react';
import { getWeixinAccessToken, getWeixinUserProfile, PurchasedProductView, weixinApi } from '../api/weixin';

interface ProfilePageProps {
  setCurrentPage: (page: any) => void;
}

const DEFAULT_AVATAR = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="60" fill="#EEF2F7"/><circle cx="60" cy="46" r="20" fill="#C6CEDA"/><path d="M24 102c5-17 19-27 36-27s31 10 36 27" fill="#C6CEDA"/></svg>',
)}`;

const orderTypeMap: Record<string, string> = {
  FAMILY_CARD: '家庭卡',
  VALUE_ADDED_SERVICE: '增值服务',
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

  const nickname = useMemo(() => {
    if (!token) return '未登录';
    return profile?.nickname || '微信用户';
  }, [token, profile]);

  const avatarUrl = useMemo(() => {
    if (!token) return DEFAULT_AVATAR;
    return profile?.avatarUrl || DEFAULT_AVATAR;
  }, [token, profile]);

  useEffect(() => {
    let cancelled = false;

    const loadPurchasedProducts = async () => {
      if (!token) {
        setProducts([]);
        return;
      }
      setLoadingProducts(true);
      setProductsError('');
      try {
        const data = await weixinApi.getPurchasedProducts({ pageNo: 1, pageSize: 100 });
        if (cancelled) return;
        setProducts(data.items || []);
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

    loadPurchasedProducts();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <main className="pt-20 pb-28 px-4 max-w-md mx-auto space-y-4">
      <section className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/20">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-surface-container border border-outline-variant/30 shrink-0">
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
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-on-surface-variant">我的昵称</p>
            <p className="text-base font-bold text-on-surface truncate">{nickname}</p>
          </div>
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 overflow-hidden">
        <div className="px-4 py-3 border-b border-outline-variant/20">
          <h3 className="text-sm font-bold text-on-surface">我购买的商品</h3>
        </div>

        {loadingProducts && <div className="px-4 py-6 text-sm text-on-surface-variant text-center">正在加载...</div>}
        {!!productsError && !loadingProducts && <div className="px-4 py-6 text-sm text-red-500 text-center">{productsError}</div>}
        {!loadingProducts && !productsError && products.length === 0 && (
          <div className="px-4 py-6 text-sm text-on-surface-variant text-center">暂无已购商品</div>
        )}

        {!loadingProducts && !productsError && products.length > 0 && (
          <div className="divide-y divide-outline-variant/10">
            {products.map((item) => (
              <div key={item.orderNo} className="px-4 py-3.5 space-y-1.5">
                <p className="text-sm text-on-surface">商品名称：{item.productTitle || '--'}</p>
                <p className="text-sm text-on-surface">订单类型：{orderTypeMap[item.orderType] || item.orderType || '--'}</p>
                <p className="text-sm text-on-surface">订单号：{item.orderNo || '--'}</p>
                <p className="text-sm text-on-surface">金额：{formatAmount(item)}</p>
                <p className="text-sm text-on-surface">支付时间：{formatPaidAt(item.paidAt)}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default ProfilePage;
