import { Download, FileSpreadsheet, Search, X } from 'lucide-react';
import type { AwardCategory } from '../types/award';

export type SortOption = 'date-desc' | 'date-asc' | 'accession-desc';

interface ArchiveToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeCategory: 'all' | AwardCategory;
  onCategoryChange: (category: 'all' | AwardCategory) => void;
  selectedYear: string;
  onYearChange: (year: string) => void;
  availableYears: string[];
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  resultCount: number;
  onExportCsv: () => void;
  onOpenImport: () => void;
}

const CATEGORY_TABS: { key: 'all' | AwardCategory; label: string }[] = [
  { key: 'all', label: '全部典藏' },
  { key: 'trophy', label: '獎盃' },
  { key: 'medal', label: '獎牌' },
  { key: 'certificate', label: '獎狀' },
];

export function ArchiveToolbar({
  searchQuery,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  selectedYear,
  onYearChange,
  availableYears,
  sortBy,
  onSortChange,
  resultCount,
  onExportCsv,
  onOpenImport,
}: ArchiveToolbarProps) {
  return (
    <div className="no-print space-y-5 border-b border-[#E5DFD3] pb-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#1C1917]">
            典藏名錄與檢索
          </h2>
          <p className="mt-1 text-sm text-[#78716C] tabular-nums">
            共顯示 {resultCount} 件數位榮譽紀錄
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            onClick={onOpenImport}
            className="inline-flex items-center gap-2 rounded-md border border-[#854D0E]/40 bg-[#F4EFE6] px-3.5 py-2 text-xs font-medium text-[#1C1917] transition-colors hover:border-[#854D0E] hover:bg-[#EBE6DF] cursor-pointer whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-[#854D0E]" aria-hidden="true" />
            <span>批次匯入 Excel／照片</span>
          </button>

          <button
            type="button"
            onClick={onExportCsv}
            disabled={resultCount === 0}
            className="inline-flex items-center gap-2 rounded-md border border-[#D6CEBE] bg-white px-3.5 py-2 text-xs font-medium text-[#1C1917] transition-colors hover:border-[#854D0E] hover:bg-[#F4EFE6] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>匯出清冊 (CSV)</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-md border border-[#E5DFD3] bg-[#F4EFE6] p-1">
          {CATEGORY_TABS.map((tab) => {
            const active = activeCategory === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onCategoryChange(tab.key)}
                className={`rounded px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-white text-[#1C1917] shadow-xs'
                    : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center lg:max-w-[680px]">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#78716C]"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="搜尋獎項名稱、名次、主辦單位、獲獎團隊..."
              aria-label="搜尋典藏紀錄"
              className="w-full rounded-md border border-[#D6CEBE] bg-white py-2 pr-8 pl-9 text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:border-[#854D0E] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="清除搜尋文字"
                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-[#78716C] hover:text-[#1C1917] cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={selectedYear}
              onChange={(e) => onYearChange(e.target.value)}
              aria-label="篩選獲獎年份"
              className="rounded-md border border-[#D6CEBE] bg-white px-3 py-2 text-sm text-[#1C1917] focus:border-[#854D0E] focus:outline-none cursor-pointer"
            >
              <option value="all">全部年份</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year} 年
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              aria-label="排序方式"
              className="rounded-md border border-[#D6CEBE] bg-white px-3 py-2 text-sm text-[#1C1917] focus:border-[#854D0E] focus:outline-none cursor-pointer"
            >
              <option value="date-desc">日期（新到舊）</option>
              <option value="date-asc">日期（舊到新）</option>
              <option value="accession-desc">典藏編號</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
