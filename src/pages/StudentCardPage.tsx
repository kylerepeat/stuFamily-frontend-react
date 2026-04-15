import React from 'react';
import { ArrowLeft, BadgeCheck, GraduationCap, QrCode, User } from 'lucide-react';
import { motion } from 'motion/react';
import { FamilyMemberView } from '../api/weixin';

interface StudentCardPageProps {
  setCurrentPage: (page: 'home' | 'parents' | 'student-card' | 'family' | 'product-detail' | 'stories' | 'profile' | 'site-profile') => void;
  member?: FamilyMemberView | null;
  backTo?: 'parents' | 'family';
}

const statusTextMap: Record<string, string> = {
  ACTIVE: '正常',
  EXPIRED: '过期',
  CANCELLED: '已注销',
};

const formatJoinedAt = (value?: string) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const StudentCardPage = ({ setCurrentPage, member, backTo = 'parents' }: StudentCardPageProps) => {
  const holderName = member?.memberName || '家人';
  const cardNo = member?.studentOrCardNo || '--';
  const phone = member?.phone || '--';
  const status = statusTextMap[member?.status || ''] || member?.status || '正常';
  const joinedAt = formatJoinedAt(member?.joinedAt);
  const uniqueNo = member?.memberNo ? `NO. ${member.memberNo}` : 'NO. --';

  return (
    <main className="pt-20 pb-24 px-6 max-w-md mx-auto w-full min-h-screen">
      <div className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md z-50 flex items-center justify-between px-6 border-b border-black/5">
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentPage(backTo)} className="p-1 active:scale-90 transition-transform">
            <ArrowLeft className="w-6 h-6 text-[#8C4A00]" />
          </button>
          <h1 className="font-serif text-[#2D2F2F] text-xl font-bold">电子家人卡</h1>
        </div>
        <div className="p-1">
          <User className="w-6 h-6 text-[#8C4A00]" />
        </div>
      </div>

      <section className="mb-8 text-center mt-4">
        <h2 className="text-[#8C4A00] font-black text-3xl tracking-tight mb-2">家人身份认证</h2>
        <p className="text-[#5A5C5C] text-sm leading-relaxed">实名绑定 · 家庭共享 · 服务权益</p>
      </section>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative group"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-[#8C4A00] to-[#FD8B00] rounded-2xl blur opacity-10 transition duration-1000" />

        <div className="relative bg-white rounded-2xl overflow-hidden border border-black/5 shadow-2xl">
          <div className="h-2 w-full bg-gradient-to-r from-[#8C4A00] to-[#FD8B00]" />

          <div className="p-8 relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(#8C4A00 1px, transparent 0)', backgroundSize: '24px 24px' }}
            />

            <div className="flex justify-between items-start mb-10 relative z-10">
              <div className="flex flex-col">
                <span className="text-[#8C4A00] font-bold text-2xl tracking-widest">家庭服务</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#5A5C5C] opacity-70">Family Member Card</span>
              </div>
              <div className="w-12 h-12 rounded-full border border-[#8C4A00]/20 flex items-center justify-center bg-[#8C4A00]/5">
                <BadgeCheck className="w-7 h-7 text-[#8C4A00] fill-[#8C4A00]/10" />
              </div>
            </div>

            <div className="mb-8 relative z-10">
              <h3 className="text-[#2D2F2F] font-bold text-xl mb-1">电子家人卡</h3>
              <div className="h-[1px] w-12 bg-[#8C4A00]" />
            </div>

            <div className="space-y-4 mb-10 relative z-10">
              <div className="flex flex-col">
                <span className="text-[10px] text-[#8C4A00]/60 font-bold uppercase tracking-wider mb-1">Holder / 姓名</span>
                <span className="text-lg font-bold text-[#2D2F2F]">{holderName}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#8C4A00]/60 font-bold uppercase tracking-wider mb-1">Card No / 卡号</span>
                  <span className="text-sm font-medium text-[#2D2F2F] break-all">{cardNo}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#8C4A00]/60 font-bold uppercase tracking-wider mb-1">Status / 卡状态</span>
                  <span className="text-sm font-medium text-[#2D2F2F]">{status}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#8C4A00]/60 font-bold uppercase tracking-wider mb-1">Phone / 手机号</span>
                  <span className="text-sm font-medium text-[#2D2F2F]">{phone}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#8C4A00]/60 font-bold uppercase tracking-wider mb-1">Joined / 加入时间</span>
                  <span className="text-sm font-medium text-[#2D2F2F]">{joinedAt}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end border-t border-black/5 pt-6 relative z-10">
              <div className="flex flex-col">
                <span className="text-[10px] text-[#5A5C5C] mb-1">Unique Identifier</span>
                <span className="font-mono text-[10px] tracking-wider text-[#5A5C5C]">{uniqueNo}</span>
              </div>
              <div className="opacity-30 grayscale">
                <QrCode className="w-10 h-10 text-[#2D2F2F]" />
              </div>
            </div>

            <div className="absolute bottom-12 right-8 opacity-[0.03] pointer-events-none select-none">
              <GraduationCap className="w-32 h-32 text-[#8C4A00]" />
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
};

export default StudentCardPage;
