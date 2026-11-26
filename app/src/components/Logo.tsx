/** The Paraf mark: a handwritten initial ("paraf") on a sage tile. Same drawing as public/favicon.svg. */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="5" fill="#67724f" />
      <path
        d="M7 20c3-6 5-9 6.5-9 2 0-1.5 9 .5 9 1.6 0 3-4 4.6-4 1.3 0 .4 3 1.6 3 1 0 2-1.3 4.8-4"
        fill="none"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 24.5h16" stroke="#d6dcc6" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
