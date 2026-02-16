const MadhubaniPattern = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" opacity="0.06">
    {/* Central lotus */}
    <circle cx="200" cy="200" r="40" stroke="currentColor" strokeWidth="2" />
    <circle cx="200" cy="200" r="60" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="200" cy="200" r="80" stroke="currentColor" strokeWidth="1" />
    {/* Petals */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
      <ellipse
        key={angle}
        cx="200"
        cy="130"
        rx="12"
        ry="30"
        stroke="currentColor"
        strokeWidth="1.5"
        transform={`rotate(${angle} 200 200)`}
      />
    ))}
    {/* Outer decorative dots */}
    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
      <circle
        key={angle}
        cx={200 + 100 * Math.cos((angle * Math.PI) / 180)}
        cy={200 + 100 * Math.sin((angle * Math.PI) / 180)}
        r="4"
        fill="currentColor"
      />
    ))}
    {/* Corner flowers */}
    {[[50, 50], [350, 50], [50, 350], [350, 350]].map(([cx, cy], i) => (
      <g key={i}>
        <circle cx={cx} cy={cy} r="20" stroke="currentColor" strokeWidth="1.5" />
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <ellipse
            key={a}
            cx={cx}
            cy={(cy as number) - 15}
            rx="6"
            ry="12"
            stroke="currentColor"
            strokeWidth="1"
            transform={`rotate(${a} ${cx} ${cy})`}
          />
        ))}
      </g>
    ))}
    {/* Fish motifs (Madhubani signature) */}
    <path d="M80 200 Q100 185 120 200 Q100 215 80 200Z" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="112" cy="200" r="2" fill="currentColor" />
    <path d="M280 200 Q300 185 320 200 Q300 215 280 200Z" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="312" cy="200" r="2" fill="currentColor" />
    {/* Peacock feather eyes */}
    <ellipse cx="200" cy="50" rx="15" ry="8" stroke="currentColor" strokeWidth="1" />
    <circle cx="200" cy="50" r="4" fill="currentColor" />
    <ellipse cx="200" cy="350" rx="15" ry="8" stroke="currentColor" strokeWidth="1" />
    <circle cx="200" cy="350" r="4" fill="currentColor" />
  </svg>
);

const WarliDivider = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center justify-center gap-4 py-4 ${className}`}>
    <div className="h-px flex-1 bg-border" />
    <svg width="120" height="40" viewBox="0 0 120 40" fill="none" className="text-primary opacity-40">
      {/* Warli figures holding hands */}
      {[20, 40, 60, 80, 100].map((x, i) => (
        <g key={i}>
          <circle cx={x} cy="10" r="4" stroke="currentColor" strokeWidth="1.5" />
          <line x1={x} y1="14" x2={x} y2="26" stroke="currentColor" strokeWidth="1.5" />
          <line x1={x} y1="18" x2={x - 8} y2="22" stroke="currentColor" strokeWidth="1.5" />
          <line x1={x} y1="18" x2={x + 8} y2="22" stroke="currentColor" strokeWidth="1.5" />
          <line x1={x} y1="26" x2={x - 6} y2="36" stroke="currentColor" strokeWidth="1.5" />
          <line x1={x} y1="26" x2={x + 6} y2="36" stroke="currentColor" strokeWidth="1.5" />
        </g>
      ))}
    </svg>
    <div className="h-px flex-1 bg-border" />
  </div>
);

const RangoliDivider = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center justify-center py-6 ${className}`}>
    <svg width="200" height="24" viewBox="0 0 200 24" className="text-primary opacity-30">
      <path d="M0 12 Q25 0 50 12 Q75 24 100 12 Q125 0 150 12 Q175 24 200 12" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M0 12 Q25 24 50 12 Q75 0 100 12 Q125 24 150 12 Q175 0 200 12" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {[0, 50, 100, 150, 200].map((x) => (
        <circle key={x} cx={x} cy="12" r="3" fill="currentColor" />
      ))}
    </svg>
  </div>
);

export { MadhubaniPattern, WarliDivider, RangoliDivider };
