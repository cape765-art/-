import * as XLSX from 'xlsx';
import type { AwardCategory } from '../types/award';
import { processImageFile } from './imageProcessor';

export interface ParsedImportRow {
  rowIndex: number;
  accessionNumber?: string;
  category: AwardCategory;
  awardName: string;
  rank: string;
  awardDate: string;
  organizer: string;
  recipient: string;
  storageNote: string;
  photoHint: string;
  matchedPhotoName?: string;
  imageDataUrl?: string;
}

const COLUMN_ALIASES: Record<keyof Omit<ParsedImportRow, 'rowIndex' | 'matchedPhotoName' | 'imageDataUrl'>, string[]> = {
  accessionNumber: ['典藏編號', '編號', '序號', 'accession', 'accessionnumber'],
  category: ['典藏類型', '類型', '類別', '獎項類別', '形式', 'category', 'type'],
  awardName: ['獎項名稱', '競賽名稱', '比賽名稱', '活動名稱', '獎項', '名稱', 'awardname', 'title', 'name'],
  rank: ['名次／獎等', '名次', '獎等', '等第', '成績', '名次獎等', 'rank', 'place'],
  awardDate: ['獲獎日期', '得獎日期', '比賽日期', '頒獎日期', '日期', '時間', 'date', 'awarddate'],
  organizer: ['主辦單位', '主辦機關', '頒獎單位', '承辦單位', '主辦', 'organizer'],
  recipient: ['獲獎學生／團隊', '獲獎人／團隊', '獲獎學生', '獲獎人', '參賽學生', '得獎人', '學生', '團隊', '班級', 'recipient'],
  storageNote: ['實體存放備註', '存放備註', '存放位置', '原存放位置', '備註', '說明', 'note', 'storagenote'],
  photoHint: ['照片檔名', '照片檔案', '照片', '圖檔', '相片', '檔名', 'photo', 'image'],
};

function cleanHeaderKey(key: string): string {
  return key.trim().replace(/[\s　*()（）]/g, '').toLowerCase();
}

function pickCell(row: Record<string, unknown>, aliases: string[]): string {
  const entries = Object.entries(row);
  for (const alias of aliases) {
    const cleanAlias = cleanHeaderKey(alias);
    for (const [colKey, value] of entries) {
      const cleanCol = cleanHeaderKey(colKey);
      if (cleanCol === cleanAlias || cleanCol.includes(cleanAlias)) {
        if (value !== null && value !== undefined && String(value).trim() !== '') {
          return String(value).trim();
        }
      }
    }
  }
  return '';
}

function pad2(num: number): string {
  return String(num).padStart(2, '0');
}

export function normalizeAwardDate(rawValue: unknown): string {
  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return new Date().toISOString().slice(0, 10);
  }

  // Handle Excel serial date numbers
  if (typeof rawValue === 'number' && rawValue > 1000 && rawValue < 100000) {
    const parsed = XLSX.SSF.parse_date_code(rawValue);
    if (parsed && parsed.y && parsed.m && parsed.d) {
      return `${parsed.y}-${pad2(parsed.m)}-${pad2(parsed.d)}`;
    }
  }

  const str = String(rawValue).trim();

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // Compact ROC format: e.g. 750618 or 1000416
  const compactMatch = str.match(/^(\d{2,3})(\d{2})(\d{2})$/);
  if (compactMatch) {
    const rocYear = Number.parseInt(compactMatch[1], 10);
    const month = Number.parseInt(compactMatch[2], 10);
    const day = Number.parseInt(compactMatch[3], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${rocYear + 1911}-${pad2(month)}-${pad2(day)}`;
    }
  }

  // Separated numbers: 75.06.18, 98/3/22, 2024/05/12, 民國95年12月30日
  const chineseOrSep = str
    .replace(/中華民國|民國/g, '')
    .replace(/[年]/g, '-')
    .replace(/[月]/g, '-')
    .replace(/[日號]/g, '')
    .replace(/[./]/g, '-')
    .trim();

  const parts = chineseOrSep.match(/^(\d{2,4})-(\d{1,2})-(\d{1,2})/);
  if (parts) {
    let year = Number.parseInt(parts[1], 10);
    const month = Number.parseInt(parts[2], 10);
    const day = Number.parseInt(parts[3], 10);
    if (year < 1911) {
      year += 1911;
    }
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${pad2(month)}-${pad2(day)}`;
    }
  }

  return new Date().toISOString().slice(0, 10);
}

function parseCategory(raw: string): AwardCategory {
  if (!raw) return 'trophy';
  if (raw.includes('牌') || raw.toLowerCase() === 'medal') return 'medal';
  if (raw.includes('狀') || raw.includes('證') || raw.toLowerCase() === 'certificate') {
    return 'certificate';
  }
  return 'trophy';
}

