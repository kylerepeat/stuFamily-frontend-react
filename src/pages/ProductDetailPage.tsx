import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Share2, Heart } from 'lucide-react';
import {
  CreateOrderRequest,
  getWeixinAccessToken,
  HomeProductDetailView,
  weixinApi,
} from '../api/weixin';

interface ProductDetailPageProps {
  setCurrentPage: (page: any) => void;
  productId?: number;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1523240715630-9918c13d190c?auto=format&fit=crop&q=80&w=800';

const ProductDetailPage = ({ setCurrentPage, productId }: ProductDetailPageProps) => {
  const [product, setProduct] = useState<HomeProductDetailView | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedFamilyPlanId, setSelectedFamilyPlanId] = useState<number | null>(null);
  const [selectedValueAddedSkuId, setSelectedValueAddedSkuId] = useState<number | null>(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const targetId = productId || 1;
    const loadDetail = async () => {
      setLoading(true);
      setErrorMessage('');
      try {
        const data = await weixinApi.getHomeProductDetail(targetId);
        if (cancelled) return;
        setProduct(data);
        setCurrentImageIndex(0);
        setSelectedFamilyPlanId(null);
        setSelectedValueAddedSkuId(null);
      } catch {
        if (!cancelled) setErrorMessage('商品详情加载失败，请稍后重试');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadDetail();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr || '--';
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatPrice = (priceCents: number) => `¥${(priceCents / 100).toFixed(2)}`;

  const mapDurationType = (durationType: string) => {
    if (durationType === 'MONTH') return '月卡';
    if (durationType === 'SEMESTER') return '学期卡';
    if (durationType === 'YEAR') return '年卡';
    return durationType;
  };

  const minPriceCents = useMemo(() => {
    if (!product) return 0;
    const sources = [
      ...(product.familyCardPlans || []).filter((p) => p.enabled).map((p) => p.priceCents),
      ...(product.valueAddedSkus || []).filter((s) => s.enabled).map((s) => s.priceCents),
    ].filter((price) => price > 0);
    if (sources.length === 0) return 0;
    return Math.min(...sources);
  }, [product]);

  const imageUrls = useMemo(
    () =>
      product?.imageUrls && product.imageUrls.length > 0
        ? product.imageUrls
        : [FALLBACK_IMAGE],
    [product],
  );

  const hasFamilyCardPlans = (product?.familyCardPlans?.length || 0) > 0;
  const hasValueAddedSkus = (product?.valueAddedSkus?.length || 0) > 0;
  const showFamilyCardPlans = product?.type === 'FAMILY_CARD' && hasFamilyCardPlans;
  const showValueAddedSkus = product?.type === 'VALUE_ADDED_SERVICE' && hasValueAddedSkus;

  const selectedFamilyPlan = useMemo(
    () => (product?.familyCardPlans || []).find((p) => p.id === selectedFamilyPlanId) || null,
    [product, selectedFamilyPlanId],
  );

  const selectedValueAddedSku = useMemo(
    () => (product?.valueAddedSkus || []).find((s) => s.id === selectedValueAddedSkuId) || null,
    [product, selectedValueAddedSkuId],
  );

  const displayPriceCents = useMemo(() => {
    if (selectedFamilyPlan) return selectedFamilyPlan.priceCents;
    if (selectedValueAddedSku) return selectedValueAddedSku.priceCents;
    return minPriceCents;
  }, [selectedFamilyPlan, selectedValueAddedSku, minPriceCents]);

  useEffect(() => {
    if (!product) return;
    const enabledPlans = (product.familyCardPlans || []).filter((p) => p.enabled);
    const enabledSkus = (product.valueAddedSkus || []).filter((s) => s.enabled);

    if (product.type === 'FAMILY_CARD') {
      if (enabledPlans.length === 1) {
        setSelectedFamilyPlanId(enabledPlans[0].id);
      } else if (selectedFamilyPlanId && !enabledPlans.some((p) => p.id === selectedFamilyPlanId)) {
        setSelectedFamilyPlanId(null);
      }
      return;
    }

    if (product.type === 'VALUE_ADDED_SERVICE') {
      if (enabledSkus.length === 1) {
        setSelectedValueAddedSkuId(enabledSkus[0].id);
      } else if (selectedValueAddedSkuId && !enabledSkus.some((s) => s.id === selectedValueAddedSkuId)) {
        setSelectedValueAddedSkuId(null);
      }
    }
  }, [product, selectedFamilyPlanId, selectedValueAddedSkuId]);

  const copyContactPhone = async () => {
    const contactPhone = product?.contactPhone || '';
    if (!contactPhone) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(contactPhone);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = contactPhone;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      window.alert('联系电话已复制');
    } catch {
      window.alert('复制失败，请稍后重试');
    }
  };

  const buildCreateOrderPayload = (): { payload?: CreateOrderRequest; error?: string } => {
    if (!product) {
      return { error: '商品信息加载中，请稍后重试' };
    }

    if (product.type === 'FAMILY_CARD') {
      const enabledPlans = (product.familyCardPlans || []).filter((plan) => plan.enabled);
      if (enabledPlans.length === 0) {
        return { error: '当前没有可购买的家庭卡套餐' };
      }
      const chosenPlan =
        enabledPlans.find((plan) => plan.id === selectedFamilyPlanId)
        || (enabledPlans.length === 1 ? enabledPlans[0] : null);
      if (!chosenPlan) {
        return { error: '请先选择家庭卡套餐后再下单' };
      }
      if (!chosenPlan.priceCents || chosenPlan.priceCents < 1) {
        return { error: '套餐金额无效，请重新选择' };
      }
      return {
        payload: {
          productType: 'FAMILY_CARD',
          productId: product.id,
          durationType: chosenPlan.durationType,
          amountCents: chosenPlan.priceCents,
        },
      };
    }

    if (product.type === 'VALUE_ADDED_SERVICE') {
      const enabledSkus = (product.valueAddedSkus || []).filter((sku) => sku.enabled);
      if (enabledSkus.length === 0) {
        return { error: '当前没有可购买的增值服务' };
      }
      const chosenSku =
        enabledSkus.find((sku) => sku.id === selectedValueAddedSkuId)
        || (enabledSkus.length === 1 ? enabledSkus[0] : null);
      if (!chosenSku) {
        return { error: '请先选择增值服务后再下单' };
      }
      if (!chosenSku.priceCents || chosenSku.priceCents < 1) {
        return { error: '服务金额无效，请重新选择' };
      }
      return {
        payload: {
          productType: 'VALUE_ADDED_SERVICE',
          productId: product.id,
          amountCents: chosenSku.priceCents,
        },
      };
    }

    return { error: '当前商品类型暂不支持下单' };
  };

  const handleCreateOrder = async () => {
    setOrderError('');

    const token = getWeixinAccessToken();
    if (!token) {
      setOrderError('请先登录后再购买');
      return;
    }

    const { payload, error } = buildCreateOrderPayload();
    if (error || !payload) {
      setOrderError(error || '请选择商品后再下单');
      return;
    }

    setCreatingOrder(true);
    try {
      const result = await weixinApi.createOrder(payload, token);
      window.alert(`订单创建成功，订单号：${result.orderNo}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建订单失败，请稍后重试';
      setOrderError(message);
    } finally {
      setCreatingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest pb-24">
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md z-50 flex items-center justify-between px-4 border-b border-outline-variant/30">
        <button
          onClick={() => setCurrentPage('home')}
          className="w-10 h-10 flex items-center justify-center rounded-full active:bg-surface-container transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-on-surface" />
        </button>
        <div className="flex items-center space-x-2">
          <button className="w-10 h-10 flex items-center justify-center rounded-full active:bg-surface-container transition-colors">
            <Share2 className="w-5 h-5 text-on-surface" />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-full active:bg-surface-container transition-colors">
            <Heart className="w-5 h-5 text-on-surface" />
          </button>
        </div>
      </header>

      <div className="pt-16">
        <div className="aspect-[4/3] w-full overflow-hidden relative">
          <img
            src={imageUrls[currentImageIndex] || imageUrls[0]}
            alt={product?.title || '商品图片'}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src = FALLBACK_IMAGE;
            }}
          />
          <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold">
            {currentImageIndex + 1} / {imageUrls.length}
          </div>
        </div>
        {imageUrls.length > 1 && (
          <div className="flex items-center justify-center mt-3 space-x-2">
            {imageUrls.map((img, idx) => (
              <button
                key={img + idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${idx === currentImageIndex ? 'w-6 bg-primary' : 'w-1.5 bg-outline-variant opacity-40'}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="px-5 py-6 space-y-4">
        {loading && <div className="text-xs text-on-surface-variant">正在加载商品详情...</div>}
        {!!errorMessage && <div className="text-xs text-red-500">{errorMessage}</div>}

        <div className="space-y-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">
              {product?.type === 'FAMILY_CARD' ? '家庭卡' : '增值服务'}
            </span>
            {!!product?.top && (
              <span className="bg-[#FF8C00]/10 text-[#FF8C00] text-[10px] px-2 py-0.5 rounded-full font-bold">置顶</span>
            )}
            {!!product?.publishStatus && (
              <span className="bg-surface-container text-on-surface-variant text-[10px] px-2 py-0.5 rounded-full font-medium">{product.publishStatus}</span>
            )}
            <span className="text-[10px] text-on-surface-variant">编号: {product?.productNo || '--'}</span>
          </div>
          <h1 className="text-xl font-bold text-on-surface leading-tight">{product?.title || '商品详情'}</h1>
          <p className="text-sm text-on-surface-variant font-medium">{product?.subtitle || '暂无副标题'}</p>
        </div>

        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-primary">{formatPrice(displayPriceCents || 0)}</span>
          <span className="text-xs text-on-surface-variant">起</span>
        </div>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-on-surface flex items-center">
            <div className="w-1 h-4 bg-primary rounded-full mr-2" />
            商品详情
          </h2>
          <div className="text-sm text-on-surface-variant leading-relaxed bg-surface-container/30 p-4 rounded-2xl">
            {product?.detailContent || '暂无商品详情'}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-on-surface flex items-center">
            <div className="w-1 h-4 bg-primary rounded-full mr-2" />
            服务时间
          </h2>
          <div className="text-sm text-on-surface-variant flex items-center space-x-2">
            <span className="font-bold">有效期</span>
            <span>{product ? `${formatDateTime(product.serviceStartAt)} 至 ${formatDateTime(product.serviceEndAt)}` : '--'}</span>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-on-surface flex items-center">
            <div className="w-1 h-4 bg-primary rounded-full mr-2" />
            联系方式
          </h2>
          <div className="bg-surface-container/30 p-4 rounded-2xl space-y-2 text-sm text-on-surface-variant">
            <div>联系人：{product?.contactName || '--'}</div>
            <button
              onClick={copyContactPhone}
              className="text-left text-primary font-medium underline underline-offset-2"
            >
              联系电话：{product?.contactPhone || '--'}（点击复制）
            </button>
          </div>
        </section>

        {showFamilyCardPlans && (
          <section className="space-y-3">
            <h2 className="text-base font-bold text-on-surface flex items-center">
              <div className="w-1 h-4 bg-primary rounded-full mr-2" />
              家庭卡套餐
            </h2>
            <div className="overflow-x-auto pb-1">
              <div className="flex items-stretch gap-3 min-w-max">
                {(product?.familyCardPlans || []).map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => {
                      if (!plan.enabled) return;
                      setSelectedFamilyPlanId(plan.id);
                    }}
                    className={`w-28 aspect-square shrink-0 rounded-2xl border p-2.5 shadow-sm flex flex-col justify-between transition-all ${
                      selectedFamilyPlanId === plan.id
                        ? 'ring-2 ring-primary border-primary bg-primary/5'
                        : ''
                    } ${
                      plan.enabled
                        ? 'bg-surface-container-lowest border-outline-variant/30'
                        : 'bg-surface-container border-outline-variant/40 opacity-80'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-on-surface leading-tight">{mapDurationType(plan.durationType)}</h4>
                      <p className="text-[10px] text-on-surface-variant">{plan.durationMonths}个月</p>
                      <p className="text-[9px] text-on-surface-variant">最大{plan.maxFamilyMembers}人</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-primary">{formatPrice(plan.priceCents)}</p>
                      {plan.enabled ? (
                        <button
                          type="button"
                          className={`w-full text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                            selectedFamilyPlanId === plan.id
                              ? 'bg-primary text-white border-primary'
                              : 'text-primary border-primary'
                          }`}
                        >
                          {selectedFamilyPlanId === plan.id ? '已选中' : '选择'}
                        </button>
                      ) : (
                        <p className="text-[9px] text-red-500 font-medium">暂不可购</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {showValueAddedSkus && (
          <section className="space-y-3">
            <h2 className="text-base font-bold text-on-surface flex items-center">
              <div className="w-1 h-4 bg-primary rounded-full mr-2" />
              增值服务
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {(product?.valueAddedSkus || []).map((sku) => (
                <div
                  key={sku.id}
                  onClick={() => {
                    if (!sku.enabled) return;
                    setSelectedValueAddedSkuId(sku.id);
                  }}
                  className={`bg-surface-container-lowest p-3 rounded-2xl border shadow-sm transition-all ${
                    selectedValueAddedSkuId === sku.id
                      ? 'ring-2 ring-primary border-primary bg-primary/5'
                      : 'border-outline-variant/30'
                  } ${!sku.enabled ? 'opacity-70' : ''}`}
                >
                  <h4 className="text-xs font-bold text-on-surface mb-1">{sku.title}</h4>
                  <p className="text-[9px] text-on-surface-variant mb-2 h-6">{sku.enabled ? '可购买' : '暂不可购买'}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary">{formatPrice(sku.priceCents)}</span>
                    {sku.enabled ? (
                      <button
                        type="button"
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          selectedValueAddedSkuId === sku.id
                            ? 'bg-primary text-white border-primary'
                            : 'text-primary border-primary'
                        }`}
                      >
                        {selectedValueAddedSkuId === sku.id ? '已选中' : '选择'}
                      </button>
                    ) : (
                      <span className="text-[9px] text-red-500">不可选</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-24 bg-white border-t border-outline-variant/30 px-6 flex items-center justify-between z-50">
        <div className="flex flex-col">
          <span className="text-[10px] text-on-surface-variant font-medium">合计</span>
          <span className="text-xl font-bold text-primary">
            {displayPriceCents > 0 ? formatPrice(displayPriceCents) : '--'}
          </span>
          {!!orderError && <span className="text-[10px] text-red-500 mt-1">{orderError}</span>}
        </div>
        <button
          type="button"
          onClick={handleCreateOrder}
          disabled={creatingOrder || loading || !product}
          className="bg-[#FF8C00] text-white px-10 py-3 rounded-full font-bold text-sm shadow-lg shadow-[#FF8C00]/20 active:scale-95 transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {creatingOrder ? '下单中...' : '确认购买'}
        </button>
      </div>
    </div>
  );
};

export default ProductDetailPage;
