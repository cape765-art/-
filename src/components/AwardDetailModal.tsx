import {
  Award,
  Pencil,
  Printer,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { CATEGORY_LABELS } from '../types/award';
import type { AwardRecord } from '../types/award';

interface AwardDetailModalProps {
  award: AwardRecord | null;
  onClose: () => void;
  onEdit: (award: AwardRecord) => void;
  onDelete: (id: string) => Promise<void>;
}

export function AwardDetailModal({
  award,
  onClose,
  onEdit,
  onDelete,
}: AwardDetailModalProps) {
  const [zoomed, setZoomed] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setZoomed(false);
    setConfirmingDelete(false);
    setDeleting(false);
    setDeleteError(null);
    setImgFailed(false);
  }, [award]);

  useEffect(() => {
    if (!award) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !deleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [award, deleting, onClose]);

  if (!award) {
    return null;
  }

  const handleConfirmDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(award.id);
      onClose();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : '刪除失敗，請重試');
      setDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1917]/65 p-3 backdrop-blur-xs sm:p-6"
    >
      <div className="flex max-h-[92vh] w-full max-w-[1040px] flex-col overflow-hidden border border-[#D6CEBE] bg-[#FBF9F5] shadow-xl">
        {/* Top Bar */}
        <div className="no-print flex items-center justify-between border-b border-[#E5DFD3] bg-[#F4EFE6] px-6 py-4">
          <div className="flex items-center gap-3 text-xs text-[#78716C] tabular-nums">
            <span className="font-mono font-medium text-[#854D0E]">
              {award.accessionNumber}
            </span>
            <span aria-hidden="true">·</span>
            <span>{CATEGORY_LABELS[award.category]}典藏卡</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="關閉典藏卡"
            className="rounded-md p-2 text-[#57534E] transition-colors hover:bg-[#EBE6DF] hover:text-[#1C1917] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Split */}
        <div className="grid flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-12">
          {/* Museum Image Viewer */}
          <div className="flex flex-col justify-between border-b border-[#E5DFD3] bg-[#F4EFE6] p-6 lg:col-span-7 lg:border-r lg:border-b-0">
            <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden border border-[#DFD7C8] bg-[#FFFFFF] p-4">
              {!imgFailed && award.imageUrl ? (
                <img
                  src={award.imageUrl}
                  alt={award.awardName}
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  onClick={() => setZoomed((z) => !z)}
                  className={`h-full w-full cursor-zoom-in object-contain transition-transform duration-300 ease-out ${
                    zoomed ? 'scale-150 cursor-zoom-out' : 'scale-100'
                  }`}
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
                  <Award className="h-12 w-12 text-[#854D0E]" aria-hidden="true" />
                  <p className="mt-3 font-serif text-base font-medium text-[#1C1917]">
                    {award.awardName}
                  </p>
                </div>
              )}

              {!imgFailed && award.imageUrl && (
                <button
                  type="button"
                  onClick={() => setZoomed((z) => !z)}
                  className="no-print absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-md border border-[#D6CEBE] bg-white/95 px-3 py-1.5 text-xs font-medium text-[#1C1917] shadow-xs hover:bg-white cursor-pointer"
                >
                  {zoomed ? (
                    <>
                      <ZoomOut className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>還原比例</span>
                    </>
                  ) : (
                    <>
                      <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>放大檢視細節</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <p className="mt-3 font-serif text-xs italic text-[#78716C]">
              圖錄 {award.accessionNumber} — {award.awardName}（{award.awardDate} 獲頒）
            </p>
          </div>

          {/* Museum Accession Ledger */}
          <div className="flex flex-col justify-between p-6 lg:col-span-5">
            <div>
              <p className="font-mono text-xs tracking-wider text-[#854D0E] tabular-nums">
                {award.accessionNumber} · {CATEGORY_LABELS[award.category]}
              </p>
              <h2
                id="detail-modal-title"
                className="mt-2 font-serif text-2xl font-semibold leading-snug text-[#1C1917]"
              >
                {award.awardName}
              </h2>

              <dl className="mt-6 divide-y divide-[#EFEAE0] border-t border-b border-[#EFEAE0] text-sm">
                <div className="grid grid-cols-3 gap-3 py-3">
                  <dt className="text-[#78716C]">名次／獎等</dt>
                  <dd className="col-span-2 font-semibold text-[#1C1917]">
                    {award.rank}
                  </dd>
                </div>

                <div className="grid grid-cols-3 gap-3 py-3">
                  <dt className="text-[#78716C]">獲獎日期</dt>
                  <dd className="col-span-2 font-mono text-[#1C1917] tabular-nums">
                    {award.awardDate}
                  </dd>
                </div>

                <div className="grid grid-cols-3 gap-3 py-3">
                  <dt className="text-[#78716C]">主辦單位</dt>
                  <dd className="col-span-2 text-[#1C1917]">{award.organizer}</dd>
                </div>

                {award.recipient && (
                  <div className="grid grid-cols-3 gap-3 py-3">
                    <dt className="text-[#78716C]">獲獎人／團隊</dt>
                    <dd className="col-span-2 text-[#1C1917]">
                      {award.recipient}
                    </dd>
                  </div>
                )}

                {award.storageNote && (
                  <div className="grid grid-cols-3 gap-3 py-3">
                    <dt className="text-[#78716C]">實體處置備註</dt>
                    <dd className="col-span-2 leading-relaxed text-[#44403C]">
                      {award.storageNote}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Action Footer */}
            <div className="no-print mt-6 space-y-3 pt-2">
              {deleteError && (
                <p
                  role="alert"
                  className="rounded border border-[#9A3412]/30 bg-[#9A3412]/5 px-3 py-2 text-xs text-[#9A3412]"
                >
                  {deleteError}
                </p>
              )}

              {confirmingDelete ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#9A3412]/30 bg-[#9A3412]/5 p-3">
                  <span className="text-xs font-medium text-[#9A3412]">
                    確定要永久刪除此筆榮譽紀錄？
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => setConfirmingDelete(false)}
                      className="rounded border border-[#D6CEBE] bg-white px-3 py-1.5 text-xs font-medium text-[#44403C] hover:bg-[#F4EFE6] cursor-pointer"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={handleConfirmDelete}
                      className="rounded bg-[#9A3412] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#7C2D12] disabled:opacity-60 cursor-pointer"
                    >
                      {deleting ? '刪除中...' : '確認刪除'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(award)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-[#1C1917] px-4 py-2 text-xs font-medium text-[#FBF9F5] transition-colors hover:bg-[#292524] cursor-pointer whitespace-nowrap"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>編輯資料</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 rounded-md border border-[#D6CEBE] bg-white px-3.5 py-2 text-xs font-medium text-[#1C1917] transition-colors hover:bg-[#F4EFE6] cursor-pointer whitespace-nowrap"
                    >
                      <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>列印典藏卡</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium text-[#9A3412] transition-colors hover:bg-[#9A3412]/10 cursor-pointer whitespace-nowrap"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>刪除紀錄</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
