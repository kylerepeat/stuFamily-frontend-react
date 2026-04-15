import React from 'react';
import { 
  ArrowLeft, 
  Bell, 
  MoreHorizontal, 
  ChevronLeft, 
  ChevronRight, 
  Zap, 
  Calendar, 
  Clock, 
  AlertCircle, 
  History, 
  Gift,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';

interface WalletPageProps {
  setCurrentPage: (page: 'home' | 'parents' | 'student-card' | 'wallet') => void;
}

const WalletPage = ({ setCurrentPage }: WalletPageProps) => {
  const billingHistory = [
    { id: 1, title: '1学期 充值', date: '2024-03-12 14:20', amount: '¥1,299', status: 'paid', icon: Calendar },
    { id: 2, title: '1个月 续费', date: '2024-02-10 09:15', amount: '¥299', status: 'paid', icon: Clock },
    { id: 3, title: '1年 尊享', date: '2024-01-05 18:30', amount: '¥2,499', status: 'unpaid', icon: AlertCircle },
    { id: 4, title: '1个月 充值', date: '2023-12-01 11:00', amount: '¥299', status: 'paid', icon: History },
  ];

  return (
    <main className="pt-20 pb-32 px-6 max-w-md mx-auto w-full min-h-screen space-y-10 bg-[#F6F6F6]">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md z-50 flex items-center justify-between px-6 border-b border-black/5">
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentPage('home')} className="p-1 active:scale-90 transition-transform">
            <ArrowLeft className="w-6 h-6 text-[#8C4A00]" />
          </button>
          <h1 className="font-serif text-[#8C4A00] text-lg font-bold tracking-wider">学子之家</h1>
        </div>
        <div className="flex gap-4">
          <Bell className="w-5 h-5 text-[#5A5C5C]" />
          <MoreHorizontal className="w-5 h-5 text-[#5A5C5C]" />
        </div>
      </header>

      {/* Hero Section */}
      <section className="space-y-6 mt-4">
        <header className="space-y-1">
          <h2 className="text-2xl font-black text-[#2D2F2F] tracking-tight">家长充值</h2>
        </header>
        
        <div className="relative">
          <label className="block text-xs font-bold text-[#7B4000] mb-2 ml-1">订阅计划</label>
          <div className="relative">
            <select className="appearance-none w-full bg-white border-2 border-[#FD8B00]/20 focus:border-[#FD8B00] focus:ring-0 rounded-xl px-4 py-5 text-lg font-bold text-[#2D2F2F] transition-all shadow-sm outline-none">
              <option value="1month">1个月 (¥299)</option>
              <option value="1semester" selected>1学期 (¥1,299) - 最受推荐</option>
              <option value="1year">1年 (¥2,499)</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronRight className="w-6 h-6 text-[#8C4A00] rotate-90" />
            </div>
          </div>
        </div>
      </section>

      {/* Date Selection */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-[#2D2F2F] border-l-4 border-[#FD8B00] pl-3">选择充值日期</h3>
        <div className="bg-[#FFD709]/10 p-8 rounded-2xl flex flex-col items-center justify-center space-y-4 relative overflow-hidden group border border-[#FFD709]/20">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FFD709]/10 to-transparent pointer-events-none"></div>
          <div className="text-center relative z-10">
            <div className="text-5xl font-black text-[#453900] tracking-tighter">09</div>
            <div className="text-[10px] font-bold text-[#453900]/60 uppercase tracking-widest mt-1">SEPTEMBER</div>
          </div>
          <div className="flex items-center gap-6 text-[#453900] font-serif relative z-10">
            <ChevronLeft className="w-5 h-5 cursor-pointer hover:scale-110 transition-transform" />
            <span className="text-lg font-bold">2024年 9月</span>
            <ChevronRight className="w-5 h-5 cursor-pointer hover:scale-110 transition-transform" />
          </div>
          <button className="bg-white/80 backdrop-blur-sm px-6 py-2 rounded-full text-[10px] font-bold text-[#2D2F2F] shadow-sm hover:bg-white transition-colors relative z-10">
            修改起始日
          </button>
        </div>
      </section>

      {/* Action Button */}
      <section className="flex flex-col items-center pt-4">
        <button className="w-full py-5 bg-gradient-to-r from-[#8C4A00] to-[#FD8B00] text-white text-xl font-black rounded-2xl shadow-[0_12px_24px_rgba(140,74,0,0.25)] active:scale-[0.98] transition-all duration-300 tracking-widest flex items-center justify-center gap-3">
          <Zap className="w-6 h-6 fill-current" />
          立即充值
        </button>
        <p className="text-[10px] text-[#5A5C5C] mt-4 text-center px-8 opacity-60 leading-relaxed">
          点击即代表您同意《学子之家会员服务协议》及《隐私政策》
        </p>
      </section>

      {/* Billing History */}
      <section className="space-y-6 pb-10">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#2D2F2F] border-l-4 border-[#FD8B00] pl-3">历史账单</h3>
          <span className="text-[10px] font-bold text-[#7B4000] flex items-center gap-1 cursor-pointer">
            查看全部 <ArrowRight className="w-3 h-3" />
          </span>
        </div>
        
        <div className="space-y-4">
          {billingHistory.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow border border-black/5">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${item.status === 'paid' ? 'bg-[#F6F6F6]' : 'bg-red-50'}`}>
                  <item.icon className={`w-6 h-6 ${item.status === 'paid' ? 'text-[#7B4000]' : 'text-red-500'}`} />
                </div>
                <div>
                  <div className="font-bold text-sm text-[#2D2F2F]">{item.title}</div>
                  <div className="text-[10px] text-[#5A5C5C] mt-0.5">{item.date}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-black text-[#2D2F2F]">{item.amount}</div>
                <div className={`text-[10px] font-bold flex items-center justify-end gap-1 mt-1 ${item.status === 'paid' ? 'text-emerald-600' : 'text-red-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'paid' ? 'bg-emerald-600' : 'bg-red-500'}`}></span>
                  {item.status === 'paid' ? '已支付' : '未支付'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Floating Banner */}
      <div className="fixed bottom-24 right-6 bg-[#FD8B00] text-white px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-[10px] font-bold animate-pulse cursor-pointer z-30">
        <Gift className="w-4 h-4" />
        限时返现已开启
      </div>
    </main>
  );
};

export default WalletPage;
