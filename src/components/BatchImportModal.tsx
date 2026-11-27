import {
  Check,
  Download,
  FileSpreadsheet,
  ImagePlus,
  Upload,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CATEGORY_LABELS } from '../types/award';
import {
  downloadImportTemplate,
  matchPhotosToRows,
  parseExcelFile,
} from '../utils/excelImporter';
import type { ParsedImportRow } from '../utils/excelImporter';

interface BatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (rows: ParsedImportRow[], mergeExisting: boolean) => Promise<{
    createdCount: number;
    updatedCount: number;
  }>;
}

export function BatchImportModal({
  isOpen,
  onClose,
  onImportComplete,
}: BatchImportModalProps) {
  const [excelFileName, setExcelFileName] = useState<string>('');
  const [rows, setRows] = useState<ParsedImportRow[]>([]);
  const [mergeExisting, setMergeExisting] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [photoCount, setPhotoCount] = useState(0);

  const excelInputRef = useRef<HTMLInputElement | null>(null);
  const photosInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleExcelPicked = async (file: File | undefined) => {
    if (!file) return;
    setErrorMsg(null);
    setParsing(true);
    try {
      const parsed = await parseExcelFile(file);
      setExcelFileName(file.name);
      setRows(parsed);
      setPhotoCount(0);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '解析 Excel 檔案失敗');
      setRows([]);
      setExcelFileName('');
    } finally {
      setParsing(false);
    }
  };

  const handlePhotosPicked = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || rows.length === 0) return;
    setErrorMsg(null);
    setParsing(true);
    try {
      const files = Array.from(fileList);
      const updatedRows = await matchPhotosToRows(rows, files);
      setRows(updatedRows);
      setPhotoCount(updatedRows.filter((r) => Boolean(r.imageDataUrl)).length);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '處理照片時發生錯誤');
    } finally {
      setParsing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (rows.length === 0) {
      setErrorMsg('請先上傳包含獎項資料的 Excel 或 CSV 檔案。');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await onImportComplete(rows, mergeExisting);
      setRows([]);
      setExcelFileName('');
      setPhotoCount(0);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '批次匯入失敗，請重試');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="batch-import-title"
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-[#1C1917]/60 p-3 backdrop-blur-xs sm:p-6"
    >
      <div className="flex max-h-[92vh] w-full max-w-[980px] flex-col overflow-hidden border border-[#D6CEBE] bg-[#FBF9F5] shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5DFD3] bg-[#F4EFE6] px-6 py-4">
          <div>
            <h2
              id="batch-import-title"
              className="font-serif text-xl font-semibold text-[#1C1917]"
            >
              批次匯入 Excel 名冊與獎盃照片
            </h2>
            <p className="mt-0.5 text-xs text-[#78716C]">
              支援 .xlsx / .xls / .csv 檔案，自動轉換民國年份日期並可比對補登現有獎盃資料
            </p>
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            aria-label="關閉視窗"
            className="rounded-md p-2 text-[#57534E] transition-colors hover:bg-[#EBE6DF] hover:text-[#1C1917] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {/* Step 1 & 2 Upload Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col justify-between border border-[#D6CEBE] bg-white p-5">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-medium text-[#854D0E]">
                    01. 上傳 Excel / CSV 清冊
                  </span>
                  <button
                    type="button"
                    onClick={downloadImportTemplate}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#57534E] underline decoration-[#D6CEBE] underline-offset-4 hover:text-[#1C1917] cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>下載 Excel 範本</span>
                  </button>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[#57534E]">
                  自動辨識「獎項名稱、名次、獲獎日期、主辦單位、獲獎學生、備註」欄位，支援民國年（如 75.06.18、98/3/22）與西元年。
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#EFEAE0] pt-4">
                <span className="truncate text-xs text-[#44403C]">
                  {excelFileName ? `已載入：${excelFileName}` : '尚未選擇表格檔案'}
                </span>
                <button
                  type="button"
                  disabled={parsing || submitting}
                  onClick={() => excelInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#1C1917] px-3.5 py-2 text-xs font-medium text-[#FBF9F5] hover:bg-[#292524] cursor-pointer whitespace-nowrap shrink-0"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{excelFileName ? '更換檔案' : '選擇 Excel / CSV'}</span>
                </button>
                <input
                  ref={excelInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    void handleExcelPicked(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col justify-between border border-[#D6CEBE] bg-white p-5">
              <div>
                <span className="font-mono text-xs font-medium text-[#854D0E]">
                  02. 批次配對照片檔案（選填）
                </span>
                <p className="mt-2 text-xs leading-relaxed text-[#57534E]">
                  可一次多選獎盃或獎狀照片檔，系統將依 Excel 中的「照片檔名」欄位或檔名內的民國日期（如 750618、980322）自動配對。
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#EFEAE0] pt-4">
                <span className="truncate text-xs text-[#44403C] tabular-nums">
                  {rows.length > 0
                    ? `已配對 ${photoCount} / ${rows.length} 筆照片`
                    : '請先載入 Excel 名冊'}
                </span>
                <button
                  type="button"
                  disabled={rows.length === 0 || parsing || submitting}
                  onClick={() => photosInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#D6CEBE] bg-[#F4EFE6] px-3.5 py-2 text-xs font-medium text-[#1C1917] hover:border-[#854D0E] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>多選照片配對</span>
                </button>
                <input
                  ref={photosInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    void handlePhotosPicked(e.target.files);
                    e.target.value = '';
                  }}
                />
              </div>
            </div>
          </div>

          {/* Merge Option */}
          <label className="flex items-start gap-2.5 border border-[#E5DFD3] bg-[#F4EFE6]/60 px-4 py-3 text-xs text-[#44403C] cursor-pointer">
            <input
              type="checkbox"
              checked={mergeExisting}
              onChange={(e) => setMergeExisting(e.target.checked)}
              className="mt-0.5 accent-[#854D0E]"
            />
            <span>
              <strong>智慧合併更新現有紀錄：</strong>
              若匯入資料與典藏館中已建檔獎盃（例如同日期、同競賽名稱）相符，自動補齊獲獎學生與備註並保留現有照片；其餘資料則新增為新典藏項目。
            </span>
          </label>

          {/* Preview Table */}
          {rows.length > 0 && (
            <div className="border border-[#D6CEBE] bg-white">
              <div className="flex items-center justify-between border-b border-[#E5DFD3] bg-[#F4EFE6] px-4 py-2.5 text-xs">
                <span className="font-medium text-[#1C1917] tabular-nums">
                  預覽匯入資料（共 {rows.length} 筆）
                </span>
                <span className="text-[#78716C]">
                  確認無誤後點擊下方「確認匯入」
                </span>
              </div>
              <div className="max-h-[280px] overflow-x-auto overflow-y-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="sticky top-0 border-b border-[#E5DFD3] bg-[#FBF9F5] text-[#78716C]">
                    <tr>
                      <th className="px-3 py-2 font-medium">類型</th>
                      <th className="px-3 py-2 font-medium">獎項名稱</th>
                      <th className="px-3 py-2 font-medium">名次</th>
                      <th className="px-3 py-2 font-medium">獲獎日期</th>
                      <th className="px-3 py-2 font-medium">主辦單位</th>
                      <th className="px-3 py-2 font-medium">照片配對</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFEAE0]">
                    {rows.map((row) => (
                      <tr key={row.rowIndex} className="hover:bg-[#FBF9F5]">
                        <td className="px-3 py-2 whitespace-nowrap text-[#44403C]">
                          {CATEGORY_LABELS[row.category]}
                        </td>
                        <td className="max-w-[220px] truncate px-3 py-2 font-medium text-[#1C1917]">
                          {row.awardName}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[#1C1917]">
                          {row.rank}
                        </td>
                        <td className="px-3 py-2 font-mono whitespace-nowrap text-[#44403C] tabular-nums">
                          {row.awardDate}
                        </td>
                        <td className="max-w-[160px] truncate px-3 py-2 text-[#44403C]">
                          {row.organizer}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {row.matchedPhotoName ? (
                            <span className="font-medium text-[#14532D]">
                              已配對 ({row.matchedPhotoName})
                            </span>
                          ) : (
                            <span className="text-[#78716C]">未附新圖</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {errorMsg && (
            <p
              role="alert"
              className="rounded border border-[#9A3412]/30 bg-[#9A3412]/5 px-3 py-2 text-xs font-medium text-[#9A3412]"
            >
              {errorMsg}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[#E5DFD3] bg-[#F4EFE6] px-6 py-4">
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="rounded-md border border-[#D6CEBE] bg-white px-4 py-2 text-xs font-medium text-[#44403C] hover:bg-[#EBE6DF] cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            disabled={rows.length === 0 || submitting || parsing}
            onClick={handleConfirmImport}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#1C1917] px-5 py-2 text-xs font-medium text-[#FBF9F5] hover:bg-[#292524] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>
                <Upload className="h-3.5 w-3.5 animate-pulse" aria-hidden="true" />
                <span>匯入處理中...</span>
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                <span>確認匯入（{rows.length} 筆）</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
