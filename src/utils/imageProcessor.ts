import { CATEGORY_LABELS } from '../types/award';
import type { AwardRecord } from '../types/award';

const MAX_DIMENSION = 1400;
const JPEG_QUALITY = 0.86;

export function captureVideoFrame(video: HTMLVideoElement): string {
  const sourceWidth = video.videoWidth || 1280;
  const sourceHeight = video.videoHeight || 960;

  const scale = Math.min(1, MAX_DIMENSION / Math.max(sourceWidth, sourceHeight));
  const width = Math.round(sourceWidth * scale);
  const height = Math.round(sourceHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('無法初始化影像畫布');
  }
  ctx.drawImage(video, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

export function processImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('請選擇圖片格式的檔案（JPG、PNG 或 WebP）'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('讀取圖片檔案失敗'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('無法解析圖片內容'));
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('無法建立影像壓縮畫布'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function escapeCsvCell(value: string): string {
  const clean = value.replace(/\r?\n/g, ' ');
  if (clean.includes(',') || clean.includes('"')) {
    return `"${clean.replace(/"/g, '""')}"`;
  }
  return clean;
}

export function exportAwardsToCsv(awards: AwardRecord[]): void {
  const headers = [
    '典藏編號',
    '典藏類型',
    '獎項名稱',
    '名次／獎等',
    '獲獎日期',
    '主辦單位',
    '獲獎學生／團隊',
    '實體存放備註',
  ];

  const rows = awards.map((item) => [
    item.accessionNumber,
    CATEGORY_LABELS[item.category],
    item.awardName,
    item.rank,
    item.awardDate,
    item.organizer,
    item.recipient || '',
    item.storageNote || '',
  ]);

  const csvContent =
    '\uFEFF' +
    [headers, ...rows]
      .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const today = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `校史榮譽典藏清冊_${today}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
