import {
  Camera,
  Check,
  ImagePlus,
  RefreshCw,
  RotateCcw,
  Upload,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CATEGORY_LABELS, RANK_PRESETS } from '../types/award';
import type {
  AwardCategory,
  AwardPayload,
  AwardRecord,
} from '../types/award';
import {
  captureVideoFrame,
  processImageFile,
} from '../utils/imageProcessor';

interface CaptureModalProps {
  isOpen: boolean;
  editingAward: AwardRecord | null;
  onClose: () => void;
  onSubmit: (payload: AwardPayload, editingId?: string) => Promise<void>;
}

type PhotoMode = 'camera' | 'upload';

const CATEGORIES: AwardCategory[] = ['trophy', 'medal', 'certificate'];

export function CaptureModal({
  isOpen,
  editingAward,
  onClose,
  onSubmit,
}: CaptureModalProps) {
  const [photoMode, setPhotoMode] = useState<PhotoMode>('camera');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [newImageDataUrl, setNewImageDataUrl] = useState<string | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);

  const [category, setCategory] = useState<AwardCategory>('trophy');
  const [awardName, setAwardName] = useState('');
  const [rank, setRank] = useState('');
  const [awardDate, setAwardDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [organizer, setOrganizer] = useState('');
  const [recipient, setRecipient] = useState('');
  const [storageNote, setStorageNote] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement | null>(null);

  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const startCameraStream = useCallback(
    async (mode: 'environment' | 'user') => {
      stopCameraStream();
      setCameraError(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError(
          '目前瀏覽器不支援即時相機串流，請改用右側「上傳或手機拍照」功能。'
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraActive(true);
      } catch (err) {
        const name = err instanceof Error ? err.name : '';
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          setCameraError(
            '未取得相機權限。您可以在瀏覽器網址列允許相機存取，或切換至「上傳相片」直接使用手機相機或選取檔案。'
          );
        } else {
          setCameraError(
            '找不到可用的攝影鏡頭，請切換至「上傳相片」選取照片檔案。'
          );
        }
      }
    },
    [stopCameraStream]
  );

  // Sync form fields when modal opens or editingAward changes
  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
      return;
    }

    setFormError(null);
    setCameraError(null);

    if (editingAward) {
      setCategory(editingAward.category);
      setAwardName(editingAward.awardName);
      setRank(editingAward.rank);
      setAwardDate(editingAward.awardDate);
      setOrganizer(editingAward.organizer);
      setRecipient(editingAward.recipient || '');
      setStorageNote(editingAward.storageNote || '');
      setPreviewUrl(editingAward.imageUrl);
      setNewImageDataUrl(undefined);
      setPhotoMode('upload');
    } else {
      setCategory('trophy');
      setAwardName('');
      setRank('');
      setAwardDate(new Date().toISOString().slice(0, 10));
      setOrganizer('');
      setRecipient('');
      setStorageNote('');
      setPreviewUrl('');
      setNewImageDataUrl(undefined);
      setPhotoMode('camera');
    }
  }, [isOpen, editingAward, stopCameraStream]);

  // Manage camera lifecycle based on modal open state & photo mode
  useEffect(() => {
    if (!isOpen) return;

    if (photoMode === 'camera' && !previewUrl) {
      void startCameraStream(facingMode);
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [isOpen, photoMode, previewUrl, facingMode, startCameraStream, stopCameraStream]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
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

  const handleCapturePhoto = () => {
    if (!videoRef.current || !cameraActive) return;
    try {
      const dataUrl = captureVideoFrame(videoRef.current);
      setPreviewUrl(dataUrl);
      setNewImageDataUrl(dataUrl);
      stopCameraStream();
    } catch (err) {
      setCameraError(err instanceof Error ? err.message : '拍照失敗，請重試');
    }
  };

  const handleRetake = () => {
    setPreviewUrl('');
    setNewImageDataUrl(undefined);
    if (photoMode === 'camera') {
      void startCameraStream(facingMode);
    }
  };

  const handleFilePicked = async (file: File | undefined) => {
    if (!file) return;
    setFormError(null);
    setCameraError(null);
    try {
      const dataUrl = await processImageFile(file);
      setPreviewUrl(dataUrl);
      setNewImageDataUrl(dataUrl);
      stopCameraStream();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '無法處理所選圖片');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    void handleFilePicked(file);
  };

  const handleToggleFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!editingAward && !newImageDataUrl) {
      setFormError('請先拍照或上傳獎盃、獎牌或獎狀的照片。');
      return;
    }

    if (
      !awardName.trim() ||
      !rank.trim() ||
      !awardDate.trim() ||
      !organizer.trim()
    ) {
      setFormError('請完整填寫「獎項名稱」、「名次」、「日期」與「主辦單位」。');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(
        {
          category,
          awardName: awardName.trim(),
          rank: rank.trim(),
          awardDate: awardDate.trim(),
          organizer: organizer.trim(),
          recipient: recipient.trim(),
          storageNote: storageNote.trim(),
          imageDataUrl: newImageDataUrl,
        },
        editingAward?.id
      );
      stopCameraStream();
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '儲存失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="capture-modal-title"
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-[#1C1917]/60 p-3 backdrop-blur-xs sm:p-6"
    >
      <div className="flex max-h-[92vh] w-full max-w-[1040px] flex-col overflow-hidden border border-[#D6CEBE] bg-[#FBF9F5] shadow-xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E5DFD3] bg-[#F4EFE6] px-6 py-4">
          <div>
            <h2
              id="capture-modal-title"
              className="font-serif text-xl font-semibold text-[#1C1917]"
            >
              {editingAward ? '編輯榮譽典藏資料' : '拍照登錄校園榮譽'}
            </h2>
            <p className="mt-0.5 text-xs text-[#78716C]">
              {editingAward
                ? `典藏編號 ${editingAward.accessionNumber}`
                : '拍攝獎盃、獎牌或獎狀照片並建立完整獲獎紀錄'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            aria-label="關閉視窗"
            className="rounded-md p-2 text-[#57534E] transition-colors hover:bg-[#EBE6DF] hover:text-[#1C1917] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Two-Column Workspace */}
        <form
          onSubmit={handleFormSubmit}
          className="grid flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-12"
        >
          {/* Left Panel: Camera / Photo Upload */}
          <div className="flex flex-col border-b border-[#E5DFD3] bg-[#F4EFE6]/60 p-6 lg:col-span-6 lg:border-r lg:border-b-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 rounded-md border border-[#D6CEBE] bg-[#EBE6DF] p-1">
                <button
                  type="button"
                  onClick={() => {
                    setPhotoMode('camera');
                    setPreviewUrl('');
                    setNewImageDataUrl(undefined);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    photoMode === 'camera'
                      ? 'bg-white text-[#1C1917] shadow-xs'
                      : 'text-[#57534E] hover:text-[#1C1917]'
                  }`}
                >
                  <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>即時相機拍照</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPhotoMode('upload');
                  }}
                  className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    photoMode === 'upload'
                      ? 'bg-white text-[#1C1917] shadow-xs'
                      : 'text-[#57534E] hover:text-[#1C1917]'
                  }`}
                >
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>上傳 / 選取相片</span>
                </button>
              </div>

              {photoMode === 'camera' && !previewUrl && cameraActive && (
                <button
                  type="button"
                  onClick={handleToggleFacing}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#D6CEBE] bg-white px-2.5 py-1.5 text-xs font-medium text-[#44403C] hover:border-[#854D0E] cursor-pointer whitespace-nowrap"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>切換鏡頭</span>
                </button>
              )}
            </div>

            {/* Preview / Viewfinder Stage */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative mt-4 flex aspect-[4/3] w-full flex-col items-center justify-center overflow-hidden border ${
                isDragging
                  ? 'border-[#854D0E] bg-[#EBE6DF]'
                  : 'border-[#D6CEBE] bg-[#1C1917]'
              }`}
            >
              {previewUrl ? (
                <>
                  <img
                    src={previewUrl}
                    alt="獎項預覽照片"
                    className="h-full w-full object-contain bg-[#EFEAE0]"
                  />
                  <div className="absolute right-3 bottom-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRetake}
                      className="inline-flex items-center gap-1.5 rounded-md border border-[#D6CEBE] bg-white/95 px-3 py-1.5 text-xs font-medium text-[#1C1917] shadow-sm hover:bg-white cursor-pointer whitespace-nowrap"
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>重新拍攝 / 更換</span>
                    </button>
                  </div>
                </>
              ) : photoMode === 'camera' ? (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    className={`h-full w-full object-cover ${
                      cameraActive ? 'opacity-100' : 'opacity-0'
                    }`}
                  />

                  {/* Subtle museum framing guide */}
                  {cameraActive && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-5 border border-white/40"
                    />
                  )}

                  {!cameraActive && !cameraError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#EBE6DF] p-6 text-center">
                      <Camera className="h-8 w-8 text-[#854D0E]" aria-hidden="true" />
                      <p className="mt-2 text-sm font-medium text-[#1C1917]">
                        正在啟動攝影鏡頭...
                      </p>
                    </div>
                  )}

                  {cameraError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F4EFE6] p-6 text-center">
                      <Camera className="h-8 w-8 text-[#78716C]" aria-hidden="true" />
                      <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#44403C]">
                        {cameraError}
                      </p>
                      <div className="mt-4 flex flex-wrap justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => mobileCameraInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 rounded-md bg-[#1C1917] px-3.5 py-2 text-xs font-medium text-[#FBF9F5] hover:bg-[#292524] cursor-pointer"
                        >
                          <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>使用系統相機拍照</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 rounded-md border border-[#D6CEBE] bg-white px-3.5 py-2 text-xs font-medium text-[#1C1917] hover:bg-[#EBE6DF] cursor-pointer"
                        >
                          <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>選擇現有照片</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-[#F4EFE6] p-6 text-center">
                  <ImagePlus className="h-9 w-9 text-[#854D0E]" aria-hidden="true" />
                  <p className="mt-3 text-sm font-medium text-[#1C1917]">
                    拖曳獎盃、獎牌或獎狀照片至此，或點擊下方按鈕
                  </p>
                  <p className="mt-1 text-xs text-[#78716C]">
                    支援 JPG、PNG、WebP，系統將自動最佳化壓縮尺寸
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-md bg-[#1C1917] px-4 py-2 text-xs font-medium text-[#FBF9F5] hover:bg-[#292524] cursor-pointer whitespace-nowrap"
                    >
                      <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>從電腦／相簿選取</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => mobileCameraInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-md border border-[#D6CEBE] bg-white px-4 py-2 text-xs font-medium text-[#1C1917] hover:bg-[#EBE6DF] cursor-pointer whitespace-nowrap"
                    >
                      <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>手機相機直接拍攝</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Hidden File Inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                void handleFilePicked(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <input
              ref={mobileCameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                void handleFilePicked(e.target.files?.[0]);
                e.target.value = '';
              }}
            />

            {/* Shutter Action Bar when Camera is Live */}
            {photoMode === 'camera' && !previewUrl && cameraActive && (
              <div className="mt-4 flex items-center justify-between gap-4">
                <p className="text-xs text-[#57534E]">
                  建議將獎盃或獎狀置於框線中央，光線充足處拍攝文字更清晰。
                </p>
                <button
                  type="button"
                  onClick={handleCapturePhoto}
                  className="inline-flex items-center gap-2 rounded-md bg-[#854D0E] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#713F12] cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Camera className="h-4 w-4" aria-hidden="true" />
                  <span>拍攝照片</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Panel: Structured Provenance Form */}
          <div className="flex flex-col justify-between p-6 lg:col-span-6">
            <div className="space-y-4">
              {/* Category Selector */}
              <div>
                <span className="block text-xs font-medium text-[#44403C]">
                  典藏類型 <span className="text-[#9A3412]">*</span>
                </span>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => {
                    const selected = category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                          selected
                            ? 'border-[#854D0E] bg-[#854D0E] text-white'
                            : 'border-[#D6CEBE] bg-white text-[#44403C] hover:border-[#854D0E]'
                        }`}
                      >
                        {CATEGORY_LABELS[cat]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Award Name */}
              <div>
                <label
                  htmlFor="award-name-input"
                  className="block text-xs font-medium text-[#44403C]"
                >
                  獎項名稱 <span className="text-[#9A3412]">*</span>
                </label>
                <input
                  id="award-name-input"
                  type="text"
                  required
                  maxLength={160}
                  value={awardName}
                  onChange={(e) => setAwardName(e.target.value)}
                  placeholder="例如：第66屆全國中小學科學展覽會 國中組物理科"
                  className="mt-1.5 w-full rounded-md border border-[#D6CEBE] bg-white px-3 py-2 text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:border-[#854D0E] focus:outline-none"
                />
              </div>

              {/* Rank + Quick Presets */}
              <div>
                <label
                  htmlFor="award-rank-input"
                  className="block text-xs font-medium text-[#44403C]"
                >
                  名次／獎等 <span className="text-[#9A3412]">*</span>
                </label>
                <input
                  id="award-rank-input"
                  type="text"
                  required
                  maxLength={80}
                  value={rank}
                  onChange={(e) => setRank(e.target.value)}
                  placeholder="例如：第一名、特優、金牌、團體亞軍"
                  className="mt-1.5 w-full rounded-md border border-[#D6CEBE] bg-white px-3 py-2 text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:border-[#854D0E] focus:outline-none"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {RANK_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRank(preset)}
                      className={`rounded border px-2 py-0.5 text-xs transition-colors cursor-pointer ${
                        rank === preset
                          ? 'border-[#854D0E] bg-[#F4EFE6] font-medium text-[#854D0E]'
                          : 'border-[#E5DFD3] bg-[#FBF9F5] text-[#57534E] hover:border-[#C7BDA8]'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Award Date */}
              <div>
                <label
                  htmlFor="award-date-input"
                  className="block text-xs font-medium text-[#44403C]"
                >
                  獲獎日期 <span className="text-[#9A3412]">*</span>
                </label>
                <input
                  id="award-date-input"
                  type="date"
                  required
                  value={awardDate}
                  onChange={(e) => setAwardDate(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-[#D6CEBE] bg-white px-3 py-2 text-sm text-[#1C1917] tabular-nums focus:border-[#854D0E] focus:outline-none"
                />
              </div>

              {/* Organizer */}
              <div>
                <label
                  htmlFor="award-organizer-input"
                  className="block text-xs font-medium text-[#44403C]"
                >
                  主辦單位 <span className="text-[#9A3412]">*</span>
                </label>
                <input
                  id="award-organizer-input"
                  type="text"
                  required
                  maxLength={140}
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                  placeholder="例如：教育部、國立臺灣科學教育館"
                  className="mt-1.5 w-full rounded-md border border-[#D6CEBE] bg-white px-3 py-2 text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:border-[#854D0E] focus:outline-none"
                />
              </div>

              {/* Optional Recipient & Storage Note */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="award-recipient-input"
                    className="block text-xs font-medium text-[#44403C]"
                  >
                    獲獎學生／團隊（選填）
                  </label>
                  <input
                    id="award-recipient-input"
                    type="text"
                    maxLength={120}
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="例如：八年二班、校田徑隊"
                    className="mt-1.5 w-full rounded-md border border-[#D6CEBE] bg-white px-3 py-2 text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:border-[#854D0E] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="award-storage-input"
                    className="block text-xs font-medium text-[#44403C]"
                  >
                    實體存放／處置備註（選填）
                  </label>
                  <input
                    id="award-storage-input"
                    type="text"
                    maxLength={240}
                    value={storageNote}
                    onChange={(e) => setStorageNote(e.target.value)}
                    placeholder="例如：已拍照封存於典藏箱 B-03"
                    className="mt-1.5 w-full rounded-md border border-[#D6CEBE] bg-white px-3 py-2 text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:border-[#854D0E] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Error Notice & Submit Actions */}
            <div className="mt-6 border-t border-[#E5DFD3] pt-4">
              {formError && (
                <p
                  role="alert"
                  className="mb-3 rounded border border-[#9A3412]/30 bg-[#9A3412]/5 px-3 py-2 text-xs font-medium text-[#9A3412]"
                >
                  {formError}
                </p>
              )}

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    stopCameraStream();
                    onClose();
                  }}
                  className="rounded-md border border-[#D6CEBE] bg-white px-4 py-2.5 text-sm font-medium text-[#44403C] transition-colors hover:bg-[#F4EFE6] cursor-pointer whitespace-nowrap"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-md bg-[#1C1917] px-5 py-2.5 text-sm font-medium text-[#FBF9F5] transition-colors hover:bg-[#292524] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer whitespace-nowrap"
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {submitting
                      ? '儲存中...'
                      : editingAward
                        ? '儲存修改'
                        : '登錄並典藏'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
