export type AwardCategory = 'trophy' | 'medal' | 'certificate';

export interface AwardRecord {
  id: string;
  accessionNumber: string;
  category: AwardCategory;
  awardName: string;
  rank: string;
  awardDate: string;
  organizer: string;
  recipient: string;
  storageNote: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface AwardPayload {
  category: AwardCategory;
  awardName: string;
  rank: string;
  awardDate: string;
  organizer: string;
  recipient?: string;
  storageNote?: string;
  imageDataUrl?: string;
  imageUrl?: string;
}

export const CATEGORY_LABELS: Record<AwardCategory, string> = {
  trophy: '獎盃',
  medal: '獎牌',
  certificate: '獎狀',
};

export const RANK_PRESETS: string[] = [
  '第一名',
  '第二名',
  '第三名',
  '特優',
  '優等',
  '金牌',
  '銀牌',
  '銅牌',
  '佳作',
];
