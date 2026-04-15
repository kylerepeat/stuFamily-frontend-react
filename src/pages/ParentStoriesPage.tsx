import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Plus, MessageCircle, Quote, X, Send, User } from 'lucide-react';
import {
  getWeixinAccessToken,
  getWeixinUserProfile,
  ParentMessageReplyView,
  ParentMessageView,
  weixinApi,
} from '../api/weixin';

interface Reply {
  id: number;
  author: string;
  content: string;
  date: string;
}

interface Story {
  id: number;
  author: string;
  content: string;
  date: string;
  color: string;
  createdAtRaw: string;
  replies?: Reply[];
}

interface ParentStoriesPageProps {
  setCurrentPage: (page: any) => void;
}

const CARD_COLORS = [
  'bg-rose-50 text-rose-600 border-rose-100',
  'bg-blue-50 text-blue-600 border-blue-100',
  'bg-emerald-50 text-emerald-600 border-emerald-100',
  'bg-amber-50 text-amber-600 border-amber-100',
];
const MAX_MESSAGE_LENGTH = 200;
const MESSAGE_ALLOWED_REGEX = /^[A-Za-z0-9\u4E00-\u9FA5，。！？、；：,.!?'"“”‘’（）()【】《》\-—_+@#%&*\/=]+$/;

const formatDateOnly = (raw: string) => {
  if (!raw) return '--';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return raw.split('T')[0] || raw;
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const mapReply = (reply: ParentMessageReplyView): Reply => ({
  id: reply.id,
  author: reply.nickname || '匿名用户',
  content: reply.content || '',
  date: formatDateOnly(reply.createdAt),
});

const mapStory = (message: ParentMessageView, index: number): Story => ({
  id: message.id,
  author: message.nickname || '微信用户',
  content: message.content || '',
  date: formatDateOnly(message.createdAt),
  createdAtRaw: message.createdAt || '',
  color: CARD_COLORS[index % CARD_COLORS.length],
  replies: (message.replies || []).map(mapReply),
});

const ParentStoriesPage = ({ setCurrentPage }: ParentStoriesPageProps) => {
  const profile = useMemo(() => getWeixinUserProfile(), []);
  const WECHAT_NICKNAME = profile?.nickname || '微信用户';
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [message, setMessage] = useState('');
  const [stories, setStories] = useState<Story[]>([]);

  useEffect(() => {
    let cancelled = false;
    const loadStories = async () => {
      const token = getWeixinAccessToken();
      if (!token) {
        if (!cancelled) setStories([]);
        return;
      }
      try {
        const page = await weixinApi.getMyHomeMessages({ pageNo: 1, pageSize: 100 }, token);
        if (cancelled) return;
        const sorted = (page.items || [])
          .slice()
          .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
        setStories(sorted.map((item, idx) => mapStory(item, idx)));
      } catch (error) {
        console.error('Failed to load home messages:', error);
        if (!cancelled) setStories([]);
      }
    };
    loadStories();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async () => {
    const content = message;
    if (!content || content.trim().length === 0) {
      window.alert('诉说内容不能为空');
      return;
    }
    if (/\s/.test(content)) {
      window.alert('诉说内容不能包含空白字符');
      return;
    }
    if (content.length > MAX_MESSAGE_LENGTH) {
      window.alert('诉说内容不能超过200字');
      return;
    }
    if (!MESSAGE_ALLOWED_REGEX.test(content)) {
      window.alert('诉说内容包含非法字符');
      return;
    }

    const token = getWeixinAccessToken();
    if (!token) {
      window.alert('请先登录后再提交');
      return;
    }

    try {
      const created = await weixinApi.createHomeMessage({ content }, token);
      const story = mapStory(created, 0);
      setStories((prev) => [story, ...prev]);
      setMessage('');
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Failed to create home message:', error);
      window.alert('提交失败，请稍后重试');
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest pb-32">
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md z-50 flex items-center px-4 border-b border-outline-variant/30">
        <button
          onClick={() => setCurrentPage('home')}
          className="w-10 h-10 flex items-center justify-center rounded-full active:bg-surface-container transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-on-surface" />
        </button>
        <h1 className="ml-2 text-lg font-bold text-on-surface">家人诉说</h1>
      </header>

      <main className="pt-20 px-4 space-y-6 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 text-on-surface-variant">
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs font-medium">共 {stories.length} 条诉说记录</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {stories.map((story) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setSelectedStory(story)}
              className={`aspect-square p-4 rounded-3xl border ${story.color} flex flex-col justify-between shadow-sm active:scale-95 transition-transform cursor-pointer group hover:shadow-md`}
            >
              <div className="relative">
                <Quote className="w-6 h-6 opacity-20 absolute -top-1 -left-1" />
                <p className="text-xs font-medium line-clamp-4 leading-relaxed relative z-10 pt-2">
                  {story.content}
                </p>
              </div>
              <div className="mt-2 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-bold opacity-80">{story.author}</p>
                  <p className="text-[8px] opacity-60">{story.date}</p>
                </div>
                {story.replies && story.replies.length > 0 && (
                  <div className="flex items-center space-x-1 opacity-60">
                    <MessageCircle className="w-3 h-3" />
                    <span className="text-[8px] font-bold">{story.replies.length}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {stories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant opacity-40">
            <MessageCircle className="w-12 h-12 mb-2" />
            <p className="text-sm">暂无诉说记录</p>
          </div>
        )}
      </main>

      <button
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 w-16 h-16 bg-primary text-white rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center active:scale-90 transition-transform z-40"
      >
        <Plus className="w-8 h-8" />
      </button>

      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-on-surface">发表诉说</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 -mr-2">
                  <X className="w-6 h-6 text-on-surface-variant" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant ml-1">您的昵称</label>
                  <div className="bg-surface-container/50 rounded-2xl p-4 flex items-center space-x-3 border border-outline-variant/10">
                    <User className="w-5 h-5 text-on-surface-variant" />
                    <span className="text-sm font-bold text-on-surface">{WECHAT_NICKNAME}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant ml-1">诉说内容</label>
                  <div className="bg-surface-container rounded-2xl p-4">
                    <textarea
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      maxLength={MAX_MESSAGE_LENGTH}
                      placeholder="请写下您想说的话..."
                      className="w-full bg-transparent outline-none text-sm placeholder:text-on-surface-variant/40 resize-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!message.trim()}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  <Send className="w-5 h-5" />
                  <span>提交</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedStory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStory(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className={`p-8 ${selectedStory.color} border-b-0`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{selectedStory.author}</p>
                      <p className="text-[10px] opacity-60">{selectedStory.date}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedStory(null)} className="p-2 -mr-2">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="relative">
                  <Quote className="w-8 h-8 opacity-10 absolute -top-2 -left-2" />
                  <p className="text-base font-medium leading-relaxed relative z-10 pt-2">
                    {selectedStory.content}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="flex items-center space-x-2 text-on-surface-variant border-b border-outline-variant/20 pb-2">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-xs font-bold">回复记录 ({selectedStory.replies?.length || 0})</span>
                </div>

                <div className="space-y-4">
                  {selectedStory.replies && selectedStory.replies.length > 0 ? (
                    selectedStory.replies.map((reply) => (
                      <div key={reply.id} className="bg-surface-container/30 p-4 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-primary">{reply.author}</span>
                          <span className="text-[10px] text-on-surface-variant/60">{reply.date}</span>
                        </div>
                        <p className="text-xs text-on-surface leading-relaxed">{reply.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-on-surface-variant/40 italic text-xs">
                      暂无回复
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ParentStoriesPage;
