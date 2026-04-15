import React, { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Phone, Home } from 'lucide-react';
import { SiteProfileView, weixinApi } from '../api/weixin';
import { buildTencentMapUrl } from '../utils/mapNavigation';

interface SiteProfilePageProps {
  setCurrentPage: (page: any) => void;
}

const SiteProfilePage = ({ setCurrentPage }: SiteProfilePageProps) => {
  const [siteProfile, setSiteProfile] = useState<SiteProfileView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const home = await weixinApi.getHomeIndex();
        if (cancelled) return;
        setSiteProfile(home.siteProfile || null);
      } catch (e) {
        if (!cancelled) {
          setError('家庭详情加载失败，请稍后重试');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const openMap = () => {
    const mapUrl = buildTencentMapUrl({
      address: siteProfile?.address || '',
      latitude: siteProfile?.latitude,
      longitude: siteProfile?.longitude,
    });
    window.open(mapUrl, '_blank');
  };
  const copyContactPhone = async () => {
    const contactPhone = siteProfile?.contactPhone || '';
    if (!contactPhone) {
      window.alert('暂无可复制的联系电话');
      return;
    }
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
      window.alert('复制成功');
    } catch (e) {
      window.alert('复制失败，请稍后重试');
    }
  };

  return (
    <main className="pt-20 pb-24 px-4 max-w-md mx-auto min-h-screen">
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md z-40 flex items-center px-4 border-b border-outline-variant/30">
        <button onClick={() => setCurrentPage('home')} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-surface-container transition-colors">
          <ArrowLeft className="w-5 h-5 text-on-surface" />
        </button>
        <h1 className="ml-2 text-base font-bold text-on-surface">家庭详情</h1>
      </header>

      {loading && <p className="text-xs text-on-surface-variant">正在加载家庭详情...</p>}
      {!!error && <p className="text-xs text-red-500">{error}</p>}

      {!loading && !error && (
        <section className="space-y-4">
          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Home className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-on-surface">{siteProfile?.communityName || '家庭简介'}</h2>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">
              {siteProfile?.introText || '暂无简介'}
            </p>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm space-y-3">
            <button
              onClick={copyContactPhone}
              className="w-full text-left flex items-center space-x-2 rounded-xl bg-surface-container px-3 py-3 active:scale-[0.99] transition-transform"
            >
              <Phone className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-on-surface">{siteProfile?.contactPhone || '--'}</span>
            </button>
            <button
              onClick={openMap}
              className="w-full text-left flex items-start space-x-2 rounded-xl bg-surface-container px-3 py-3 active:scale-[0.99] transition-transform"
            >
              <MapPin className="w-4 h-4 text-primary mt-0.5" />
              <span className="text-sm text-on-surface-variant leading-relaxed">{siteProfile?.address || '--'}</span>
            </button>
          </div>
        </section>
      )}
    </main>
  );
};

export default SiteProfilePage;
