import { ArrowDown, Award, Camera } from 'lucide-react';
import { useState } from 'react';
import { CATEGORY_LABELS } from '../types/award';
import type { AwardCategory, AwardRecord } from '../types/award';

interface HeroSectionProps {
  featuredAward: AwardRecord | null;
  counts: {
    total: number;
    trophy: number;
    medal: number;
    certificate: number;
  };
  onOpenCapture: () => void;
  onSelectAward: (award: AwardRecord) => void;
  onFilterCategory: (category: 'all' | AwardCategory) => void;
}

export function HeroSection({
  featuredAward,
  counts,
  onOpenCapture,
  onSelectAward,
  onFilterCategory,
}: HeroSectionProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const scrollToCatalog = (category?: 'all' | AwardCategory) => {
    if (category) {
      onFilterCategory(category);
    }
    const el = document.getElementById('archive-catalog');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section id="top" className="border-b border-[#E5DFD3] bg-[#FBF9F5]">
      <div className="mx-auto max-w-[1280px] px-6 py-10 lg:px-10 lg:py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-stretch">
          <div className="flex flex-col justify-between lg:col-span-6 lg:py-2">
            <div>
              <p className="text-xs font-medium tracking-[0.18em] text-[#854D0E]">
                宜蘭縣員山鄉七賢國小校園榮譽數位典藏
              </p>
              <h1
                className="mt-4 font-serif text-3xl font-semibold leading-[1.22] tracking-tight text-[#1C1917] sm:text-4xl lg:text-[2.75rem]"
                style={{ textWrap: 'balance' }}
              >
                讓每一座獎盃與獎狀，在數位典藏中恆久傳承
              </h1>
              <p className="mt-5 max-w-[54ch] text-[15px] leading-[1.75] text-[#57534E]">
                當實體展示櫥窗空間有限，透過現場拍照建檔與完整數位紀錄，將歷屆獎盃、獎牌與獎狀妥善典藏。完整保存獎項名稱、名次、獲獎日期與主辦單位，讓師生的榮耀隨時可查、永不遺失。
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-5">
              <button
                type="button"
                onClick={onOpenCapture}
                className="inline-flex items-center gap-2.5 rounded-md bg-[#1C1917] px-5 py-3 text-sm font-medium text-[#FBF9F5] transition-colors hover:bg-[#292524] cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#854D0E]"
              >
                <Camera className="h-4 w-4" aria-hidden="true" />
                <span>立即拍照建檔</span>
              </button>

              <button
                type="button"
                onClick={() => scrollToCatalog('all')}
                className="inline-flex items-center gap-1.5 py-2 text-sm font-medium text-[#44403C] underline decoration-[#D6CEBE] underline-offset-4 transition-colors hover:text-[#1C1917] hover:decoration-[#854D0E] cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>瀏覽全部典藏名錄</span>
                <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            {featuredAward ? (
              <div className="flex h-full flex-col justify-between border border-[#E5DFD3] bg-[#F4EFE6] p-4 sm:p-5">
                <button
                  type="button"
                  onClick={() => onSelectAward(featuredAward)}
                  className="group relative block aspect-[4/3] w-full overflow-hidden border border-[#E5DFD3] bg-[#FFFFFF] p-4 text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#854D0E]"
                >
                  {!imgFailed && featuredAward.imageUrl ? (
                    <img
                      src={featuredAward.imageUrl}
                      alt={featuredAward.awardName}
                      referrerPolicy="no-referrer"
                      onError={() => setImgFailed(true)}
                      className="h-full w-full object-contain transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#EBE6DF] to-[#DFD7C8] p-6 text-center">
                      <Award className="h-10 w-10 text-[#854D0E]" aria-hidden="true" />
                      <p className="mt-3 font-serif text-base font-medium text-[#1C1917]">
                        {featuredAward.awardName}
                      </p>
                    </div>
                  )}
                </button>

                <div className="mt-4 flex flex-col gap-1 border-t border-[#DFD7C8] pt-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-[#78716C] tabular-nums">
                      焦點典藏 · {featuredAward.accessionNumber} ·{' '}
                      {CATEGORY_LABELS[featuredAward.category]}
                    </p>
                    <h2 className="mt-1 truncate font-serif text-base font-semibold text-[#1C1917]">
                      {featuredAward.awardName}
                    </h2>
                  </div>
                  <p className="shrink-0 text-xs font-medium text-[#854D0E]">
                    {featuredAward.rank} · {featuredAward.awardDate}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center border border-[#E5DFD3] bg-[#F4EFE6] p-8 text-center">
                <Award className="h-10 w-10 text-[#854D0E]" aria-hidden="true" />
                <p className="mt-3 font-serif text-lg font-medium text-[#1C1917]">
                  尚未建立任何榮譽典藏
                </p>
                <p className="mt-1.5 text-sm text-[#57534E]">
                  點擊左側「立即拍照建檔」，為學校第一件獎盃或獎狀留下數位紀錄。
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Full-width 4-column Institutional KPI Strip */}
        <div className="mt-10 grid grid-cols-2 border-t border-b border-[#E5DFD3] sm:grid-cols-4">
          <button
            type="button"
            onClick={() => scrollToCatalog('all')}
            className="flex flex-col items-start border-r border-b border-[#E5DFD3] px-4 py-4 text-left transition-colors hover:bg-[#F4EFE6]/60 sm:border-b-0 cursor-pointer"
          >
            <span className="text-xs text-[#78716C]">典藏總件數</span>
            <span className="mt-1 font-mono text-2xl font-medium text-[#1C1917] tabular-nums">
              {counts.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => scrollToCatalog('trophy')}
            className="flex flex-col items-start border-b border-[#E5DFD3] px-4 py-4 text-left transition-colors hover:bg-[#F4EFE6]/60 sm:border-r sm:border-b-0 cursor-pointer"
          >
            <span className="text-xs text-[#78716C]">獎盃典藏</span>
            <span className="mt-1 font-mono text-2xl font-medium text-[#1C1917] tabular-nums">
              {counts.trophy}
            </span>
          </button>

          <button
            type="button"
            onClick={() => scrollToCatalog('medal')}
            className="flex flex-col items-start border-r border-[#E5DFD3] px-4 py-4 text-left transition-colors hover:bg-[#F4EFE6]/60 cursor-pointer"
          >
            <span className="text-xs text-[#78716C]">獎牌典藏</span>
            <span className="mt-1 font-mono text-2xl font-medium text-[#1C1917] tabular-nums">
              {counts.medal}
            </span>
          </button>

          <button
            type="button"
            onClick={() => scrollToCatalog('certificate')}
            className="flex flex-col items-start px-4 py-4 text-left transition-colors hover:bg-[#F4EFE6]/60 cursor-pointer"
          >
            <span className="text-xs text-[#78716C]">獎狀典藏</span>
            <span className="mt-1 font-mono text-2xl font-medium text-[#1C1917] tabular-nums">
              {counts.certificate}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
