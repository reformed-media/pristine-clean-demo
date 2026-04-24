/* Long Island service area placeholder map */
/* TODO: replace with actual map component or real map image */
export function ServiceMap() {
  return (
    <div className="relative w-full aspect-[4/3] rounded-sm overflow-hidden border border-border bg-surface">
      <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="glow" cx="55%" cy="55%" r="40%">
            <stop offset="0%" stopColor="#3D5CFF" stopOpacity="0.45" />
            <stop offset="70%" stopColor="#3D5CFF" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#3D5CFF" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* abstract long island shape */}
        <path
          d="M40 160 Q90 130 150 145 Q220 150 280 140 Q330 135 370 155 Q360 185 300 185 Q230 195 170 190 Q100 195 60 185 Z"
          fill="#1F2230"
          stroke="#3D5CFF"
          strokeOpacity="0.4"
          strokeWidth="1"
        />
        <circle cx="220" cy="165" r="90" fill="url(#glow)" />
        <circle cx="220" cy="165" r="4" fill="#3D5CFF" />
        <text x="230" y="160" fill="#F5F5F7" fontSize="11" fontWeight="600">Long Island</text>
        <text x="230" y="175" fill="#8B8D98" fontSize="9">Nassau · Suffolk</text>
      </svg>
    </div>
  );
}
