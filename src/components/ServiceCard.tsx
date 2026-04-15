import React from 'react';
import { CakeSlice, Wand2, Car, Camera, Gift, Sparkles, Home } from 'lucide-react';

interface ServiceCardProps {
  id: number;
  type: number;
  title: string;
  price: string;
  originalPrice?: string;
  tags: string[];
  onClick?: () => void;
}

const ServiceCard = React.memo(({ 
  id,
  type, 
  title, 
  price, 
  originalPrice, 
  tags,
  onClick
}: ServiceCardProps) => {
  const serviceConfigs: Record<number, { icon: any, color: string }> = {
    1: { icon: CakeSlice, color: 'bg-rose-50 text-rose-500' },
    2: { icon: Wand2, color: 'bg-indigo-50 text-indigo-500' },
    3: { icon: Car, color: 'bg-blue-50 text-blue-500' },
    4: { icon: Camera, color: 'bg-amber-50 text-amber-500' },
    5: { icon: Gift, color: 'bg-emerald-50 text-emerald-500' },
    6: { icon: Sparkles, color: 'bg-purple-50 text-purple-500' },
  };

  const config = serviceConfigs[type] || { icon: Home, color: 'bg-surface-container text-primary' };
  const Icon = config.icon;

  return (
    <section 
      onClick={onClick}
      className="bg-surface-container-lowest p-4 rounded-2xl flex items-start space-x-4 shadow-sm active:scale-[0.99] transition-transform cursor-pointer"
    >
      <div className={`w-24 h-28 rounded-xl flex-shrink-0 flex items-center justify-center ${config.color} shadow-inner`}>
        <Icon className="w-10 h-10 stroke-[1.2]" />
      </div>
      <div className="flex-1 flex flex-col justify-between min-h-[112px]">
        <div>
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-bold text-on-surface leading-snug line-clamp-2">
              {title}
            </h3>
            <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ml-2">
              详情
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag, i) => (
              <span key={i} className="text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-end justify-between mt-2">
          <div>
            <span className="text-primary font-bold text-xl">{price}</span>
            {!!originalPrice && (
              <span className="text-[10px] text-outline-variant line-through ml-1">{originalPrice}</span>
            )}
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
            className="bg-[#FF8C00] text-white px-5 py-2 rounded-full text-[11px] font-bold shadow-sm active:scale-95 transition-transform"
          >
            立刻购买
          </button>
        </div>
      </div>
    </section>
  );
});

export default ServiceCard;
