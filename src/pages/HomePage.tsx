import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Home, Phone, MessageSquare, Compass } from 'lucide-react';
import ServiceCard from '../components/ServiceCard';
import Carousel from '../components/Carousel';
import { HomeProductView, weixinApi } from '../api/weixin';
import { buildTencentMapUrl } from '../utils/mapNavigation';

const HOME_BANNER_CACHE_KEY = 'weixin_home_banner_images_cache';

interface HomePageProps {
  startDate: string;
  endDate: string;
  startInputRef: React.RefObject<HTMLInputElement>;
  endInputRef: React.RefObject<HTMLInputElement>;
  setStartDate: (val: string) => void;
  setEndDate: (val: string) => void;
  formatDate: (dateStr: string) => string;
  onProductClick: (id: number) => void;
  onStoriesClick: () => void;
  onSiteProfileClick: () => void;
  productReloadSignal: number;
}

const HomePage = ({
  startDate,
  endDate,
  startInputRef,
  endInputRef,
  setStartDate,
  setEndDate,
  formatDate,
  onProductClick,
  onStoriesClick,
  onSiteProfileClick,
  productReloadSignal,
}: HomePageProps) => {
  const defaultBannerImages = useMemo(
    () => [
      'https://images.unsplash.com/photo-1523240715630-9918c13d190c?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1581578731548-c64695cc6958?auto=format&fit=crop&q=80&w=800',
    ],
    [],
  );
  const [bannerImages, setBannerImages] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(HOME_BANNER_CACHE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as string[];
      return Array.isArray(parsed) ? parsed.filter((url) => typeof url === 'string' && url.trim()) : [];
    } catch {
      return [];
    }
  });
  const [bannerSlogan, setBannerSlogan] = useState('欢迎来到学子之家');
  const [siteName, setSiteName] = useState('当前位置');
  const [siteAddress, setSiteAddress] = useState('北京市海淀区西直门地铁站');
  const [siteLatitude, setSiteLatitude] = useState<number | null>(null);
  const [siteLongitude, setSiteLongitude] = useState<number | null>(null);
  const [siteContactPhone, setSiteContactPhone] = useState('');
  const [products, setProducts] = useState<HomeProductView[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const previousReloadSignalRef = useRef(productReloadSignal);

  useEffect(() => {
    let cancelled = false;
    const loadHomeIndex = async () => {
      try {
        const data = await weixinApi.getHomeIndex();
        if (cancelled) return;
        const fetchedBannerImages = (data.banners || []).map((b) => b.imageUrl).filter(Boolean).slice(0, 2);
        if (fetchedBannerImages.length > 0) {
          setBannerImages(fetchedBannerImages);
          try {
            localStorage.setItem(HOME_BANNER_CACHE_KEY, JSON.stringify(fetchedBannerImages));
          } catch {
            // Ignore localStorage write failures.
          }
        }
        if (data.bannerSlogan) setBannerSlogan(data.bannerSlogan);
        if (data.siteProfile?.communityName) setSiteName(data.siteProfile.communityName);
        if (data.siteProfile?.address) setSiteAddress(data.siteProfile.address);
        if (typeof data.siteProfile?.latitude === 'number' && Number.isFinite(data.siteProfile.latitude)) {
          setSiteLatitude(data.siteProfile.latitude);
        }
        if (typeof data.siteProfile?.longitude === 'number' && Number.isFinite(data.siteProfile.longitude)) {
          setSiteLongitude(data.siteProfile.longitude);
        }
        if (data.siteProfile?.contactPhone) setSiteContactPhone(data.siteProfile.contactPhone);
      } catch (error) {
        console.error('Failed to load home index:', error);
      }
    };
    loadHomeIndex();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadProducts = async () => {
      setLoadingProducts(true);
      const forceRefresh = previousReloadSignalRef.current !== productReloadSignal;
      previousReloadSignalRef.current = productReloadSignal;
      try {
        const data = await weixinApi.getHomeProducts({
          saleStartAt: startDate,
          saleEndAt: endDate,
        }, { forceRefresh });
        if (cancelled) return;
        setProducts(data || []);
      } catch (error) {
        console.error('Failed to load products:', error);
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    };
    loadProducts();
    return () => {
      cancelled = true;
    };
  }, [startDate, endDate, productReloadSignal]);

  const displayProducts = useMemo(
    () => products.slice().sort((a, b) => Number(b.top) - Number(a.top)),
    [products],
  );
  const carouselImages = useMemo(
    () => (bannerImages.length >= 2 ? bannerImages : defaultBannerImages),
    [bannerImages, defaultBannerImages],
  );

  const toPrice = (priceCents: number) => `¥${(priceCents / 100).toFixed(2)}`;
  const mapUrl = useMemo(
    () => buildTencentMapUrl({
      address: siteAddress,
      latitude: siteLatitude,
      longitude: siteLongitude,
    }),
    [siteAddress, siteLatitude, siteLongitude],
  );
  const copyContactPhone = async () => {
    if (!siteContactPhone) {
      window.alert('暂无可复制的联系电话');
      return;
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(siteContactPhone);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = siteContactPhone;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      window.alert('复制成功');
    } catch (error) {
      console.error('Failed to copy contact phone:', error);
      window.alert('复制失败，请稍后重试');
    }
  };

  return (
    <main className="pt-20 px-4 space-y-6 max-w-md mx-auto">
      {/* Hero Carousel */}
      <Carousel initialImages={carouselImages} />

      {/* Announcement Bar */}
      <div className="bg-tertiary-container/40 py-2.5 px-4 rounded-full flex items-center justify-center space-x-3 overflow-x-auto no-scrollbar">
        <span className="text-[10px] text-on-tertiary-container font-bold whitespace-nowrap">{bannerSlogan}</span>
      </div>

      {/* Location Module */}
      <section 
        onClick={() => window.open(mapUrl, '_blank')}
        className="bg-surface-container-lowest p-4 rounded-2xl flex items-center justify-between shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
      >
        <div className="flex-1 pr-4">
          <div className="flex items-center space-x-1 mb-1.5">
            <MapPin className="text-primary w-3.5 h-3.5" />
            <span className="text-[10px] text-on-surface-variant font-medium">{siteName}</span>
          </div>
          <h3 className="text-sm font-bold text-on-surface leading-tight">
            {siteAddress}
          </h3>
        </div>
        <div className="w-20 h-20 rounded-xl overflow-hidden bg-surface-container shadow-inner">
          <img 
            alt="Map Location" 
            className="w-full h-full object-cover opacity-80" 
            src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=200" 
            referrerPolicy="no-referrer"
          />
        </div>
      </section>

      {/* Quick Action Menu */}
      <nav className="grid grid-cols-4 gap-4">
        {[
          { icon: Home, label: '家庭简介', onClick: onSiteProfileClick },
          { icon: Phone, label: '联系家人', onClick: copyContactPhone },
          { icon: MessageSquare, label: '家人诉说', onClick: onStoriesClick },
          { 
            icon: Compass, 
            label: '地址导航', 
            onClick: () => window.open(mapUrl, '_blank')
          },
        ].map((item, i) => (
          <div 
            key={i} 
            onClick={item.onClick}
            className="flex flex-col items-center space-y-2 group cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl bg-secondary-container/20 flex items-center justify-center group-active:scale-90 transition-transform">
              <item.icon className="text-primary w-7 h-7" />
            </div>
            <span className="text-[10px] text-on-surface-variant font-medium">{item.label}</span>
          </div>
        ))}
      </nav>

      {/* Date Selector */}
      <section className="bg-[#FFCC33] p-5 rounded-2xl flex items-center justify-between text-[#453900] shadow-md relative">
        <div 
          onClick={() => {
            try {
              startInputRef.current?.showPicker();
            } catch (e) {
              startInputRef.current?.click();
            }
          }}
          className="flex-1 text-center cursor-pointer active:scale-95 transition-transform"
        >
          <p className="text-[10px] opacity-70 mb-1 font-medium">开始日期</p>
          <h4 className="text-sm font-bold">{formatDate(startDate)}</h4>
          <input 
            ref={startInputRef}
            type="date" 
            className="absolute inset-0 opacity-0 w-full h-full pointer-events-none" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="px-4 border-x border-[#453900]/10 text-center h-8 flex items-center">
          {/* Removed "共几晚" as requested */}
        </div>
        <div 
          onClick={() => {
            try {
              endInputRef.current?.showPicker();
            } catch (e) {
              endInputRef.current?.click();
            }
          }}
          className="flex-1 text-center cursor-pointer active:scale-95 transition-transform"
        >
          <p className="text-[10px] opacity-70 mb-1 font-medium">结束日期</p>
          <h4 className="text-sm font-bold">{formatDate(endDate)}</h4>
          <input 
            ref={endInputRef}
            type="date" 
            className="absolute inset-0 opacity-0 w-full h-full pointer-events-none" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </section>

      {/* Room List */}
      <div className="space-y-4">
        {loadingProducts && (
          <div className="text-center text-xs text-on-surface-variant py-4">正在加载商品...</div>
        )}
        {!loadingProducts && displayProducts.length === 0 && (
          <div className="text-center text-xs text-on-surface-variant py-4">当前日期范围暂无可售商品</div>
        )}
        {displayProducts.map((product, index) => (
          <ServiceCard
            key={product.id}
            id={product.id}
            type={(index % 6) + 1}
            title={product.title}
            price={toPrice(product.priceCents)}
            tags={[
              product.type === 'FAMILY_CARD' ? '家庭卡' : '增值服务',
              product.top ? '置顶推荐' : '精选服务',
            ]}
            onClick={() => onProductClick(product.id)}
          />
        ))}
      </div>
    </main>
  );
};

export default HomePage;
