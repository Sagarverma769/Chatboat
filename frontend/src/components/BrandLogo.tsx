import Image from 'next/image';

interface BrandLogoProps {
  className?: string;
}

export default function BrandLogo({ className = '' }: BrandLogoProps) {
  return (
    <div className={className}>
      <div
        role="img"
        aria-label="Axis Ind-Sphinx, since 1987"
        className="relative flex h-11 w-[128px] shrink-0 items-center gap-1.5 overflow-hidden rounded-xl border-2 border-cyan-300/80 bg-slate-50 px-1.5 shadow-[0_0_30px_rgba(34,211,238,0.42)] ring-1 ring-blue-400/40 sm:h-12 sm:w-[196px] sm:gap-2 sm:px-2"
      >
        <Image
          src="/indphinx.png"
          alt=""
          width={74}
          height={74}
          priority
          className="h-8 w-8 shrink-0 object-contain sm:h-9 sm:w-9"
        />
        <span className="min-w-0 flex-1 text-center leading-none">
          <span className="block text-[10px] font-black text-blue-950 sm:text-sm">AXIS</span>
          <span className="mt-0.5 block whitespace-nowrap text-[8px] font-black text-indigo-950 sm:text-[10px]">IND-SPHINX</span>
          <span className="mt-0.5 hidden text-[7px] font-semibold text-slate-500 sm:block">Since 1987</span>
        </span>
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500 via-cyan-300 to-blue-500" />
      </div>
    </div>
  );
}