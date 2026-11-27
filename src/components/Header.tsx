import { Camera } from 'lucide-react';
import type { AwardCategory } from '../types/award';

interface HeaderProps {
  activeCategory: 'all' | AwardCategory;
  onSelectCategory: (category: 'all' | AwardCategory) => void;
  onOpenCapture: () => void;
}

const NAV_ITEMS: { key: 'all' | AwardCategory; label: string }[] = [
  { key: 'all', label: '典藏總覽' },
  { key: 'trophy', label: '獎盃' },
  { key: 'medal', label: '獎牌' },
  { key: 'certificate', label: '獎狀' },
];

export function Header({
  activeCategory,
  onSelectCategory,
  onOpenCapture,
}: HeaderProps) {
  const handleNavClick = (category: 'all' | AwardCategory) => {
    onSelectCategory(category);
    const galleryEl = document.getElementById('archive-catalog');
    if (galleryEl) {
      galleryEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="no-print sticky top-0 z-30 border-b border-[#E5DFD3] bg-[#FBF9F5]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-6 py-4 sm:gap-6 lg:gap-8 lg:px-10">
        <a
          href="#top"
          className="min-w-0 font-serif text-base font-semibold leading-snug tracking-tight text-[#1C1917] sm:text-lg lg:whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#854D0E]"
        >
          宜蘭縣員山鄉七賢國小校園榮譽數位典藏
        </a>

        <nav
          aria-label="典藏分類導覽"
          className="hidden md:flex items-center gap-7 text-sm font-medium"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeCategory === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleNavClick(item.key)}
                className={`relative py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#854D0E] ${
                  isActive
                    ? 'text-[#1C1917] font-semibold'
                    : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-0.5 h-[1.5px] bg-[#854D0E]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenCapture}
            className="inline-flex items-center gap-2 rounded-md bg-[#1C1917] px-4 py-2.5 text-sm font-medium text-[#FBF9F5] transition-colors hover:bg-[#292524] active:translate-y-px cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#854D0E]"
          >
            <Camera className="h-4 w-4" aria-hidden="true" />
            <span>拍照登錄獎項</span>
          </button>
        </div>
      </div>
    </header>
  );
}