export async function parseExcelFile(file: File): Promise<ParsedImportRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('Excel 檔案中找不到任何工作表');
  }
  const sheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
  });

  const parsed: ParsedImportRow[] = [];
  rawRows.forEach((rawRow, idx) => {
    const awardName = pickCell(rawRow, COLUMN_ALIASES.awardName);
    if (!awardName) {
      return;
    }

    // Grab raw cell for date to preserve Excel serial numbers if any
    let rawDateCell: unknown = '';
    for (const alias of COLUMN_ALIASES.awardDate) {
      const cleanAlias = cleanHeaderKey(alias);
      for (const [k, v] of Object.entries(rawRow)) {
        const cleanCol = cleanHeaderKey(k);
        if ((cleanCol === cleanAlias || cleanCol.includes(cleanAlias)) && v !== '') {
          rawDateCell = v;
          break;
        }
      }
      if (rawDateCell !== '') break;
    }

    parsed.push({
      rowIndex: idx + 2,
      accessionNumber: pickCell(rawRow, COLUMN_ALIASES.accessionNumber) || undefined,
      category: parseCategory(pickCell(rawRow, COLUMN_ALIASES.category)),
      awardName,
      rank: pickCell(rawRow, COLUMN_ALIASES.rank) || '獲獎',
      awardDate: normalizeAwardDate(rawDateCell),
      organizer: pickCell(rawRow, COLUMN_ALIASES.organizer) || '待補登',
      recipient: pickCell(rawRow, COLUMN_ALIASES.recipient),
      storageNote: pickCell(rawRow, COLUMN_ALIASES.storageNote),
      photoHint: pickCell(rawRow, COLUMN_ALIASES.photoHint),
    });
  });

  if (parsed.length === 0) {
    throw new Error('無法在工作表中辨識出「獎項名稱」欄位或資料列，請確認表格標題列。');
  }

  return parsed;
}

function getRocCompactDate(isoDate: string): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return '';
  const rocYear = Number.parseInt(match[1], 10) - 1911;
  return `${rocYear}${match[2]}${match[3]}`;
}

export async function matchPhotosToRows(
  rows: ParsedImportRow[],
  files: File[]
): Promise<ParsedImportRow[]> {
  const processedPhotos: { fileName: string; baseName: string; dataUrl: string }[] = [];

  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    try {
      const dataUrl = await processImageFile(file);
      const baseName = file.name.replace(/\.[^.]+$/, '').toLowerCase();
      processedPhotos.push({
        fileName: file.name.toLowerCase(),
        baseName,
        dataUrl,
      });
    } catch {
      // Skip unreadable images
    }
  }

  return rows.map((row) => {
    const hint = row.photoHint.trim().toLowerCase();
    const rocCompact = getRocCompactDate(row.awardDate);
    const isoCompact = row.awardDate.replace(/-/g, '');

    let matched = processedPhotos.find((p) => {
      if (hint) {
        return p.fileName === hint || p.baseName === hint || p.fileName.includes(hint);
      }
      return false;
    });

    if (!matched && rocCompact) {
      matched = processedPhotos.find(
        (p) => p.baseName.startsWith(rocCompact) || p.baseName.includes(rocCompact)
      );
    }

    if (!matched && isoCompact) {
      matched = processedPhotos.find((p) => p.baseName.includes(isoCompact));
    }

    if (matched) {
      return {
        ...row,
        matchedPhotoName: matched.fileName,
        imageDataUrl: matched.dataUrl,
      };
    }

    return row;
  });
}

export function downloadImportTemplate(): void {
  const sampleRows = [
    {
      典藏類型: '獎盃',
      獎項名稱: '宜蘭縣七十四學年度國民小學足球錦標賽 男生組',
      名次: '冠軍',
      獲獎日期: '75.06.18',
      主辦單位: '宜蘭縣政府',
      獲獎學生: '本校足球隊',
      實體存放備註: '已攝影封存於校史室',
      照片檔名: '750618.jpg',
    },
    {
      典藏類型: '獎牌',
      獎項名稱: '全國中小學田徑錦標賽 100公尺',
      名次: '金牌',
      獲獎日期: '2026-05-12',
      主辦單位: '教育部體育署',
      獲獎學生: '六年一班 陳同學',
      實體存放備註: '獎牌留存學生，數位建檔',
      照片檔名: '',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '榮譽典藏匯入範本');
  XLSX.writeFile(workbook, '校史榮譽典藏匯入範本.xlsx');
}
