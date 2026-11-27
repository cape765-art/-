import { Award } from 'lucide-react';
import { useState } from 'react';
import { CATEGORY_LABELS } from '../types/award';
import type { AwardRecord } from '../types/award';

interface AwardCardProps {
  award: AwardRecord;
  onSelect: (award: AwardRecord) => void;
}

export function AwardCard({ award, onSelect }: AwardCardProps) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <article className="group flex flex-col border border-[#E5DFD3] bg-white transition-colors hover:border-[#C7BDA8]">
      <button
        type="button"
        onClick={() => onSelect(award)}
        className="flex flex-1 flex-col text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#854D0E]"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-[#EFEAE0] bg-[#FFFFFF] p-4">
          {!imgFailed && award.imageUrl ? (
            <img
              src={award.imageUrl}
              alt={award.awardName}
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={() => setImgFailed(true)}
              className="h-full w-full object-contain transition-transform duration-300 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#F4EFE6] to-[#E7DFCF] p-6 text-center">
              <Award className="h-9 w-9 text-[#854D0E]" aria-hidden="true" />
              <p className="mt-2 line-clamp-2 font-serif text-sm font-medium text-[#1C1917]">
                {award.awardName}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col justify-between p-5">
          <div>
            {/* Zero-pill unboxed metadata kicker */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#78716C] tabular-nums">
              <span className="font-mono text-[#854D0E]">{award.accessionNumber}</span>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-[#44403C]">
                {CATEGORY_LABELS[award.category]}
              </span>
              <span aria-hidden="true">·</span>
              <span>{award.awardDate}</span>
            </div>

            <h3 className="mt-2.5 line-clamp-2 font-serif text-lg font-semibold leading-snug text-[#1C1917] group-hover:text-[#854D0E] transition-colors">
              {award.awardName}
            </h3>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-[#EFEAE0] pt-4 text-xs">
            <div>
              <dt className="text-[#78716C]">名次／獎等</dt>
              <dd className="mt-0.5 truncate font-medium text-[#1C1917]">
                {award.rank}
              </dd>
            </div>
            <div>
              <dt className="text-[#78716C]">獲獎對象</dt>
              <dd className="mt-0.5 truncate font-medium text-[#1C1917]">
                {award.recipient || '本校代表隊'}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-[#78716C]">主辦單位</dt>
              <dd className="mt-0.5 truncate text-[#44403C]">{award.organizer}</dd>
            </div>
          </dl>
        </div>
      </button>
    </article>
  );
}
