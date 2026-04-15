import React, { useEffect, useState } from 'react';
import { ChevronRight, Menu, Search, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { FamilyMemberView, weixinApi } from '../api/weixin';

interface FamilyManagementPageProps {
  onMemberCardClick: (member: FamilyMemberView) => void;
}

const statusStyleMap: Record<string, string> = {
  ACTIVE: 'bg-green-50 text-green-700 border-green-200',
  EXPIRED: 'bg-amber-50 text-amber-700 border-amber-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
};

const statusTextMap: Record<string, string> = {
  ACTIVE: '正常',
  EXPIRED: '过期',
  CANCELLED: '已注销',
};

const DEFAULT_AVATAR = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="#EEF2F7"/><circle cx="48" cy="36" r="16" fill="#C6CEDA"/><path d="M20 82c4-14 16-22 28-22s24 8 28 22" fill="#C6CEDA"/></svg>',
)}`;

const formatDate = (value?: string) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const shouldForceExpiredByGroup = (familyGroupExpireAt?: string) => {
  if (!familyGroupExpireAt) return false;
  const expireAt = new Date(familyGroupExpireAt);
  if (Number.isNaN(expireAt.getTime())) return false;
  return expireAt.getTime() < Date.now();
};

const getStatusKey = (member: FamilyMemberView) => {
  if (shouldForceExpiredByGroup(member.familyGroupExpireAt)) {
    return 'EXPIRED';
  }
  return member.status || 'ACTIVE';
};

const FamilyManagementPage = ({ onMemberCardClick }: FamilyManagementPageProps) => {
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [members, setMembers] = useState<FamilyMemberView[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingMemberNo, setDeletingMemberNo] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(keywordInput.trim());
    }, 300);
    return () => {
      clearTimeout(timer);
    };
  }, [keywordInput]);

  useEffect(() => {
    let cancelled = false;

    const loadMembers = async () => {
      setLoading(true);
      setErrorMessage('');
      try {
        const data = await weixinApi.listFamilyMembers({
          keyword: keyword || undefined,
          pageNo: 1,
          pageSize: 50,
        });
        if (cancelled) return;
        setMembers(data.items || []);
      } catch (error) {
        if (cancelled) return;
        setMembers([]);
        setErrorMessage('家人列表加载失败，请先登录或稍后重试');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadMembers();
    return () => {
      cancelled = true;
    };
  }, [keyword]);

  const handleDeleteMember = async (memberNo: string) => {
    const confirmed = window.confirm('确认删除这个家人吗？');
    if (!confirmed) return;

    setDeletingMemberNo(memberNo);
    setErrorMessage('');
    try {
      await weixinApi.cancelFamilyMember(memberNo);
      setMembers((prev) => prev.filter((item) => item.memberNo !== memberNo));
    } catch (error) {
      setErrorMessage('删除失败，请稍后重试');
    } finally {
      setDeletingMemberNo('');
    }
  };

  return (
    <main className="pt-20 pb-32 px-4 md:px-8 max-w-4xl mx-auto min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md z-50 flex items-center justify-between px-6 border-b border-outline-variant/30">
        <div className="flex items-center gap-3">
          <Menu className="w-5 h-5 text-on-surface-variant" />
          <h1 className="text-on-surface font-bold text-base">家人管理</h1>
        </div>
      </header>

      <section className="mt-5 mb-4">
        <div className="relative group">
          <input
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            className="w-full bg-surface-container border border-outline-variant/40 rounded-xl py-3.5 pl-11 pr-4 text-on-surface placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary/30 focus:outline-none transition-all"
            placeholder="搜索姓名或卡号"
            type="text"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary w-4 h-4" />
        </div>
      </section>

      {loading && <div className="text-center text-sm text-on-surface-variant py-6">正在加载家人列表...</div>}
      {!!errorMessage && <div className="text-center text-sm text-red-500 py-4">{errorMessage}</div>}
      {!loading && !errorMessage && members.length === 0 && (
        <div className="text-center text-sm text-on-surface-variant py-6">暂无家人数据</div>
      )}

      <div className="space-y-3">
        {members.map((member) => {
          const statusKey = getStatusKey(member);
          const statusText = statusTextMap[statusKey] || statusKey || '--';
          const avatarSrc = member.wechatAvatarUrl || DEFAULT_AVATAR;
          const isDeleting = deletingMemberNo === member.memberNo;

          return (
            <motion.div
              key={member.memberNo}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              role="button"
              tabIndex={0}
              onClick={() => onMemberCardClick(member)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onMemberCardClick(member);
                }
              }}
              className="bg-white rounded-2xl p-4 border border-outline-variant/30 shadow-sm cursor-pointer active:scale-[0.99] transition-transform"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={avatarSrc}
                    alt="avatar"
                    className="w-12 h-12 rounded-full object-cover bg-surface-container shrink-0"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== DEFAULT_AVATAR) {
                        target.src = DEFAULT_AVATAR;
                      }
                    }}
                  />
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-on-surface truncate">{member.memberName || '--'}</h2>
                    <p className="text-xs text-on-surface-variant truncate">卡号：{member.studentOrCardNo || '--'}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusStyleMap[statusKey] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                  {statusText}
                </span>
              </div>

              <div className="space-y-1.5">
                <p className="text-sm text-on-surface">手机号：{member.phone || '--'}</p>
                <p className="text-xs text-on-surface-variant">加入时间：{formatDate(member.joinedAt)}</p>
                <p className="text-xs text-on-surface-variant">过期时间：{formatDate(member.familyGroupExpireAt)}</p>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-outline-variant/30">
                <span className="text-xs text-primary font-semibold inline-flex items-center gap-1">
                  电子家人卡
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
                {statusKey === 'EXPIRED' && (
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMember(member.memberNo);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-full px-3 py-1.5 disabled:opacity-60"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {isDeleting ? '删除中...' : '删除'}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </main>
  );
};

export default FamilyManagementPage;
