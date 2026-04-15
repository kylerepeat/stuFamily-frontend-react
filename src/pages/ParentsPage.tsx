import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, User, GraduationCap, ShieldCheck, Calendar, Loader2 } from 'lucide-react';
import { FamilyGroupQuotaView, FamilyMemberView, getWeixinAccessToken, weixinApi } from '../api/weixin';

interface ParentsPageProps {
  setCurrentPage: (page: 'home' | 'parents' | 'student-card' | 'family' | 'product-detail' | 'stories' | 'profile' | 'site-profile') => void;
  onSubmit: (member: FamilyMemberView) => void;
}

const getTodayLocalDate = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatDateLabel = (dateText: string) => {
  const date = new Date(`${dateText}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return { md: '--/--', full: '--' };
  }
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return { md: `${month}/${day}`, full: dateText };
};

const toJoinedAtPayload = (dateText: string) => `${dateText}T00:00:00`;
const CARD_NO_REGEX = /^[A-Za-z0-9_-]+$/;
const PHONE_REGEX = /^\d{11}$/;

const resolveQuota = (quota: FamilyGroupQuotaView) => {
  const expireAt = quota.expireAt ? new Date(quota.expireAt) : null;
  const expiredByTime = !!expireAt && !Number.isNaN(expireAt.getTime()) && expireAt.getTime() < Date.now();
  const expiredByStatus = (quota.status || '').toUpperCase() === 'EXPIRED';
  if (!quota.hasActiveGroup || expiredByTime || expiredByStatus) {
    return { currentMembers: 0, availableMembers: 0 };
  }
  return {
    currentMembers: Math.max(0, quota.currentMembers || 0),
    availableMembers: Math.max(0, quota.availableMembers || 0),
  };
};

const ParentsPage = ({ setCurrentPage, onSubmit }: ParentsPageProps) => {
  const today = useMemo(() => getTodayLocalDate(), []);
  const [memberName, setMemberName] = useState('');
  const [studentOrCardNo, setStudentOrCardNo] = useState('');
  const [phone, setPhone] = useState('');
  const [joinedAt, setJoinedAt] = useState(today);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [currentMembers, setCurrentMembers] = useState(0);
  const [availableMembers, setAvailableMembers] = useState(0);

  const dateLabel = formatDateLabel(joinedAt);

  useEffect(() => {
    let cancelled = false;
    const loadQuota = async () => {
      if (!getWeixinAccessToken()) {
        setCurrentMembers(0);
        setAvailableMembers(0);
        return;
      }
      try {
        const quota = await weixinApi.getFamilyGroupQuota();
        if (cancelled) return;
        const normalized = resolveQuota(quota);
        setCurrentMembers(normalized.currentMembers);
        setAvailableMembers(normalized.availableMembers);
      } catch {
        if (cancelled) return;
        setCurrentMembers(0);
        setAvailableMembers(0);
      }
    };
    loadQuota();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async () => {
    const name = memberName.trim();
    const cardNo = studentOrCardNo.trim();
    const mobile = phone.trim();

    if (!name || !cardNo || !mobile || !joinedAt) {
      setSubmitError('请完整填写姓名、卡号/学号、手机号和申请日期');
      return;
    }
    if (!CARD_NO_REGEX.test(cardNo)) {
      setSubmitError('卡号/学号仅支持数字、英文字母、下划线(_)和短横线(-)');
      return;
    }
    if (!PHONE_REGEX.test(mobile)) {
      setSubmitError('手机号仅支持11位数字');
      return;
    }

    setSubmitLoading(true);
    setSubmitError('');
    try {
      const createdMember = await weixinApi.addFamilyMember({
        memberName: name,
        studentOrCardNo: cardNo,
        phone: mobile,
        joinedAt: toJoinedAtPayload(joinedAt),
      });
      onSubmit(createdMember);
    } catch {
      setSubmitError('提交申请失败，请稍后重试');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <main className="pt-20 pb-12 px-6 max-w-md mx-auto space-y-8">
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => setCurrentPage('home')} className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6 text-[#8B4513]" />
        </button>
        <h2 className="text-xl font-bold text-[#1A1A1A]">家人入口</h2>
        <div className="p-2 -mr-2">
          <User className="w-6 h-6 text-[#8B4513]" />
        </div>
      </div>

      <div className="text-center relative py-4">
        <div className="inline-block relative">
          <h1 className="text-4xl font-serif font-bold text-[#1A1A1A] tracking-tight">学子之家</h1>
          <div className="absolute -top-6 -right-24 bg-[#C1FFEB] px-3 py-1 rounded-full shadow-sm flex items-center space-x-1 rotate-[-5deg] border border-[#A0F0D0]">
            <GraduationCap className="w-3 h-3 text-[#2D5A4C]" />
            <span className="text-[10px] font-bold text-[#2D5A4C] whitespace-nowrap">STUDENT BENEFIT</span>
          </div>
        </div>
      </div>

      <section className="bg-white rounded-[3rem] p-8 shadow-sm space-y-6 border border-[#F0F0F0]">
        <div className="space-y-2">
          <label className="text-sm font-bold text-[#333333] ml-1">姓名</label>
          <div className="bg-[#F7F7F7] rounded-xl p-4">
            <input
              type="text"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="请输入家人姓名"
              className="w-full bg-transparent outline-none text-sm placeholder:text-[#CCCCCC]"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-[#333333] ml-1">卡号/学号</label>
          <div className="bg-[#F7F7F7] rounded-xl p-4 flex items-center justify-between">
            <input
              type="text"
              value={studentOrCardNo}
              onChange={(e) => setStudentOrCardNo(e.target.value)}
              pattern="[A-Za-z0-9_-]+"
              placeholder="请输入卡号/学号"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-[#CCCCCC]"
            />
            <ShieldCheck className="w-5 h-5 text-[#2D5A4C]" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-[#333333] ml-1">手机号</label>
          <div className="flex space-x-3">
            <div className="bg-[#F7F7F7] rounded-xl p-4 w-20 text-center">
              <span className="text-sm font-medium text-[#333333]">+86</span>
            </div>
            <div className="bg-[#F7F7F7] rounded-xl p-4 flex-1">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="numeric"
                maxLength={11}
                pattern="[0-9]{11}"
                placeholder="请输入手机号"
                className="w-full bg-transparent outline-none text-sm placeholder:text-[#CCCCCC]"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-bold text-[#333333] ml-1">申请日期</label>
          <div className="bg-[#FFD700] rounded-2xl p-6 text-center shadow-inner relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-[#8B4513]/60 tracking-widest mb-1">SELECTED ENTRY</p>
              <h4 className="text-5xl font-serif font-bold text-[#8B4513] leading-none">{dateLabel.md}</h4>
              <p className="mt-2 text-xs font-medium text-[#8B4513]/80">{dateLabel.full}</p>
            </div>
          </div>
          <div className="bg-[#F7F7F7] rounded-xl p-4 flex items-center justify-between">
            <input
              type="date"
              value={joinedAt}
              onChange={(e) => setJoinedAt(e.target.value)}
              className="w-full bg-transparent outline-none text-sm text-[#333333] font-serif"
            />
            <Calendar className="w-5 h-5 text-[#333333]" />
          </div>
          <p className="text-[10px] text-[#8B4513]/70 ml-1">默认当天：{today}</p>
        </div>

        {!!submitError && <p className="text-xs text-red-500">{submitError}</p>}
      </section>

      <div className="pt-4 space-y-2">
        <button
          onClick={handleSubmit}
          disabled={submitLoading}
          className="w-full py-5 bg-gradient-to-r from-[#D2691E] to-[#FF8C00] text-white rounded-2xl font-bold text-lg shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
        >
          {submitLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitLoading ? '提交中...' : '提交申请'}
        </button>
        <p className="text-center text-[10px] text-on-surface-variant/60 font-medium">
          当前家庭已有 <span className="text-primary font-bold">{currentMembers}</span> 人, 还能添加 <span className="text-primary font-bold">{availableMembers}</span> 人
        </p>
      </div>
    </main>
  );
};

export default ParentsPage;
