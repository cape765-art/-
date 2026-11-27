import { Award, Camera, CheckCircle2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArchiveToolbar } from './components/ArchiveToolbar';
import type { SortOption } from './components/ArchiveToolbar';
import { AwardCard } from './components/AwardCard';
import { AwardDetailModal } from './components/AwardDetailModal';
import { BatchImportModal } from './components/BatchImportModal';
import { CaptureModal } from './components/CaptureModal';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import type { AwardCategory, AwardPayload, AwardRecord } from './types/award';
import type { ParsedImportRow } from './utils/excelImporter';
import { exportAwardsToCsv } from './utils/imageProcessor';

export default function App() {
  const [awards, setAwards] = useState<AwardRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] = useState<'all' | AwardCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  const [captureOpen, setCaptureOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingAward, setEditingAward] = useState<AwardRecord | null>(null);
  const [detailAward, setDetailAward] = useState<AwardRecord | null>(null);
  const [noticeBanner, setNoticeBanner] = useState<string | null>(null);

  const fetchAwards = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch('/api/awards');
      if (!response.ok) {
        throw new Error('無法讀取校史榮譽典藏資料');
      }
      const data = (await response.json()) as { awards: AwardRecord[] };
      setAwards(Array.isArray(data.awards) ? data.awards : []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : '載入資料時發生錯誤');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAwards();
  }, [fetchAwards]);

  const counts = useMemo(() => {
    let trophy = 0;
    let medal = 0;
    let certificate = 0;
    for (const item of awards) {
      if (item.category === 'trophy') trophy += 1;
      else if (item.category === 'medal') medal += 1;
      else if (item.category === 'certificate') certificate += 1;
    }
    return {
      total: awards.length,
      trophy,
      medal,
      certificate,
    };
  }, [awards]);

  const availableYears = useMemo(() => {
    const yearSet = new Set<string>();
    for (const item of awards) {
      if (item.awardDate && item.awardDate.length >= 4) {
        yearSet.add(item.awardDate.slice(0, 4));
      }
    }
    return Array.from(yearSet).sort((a, b) => b.localeCompare(a));
  }, [awards]);

  const filteredAwards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const matched = awards.filter((item) => {
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }
      if (
        selectedYear !== 'all' &&
        !item.awardDate.startsWith(selectedYear)
      ) {
        return false;
      }
      if (q) {
        const haystack = [
          item.accessionNumber,
          item.awardName,
          item.rank,
          item.organizer,
          item.recipient,
          item.storageNote,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) {
          return false;
        }
      }
      return true;
    });

    return [...matched].sort((a, b) => {
      if (sortBy === 'date-desc') {
        return b.awardDate.localeCompare(a.awardDate);
      }
      if (sortBy === 'date-asc') {
        return a.awardDate.localeCompare(b.awardDate);
      }
      return b.accessionNumber.localeCompare(a.accessionNumber);
    });
  }, [awards, activeCategory, selectedYear, searchQuery, sortBy]);

  const featuredAward = useMemo(() => {
    if (awards.length === 0) return null;
    const sorted = [...awards].sort((a, b) =>
      b.awardDate.localeCompare(a.awardDate)
    );
    return sorted[0];
  }, [awards]);

  const handleOpenNewCapture = () => {
    setEditingAward(null);
    setCaptureOpen(true);
  };

  const handleOpenEdit = (award: AwardRecord) => {
    setDetailAward(null);
    setEditingAward(award);
    setCaptureOpen(true);
  };

  const handleSaveAward = async (payload: AwardPayload, editingId?: string) => {
    const isEdit = Boolean(editingId);
    const url = isEdit ? `/api/awards/${editingId}` : '/api/awards';
    const method = isEdit ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as {
      award?: AwardRecord;
      error?: string;
    };

    if (!response.ok || !data.award) {
      throw new Error(data.error || '儲存典藏失敗，請檢查欄位後重試');
    }

    const savedAward = data.award;
    setAwards((prev) => {
      if (isEdit) {
        return prev.map((item) => (item.id === savedAward.id ? savedAward : item));
      }
      return [savedAward, ...prev];
    });
  };

  const handleDeleteAward = async (id: string) => {
    const response = await fetch(`/api/awards/${id}`, {
      method: 'DELETE',
    });
    const data = (await response.json()) as { deletedId?: string; error?: string };
    if (!response.ok) {
      throw new Error(data.error || '無法刪除典藏項目');
    }
    setAwards((prev) => prev.filter((item) => item.id !== id));
  };

  const handleBatchImport = async (
    rows: ParsedImportRow[],
    mergeExisting: boolean
  ) => {
    const response = await fetch('/api/awards/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mergeExisting,
        records: rows.map((r) => ({
          accessionNumber: r.accessionNumber,
          category: r.category,
          awardName: r.awardName,
          rank: r.rank,
          awardDate: r.awardDate,
          organizer: r.organizer,
          recipient: r.recipient,
          storageNote: r.storageNote,
          imageDataUrl: r.imageDataUrl,
        })),
      }),
    });

    const data = (await response.json()) as {
      awards?: AwardRecord[];
      createdCount?: number;
      updatedCount?: number;
      error?: string;
    };

    if (!response.ok || !data.awards) {
      throw new Error(data.error || '批次匯入失敗，請檢查檔案內容');
    }

    setAwards(data.awards);
    const created = data.createdCount ?? 0;
    const updated = data.updatedCount ?? 0;
    setNoticeBanner(
      `已完成 Excel 匯入：新增 ${created} 筆典藏、智慧合併更新 ${updated} 筆現有獎盃資料。`
    );

    return { createdCount: created, updatedCount: updated };
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#1C1917]">
      <Header
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        onOpenCapture={handleOpenNewCapture}
      />

      <main className="flex-1">
        <HeroSection
          featuredAward={featuredAward}
          counts={counts}
          onOpenCapture={handleOpenNewCapture}
          onSelectAward={setDetailAward}
          onFilterCategory={setActiveCategory}
        />

        <section
          id="archive-catalog"
          className="mx-auto max-w-[1280px] px-6 py-12 lg:px-10"
        >
          {noticeBanner && (
            <div className="no-print mb-6 flex items-center justify-between gap-4 border border-[#14532D]/25 bg-[#14532D]/5 px-4 py-3 text-sm text-[#14532D]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{noticeBanner}</span>
              </div>
              <button
                type="button"
                onClick={() => setNoticeBanner(null)}
                aria-label="關閉通知"
                className="p-1 hover:opacity-70 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <ArchiveToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            availableYears={availableYears}
            sortBy={sortBy}
            onSortChange={setSortBy}
            resultCount={filteredAwards.length}
            onExportCsv={() => exportAwardsToCsv(filteredAwards)}
            onOpenImport={() => setImportOpen(true)}
          />

          {loading ? (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="border border-[#E5DFD3] bg-white p-4"
                >
                  <div className="aspect-[4/3] w-full animate-pulse bg-[#F4EFE6]" />
                  <div className="mt-4 h-3 w-1/3 animate-pulse bg-[#EBE6DF]" />
                  <div className="mt-3 h-5 w-4/5 animate-pulse bg-[#EBE6DF]" />
                  <div className="mt-4 h-12 w-full animate-pulse bg-[#F4EFE6]" />
                </div>
              ))}
            </div>
          ) : loadError ? (
            <div className="mt-10 border border-[#9A3412]/30 bg-white p-8 text-center">
              <p className="text-sm font-medium text-[#9A3412]">{loadError}</p>
              <button
                type="button"
                onClick={() => void fetchAwards()}
                className="mt-4 rounded-md bg-[#1C1917] px-4 py-2 text-xs font-medium text-[#FBF9F5] hover:bg-[#292524] cursor-pointer"
              >
                重新載入
              </button>
            </div>
          ) : filteredAwards.length === 0 ? (
            <div className="mt-10 border border-[#E5DFD3] bg-[#F4EFE6]/50 p-12 text-center">
              <Award
                className="mx-auto h-10 w-10 text-[#854D0E]"
                aria-hidden="true"
              />
              <h3 className="mt-3 font-serif text-lg font-semibold text-[#1C1917]">
                查無符合條件的典藏紀錄
              </h3>
              <p className="mt-1.5 text-sm text-[#57534E]">
                {awards.length === 0
                  ? '目前典藏館尚無資料，點擊下方按鈕立即拍照建檔。'
                  : '請嘗試調整搜尋關鍵字或切換類型與年份篩選。'}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                {awards.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategory('all');
                      setSelectedYear('all');
                      setSearchQuery('');
                    }}
                    className="rounded-md border border-[#D6CEBE] bg-white px-4 py-2 text-xs font-medium text-[#1C1917] hover:bg-[#EBE6DF] cursor-pointer"
                  >
                    顯示全部典藏
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleOpenNewCapture}
                  className="inline-flex items-center gap-2 rounded-md bg-[#1C1917] px-4 py-2 text-xs font-medium text-[#FBF9F5] hover:bg-[#292524] cursor-pointer"
                >
                  <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>拍照登錄獎項</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAwards.map((award) => (
                <AwardCard
                  key={award.id}
                  award={award}
                  onSelect={setDetailAward}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="no-print border-t border-[#E5DFD3] bg-[#F4EFE6]/70">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-6 py-6 text-xs text-[#78716C] sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <p className="font-serif text-sm font-medium text-[#44403C]">
            宜蘭縣員山鄉七賢國小校園榮譽數位典藏 — 單機數位典藏系統
          </p>
          <p>
            資料與影像儲存於本機典藏目錄，支援現場拍照建檔、Excel 批次匯入與清冊匯出。
          </p>
        </div>
      </footer>

      <CaptureModal
        isOpen={captureOpen}
        editingAward={editingAward}
        onClose={() => {
          setCaptureOpen(false);
          setEditingAward(null);
        }}
        onSubmit={handleSaveAward}
      />

      <BatchImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImportComplete={handleBatchImport}
      />

      <AwardDetailModal
        award={detailAward}
        onClose={() => setDetailAward(null)}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteAward}
      />
    </div>
  );
}
