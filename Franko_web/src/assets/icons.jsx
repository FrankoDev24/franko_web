// icons.jsx — compact inline SVGs used by the checkout UI (no external assets).
import React from 'react';

const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' };

export function ShoppingBagIcon({ size = 24, ...p }) {
  return <svg width={size} height={size} {...base} {...p}><path d="M6 6h15l-1.5 9-7.1.6A3 3 0 0 1 8 16.9V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2z" /><path d="M6 12H4" /></svg>;
}
export function LockClosedIcon({ size = 24, ...p }) {
  return <svg width={size} height={size} {...base} {...p}><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
}
export function UserIcon({ size = 24, ...p }) {
  return <svg width={size} height={size} {...base} {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
}
export function ExclamationTriangleIcon({ size = 24, ...p }) {
  return <svg width={size} height={size} {...base} stroke="currentColor" {...p}><path d="M10.29 3.25L1.42 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.25a2 2 0 0 0-3.42 0z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>;
}
export function PhoneIcon({ size = 24, ...p }) {
  return <svg width={size} height={size} {...base} {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-1.1A19.47 19.47 0 0 1 8 8.5 18.6 18.6 0 0 1 6.7 7" /></svg>;
}
export function ShieldCheckIcon({ size = 24, ...p }) {
  return <svg width={size} height={size} {...base} {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 14l2 2 4-4" /></svg>;
}
export function BriefcaseIcon({ size = 24, ...p }) {
  return <svg width={size} height={size} {...base} {...p}><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>;
}

export function CheckCircleSolid({ size = 24, color = '#16a34a', ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...p}>
      <path fill={color} d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm-.002-14a1.5 1.5 0 0 1 2.098 2.194l-.591.749a.5.5 0 0 1-.742 0l-1.57-1.58a.5.5 0 0 1 .706-.705l1.06 1.061 2.415-3.025a.5.5 0 0 1 .742.705l-.861 1.079a1.5 1.5 0 0 1-.144.104 1.49 1.49 0 0 1-1.225 0l-.204-.091z" />
    </svg>
  );
}
export function CheckCircleIcon({ size = 24, ...p }) {
  return <svg width={size} height={size} {...base} {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4.05L23.95 6l-4.04 3.96L16 8l6-6z" /></svg>;
}
export function MyLocationIcon({ size = 16, color = 'currentColor', stroke = 2, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false" {...rest}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="2.4" fill={color} />
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
    </svg>
  );
}
export default CheckCircleSolid;
