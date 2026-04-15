/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { Home, Users, Heart, ChevronRight, Star, Loader2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FamilyMemberView,
  getWeixinAccessToken,
  getWeixinUserProfile,
  onWeixinAuthExpired,
  setWeixinAccessToken,
  setWeixinUserProfile,
  weixinApi,
} from './api/weixin';

const addOneMonth = (dateText: string): string => {
  const date = new Date(`${dateText}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateText;
  date.setMonth(date.getMonth() + 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getTodayLocalDate = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const DEFAULT_AVATAR = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="60" fill="#EEF2F7"/><circle cx="60" cy="46" r="20" fill="#C6CEDA"/><path d="M24 102c5-17 19-27 36-27s31 10 36 27" fill="#C6CEDA"/></svg>',
)}`;

type MockLoginConfig = {
  enabled: boolean;
  token: string;
  nickname: string;
  avatarUrl: string;
};

const isTruthyParam = (value: string | null): boolean => {
  if (value === null) return false;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
};

const resolveMockLoginConfig = (): MockLoginConfig => {
  if (typeof window === 'undefined') {
    return {
      enabled: false,
      token: '',
      nickname: '',
      avatarUrl: '',
    };
  }

  const query = new URLSearchParams(window.location.search);
  const enabled = isTruthyParam(query.get('mock_login')) || isTruthyParam(query.get('mockLogin'));
  return {
    enabled,
    token: query.get('mock_token') || query.get('mockToken') || 'mock-weixin-access-token',
    nickname: query.get('mock_nickname') || query.get('mockNickname') || 'Mock微信用户',
    avatarUrl: query.get('mock_avatar') || query.get('mockAvatar') || '',
  };
};

const resolveWechatLoginCode = (): string => {
  if (typeof window === 'undefined') return '';
  const query = new URLSearchParams(window.location.search);
  return query.get('code') || query.get('wx_code') || '';
};

const clearWechatCodeFromUrl = () => {
  if (typeof window === 'undefined') return;
  const query = new URLSearchParams(window.location.search);
  const hasCode = query.has('code') || query.has('wx_code');
  if (!hasCode) return;
  query.delete('code');
  query.delete('wx_code');
  query.delete('state');
  const nextQuery = query.toString();
  const nextPath = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`;
  window.history.replaceState({}, '', nextPath);
};

const HomePage = lazy(() => import('./pages/HomePage'));
const ParentsPage = lazy(() => import('./pages/ParentsPage'));
const StudentCardPage = lazy(() => import('./pages/StudentCardPage'));
const FamilyManagementPage = lazy(() => import('./pages/FamilyManagementPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const ParentStoriesPage = lazy(() => import('./pages/ParentStoriesPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SiteProfilePage = lazy(() => import('./pages/SiteProfilePage'));

const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
    <Loader2 className="w-10 h-10 text-primary animate-spin" />
    <p className="text-xs text-on-surface-variant font-medium animate-pulse">正在加载页面...</p>
  </div>
);

type PageId = 'home' | 'parents' | 'student-card' | 'family' | 'product-detail' | 'stories' | 'profile' | 'site-profile';

export default function App() {
  const defaultStartDate = useMemo(() => getTodayLocalDate(), []);
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>(undefined);
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(() => addOneMonth(defaultStartDate));
  const [showLogin, setShowLogin] = useState(false);
  const [productReloadSignal, setProductReloadSignal] = useState(0);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [selectedFamilyMember, setSelectedFamilyMember] = useState<FamilyMemberView | null>(null);
  const [studentCardBackPage, setStudentCardBackPage] = useState<'parents' | 'family'>('parents');

  const startInputRef = React.useRef<HTMLInputElement>(null);
  const endInputRef = React.useRef<HTMLInputElement>(null);
  const mockLoginConfig = useMemo(() => resolveMockLoginConfig(), []);

  const isProtectedPage = (page: PageId) => page === 'parents' || page === 'family' || page === 'profile';

  useEffect(() => {
    if (!mockLoginConfig.enabled || getWeixinAccessToken()) return;
    setWeixinAccessToken(mockLoginConfig.token);
    setWeixinUserProfile({
      nickname: mockLoginConfig.nickname,
      avatarUrl: mockLoginConfig.avatarUrl,
    });
    setProductReloadSignal((prev) => prev + 1);
  }, [mockLoginConfig]);

  useEffect(() => {
    const unsubscribe = onWeixinAuthExpired(() => {
      setLoginError('登录状态已失效，请重新登录');
      setShowLogin(true);
      if (isProtectedPage(currentPage)) {
        setCurrentPage('home');
      }
    });
    return unsubscribe;
  }, [currentPage]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekDay = weekDays[date.getDay()];
    return `${month}月${day}日 ${weekDay}`;
  };

  const ensureLogin = (onAuthed: () => void) => {
    if (!getWeixinAccessToken()) {
      setShowLogin(true);
      return;
    }
    onAuthed();
  };

  const handleWechatLogin = async () => {
    setLoginLoading(true);
    setLoginError('');
    try {
      if (mockLoginConfig.enabled) {
        setWeixinAccessToken(mockLoginConfig.token);
        setWeixinUserProfile({
          nickname: mockLoginConfig.nickname,
          avatarUrl: mockLoginConfig.avatarUrl,
        });
        setShowLogin(false);
        setProductReloadSignal((prev) => prev + 1);
        return;
      }

      const code = resolveWechatLoginCode();
      if (!code) {
        setLoginError('未获取到微信登录凭证，请在微信环境重新进入页面');
        return;
      }
      const nickname = '微信用户';
      const avatarUrl = '';
      const loginResult = await weixinApi.login({ code, nickname, avatarUrl });
      if (!loginResult?.accessToken) {
        throw new Error('login response missing accessToken');
      }
      const existingProfile = getWeixinUserProfile();
      setWeixinAccessToken(loginResult.accessToken);
      setWeixinUserProfile({
        nickname: loginResult.username || nickname,
        avatarUrl: existingProfile?.avatarUrl || '',
      });
      clearWechatCodeFromUrl();
      setShowLogin(false);
      setProductReloadSignal((prev) => prev + 1);
    } catch (error) {
      console.error('wechat login failed:', error);
      setLoginError('登录失败，请稍后重试');
    } finally {
      setLoginLoading(false);
    }
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage
            startDate={startDate}
            endDate={endDate}
            startInputRef={startInputRef}
            endInputRef={endInputRef}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
            formatDate={formatDate}
            onProductClick={(id) => {
              ensureLogin(() => {
                setSelectedProductId(id);
                setCurrentPage('product-detail');
              });
            }}
            onStoriesClick={() => ensureLogin(() => setCurrentPage('stories'))}
            onSiteProfileClick={() => setCurrentPage('site-profile')}
            productReloadSignal={productReloadSignal}
          />
        );
      case 'product-detail':
        return <ProductDetailPage setCurrentPage={setCurrentPage} productId={selectedProductId} />;
      case 'stories':
        return <ParentStoriesPage setCurrentPage={setCurrentPage} />;
      case 'parents':
        if (!getWeixinAccessToken()) return null;
        return (
          <ParentsPage
            setCurrentPage={setCurrentPage}
            onSubmit={(member) => {
              setSelectedFamilyMember(member);
              setStudentCardBackPage('parents');
              setCurrentPage('student-card');
            }}
          />
        );
      case 'student-card':
        return <StudentCardPage setCurrentPage={setCurrentPage} member={selectedFamilyMember} backTo={studentCardBackPage} />;
      case 'family':
        if (!getWeixinAccessToken()) return null;
        return (
          <FamilyManagementPage
            onMemberCardClick={(member) => {
              setSelectedFamilyMember(member);
              setStudentCardBackPage('family');
              setCurrentPage('student-card');
            }}
          />
        );
      case 'profile':
        if (!getWeixinAccessToken()) return null;
        return <ProfilePage setCurrentPage={setCurrentPage} />;
      case 'site-profile':
        return <SiteProfilePage setCurrentPage={setCurrentPage} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md z-40 flex items-center justify-between px-4 border-b border-outline-variant/30">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xs">家</div>
          <h1 className="text-base font-bold text-on-surface">家政服务小程序</h1>
        </div>

        <div className="flex items-center bg-black/5 border border-black/10 rounded-full px-3 py-1.5 space-x-3">
          <div className="w-4 h-4 rounded-full border-2 border-on-surface/60 flex items-center justify-center">
            <div className="w-1 h-1 bg-on-surface/60 rounded-full" />
          </div>
          <div className="w-px h-3 bg-black/10" />
          <div className="w-4 h-4 rounded-full border-2 border-on-surface/60" />
        </div>
      </nav>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          <Suspense fallback={<PageLoader />}>{renderContent()}</Suspense>
        </motion.div>
      </AnimatePresence>

      {currentPage === 'home' && !getWeixinAccessToken() && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 w-full px-6 max-w-md">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={() => setShowLogin(true)}
            className="bg-primary-container text-on-primary-container px-6 py-3 rounded-full shadow-xl flex items-center justify-between cursor-pointer active:scale-95 transition-transform"
          >
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-xs font-bold tracking-wide">登录获取更多专属特权</span>
            </div>
            <ChevronRight className="w-4 h-4" />
          </motion.div>
        </div>
      )}

      <nav className="fixed bottom-0 w-full z-40 bg-background/90 backdrop-blur-lg border-t border-surface-container flex justify-around items-center h-20 pb-2">
        {[
          { icon: Home, label: '首页', id: 'home' as PageId },
          { icon: Users, label: '家人入口', id: 'parents' as PageId },
          { icon: Heart, label: '家庭管理', id: 'family' as PageId },
          { icon: User, label: '我', id: 'profile' as PageId },
        ].map((item, i) => (
          <div
            key={i}
            onClick={() => {
              if (isProtectedPage(item.id) && !getWeixinAccessToken()) {
                setShowLogin(true);
                return;
              }
              setCurrentPage(item.id);
            }}
            className={`flex flex-col items-center justify-center transition-colors cursor-pointer ${currentPage === item.id ? 'text-primary' : 'text-on-surface-variant opacity-60'}`}
          >
            <item.icon className={`w-6 h-6 ${currentPage === item.id ? 'fill-primary/20' : ''}`} />
            <span className="text-[10px] font-bold mt-1">{item.label}</span>
          </div>
        ))}
      </nav>

      <AnimatePresence>
        {showLogin && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !loginLoading && setShowLogin(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white rounded-t-[2rem] overflow-hidden shadow-2xl z-10"
            >
              <div className="p-8 pb-12">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-inner">家</div>
                  <div>
                    <h3 className="text-lg font-bold text-on-surface">家政服务小程序</h3>
                    <p className="text-xs text-on-surface-variant">申请使用您的微信头像、昵称</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between py-4 border-y border-outline-variant/30">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-surface-container rounded-full overflow-hidden">
                        <img src={DEFAULT_AVATAR} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-sm font-medium">微信用户</span>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col space-y-3">
                  <button
                    disabled={loginLoading}
                    onClick={handleWechatLogin}
                    className="w-full py-4 bg-[#07C160] hover:bg-[#06ae56] text-white rounded-2xl font-bold text-base transition-colors shadow-lg shadow-[#07C160]/20 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loginLoading ? '登录中...' : '允许'}
                  </button>
                  <button
                    disabled={loginLoading}
                    onClick={() => {
                      setShowLogin(false);
                      if (isProtectedPage(currentPage) && !getWeixinAccessToken()) {
                        setCurrentPage('home');
                      }
                    }}
                    className="w-full py-4 bg-surface-container text-on-surface-variant rounded-2xl font-bold text-base transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    拒绝
                  </button>
                </div>

                {!!loginError && <p className="mt-3 text-center text-[11px] text-red-500">{loginError}</p>}

                <p className="mt-8 text-center text-[11px] text-on-surface-variant/60 leading-relaxed">
                  授权即代表您同意 <span className="text-primary font-bold">《用户协议》</span> 及 <span className="text-primary font-bold">《隐私政策》</span>
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
