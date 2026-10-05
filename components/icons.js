const b = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
const mk = (d) => function Icon() { return <svg {...b}>{d}</svg>; };

export const SunIcon = mk(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>);
export const MoonIcon = mk(<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />);
export const BellIcon = mk(<><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" /></>);
export const ChevronIcon = mk(<path d="m6 9 6 6 6-6" />);
export const HomeIcon = mk(<><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>);
export const UserIcon = mk(<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>);
export const UsersIcon = mk(<><circle cx="9" cy="8" r="3.5" /><path d="M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c2.4.6 4 2.2 4 5.2" /></>);
export const BookIcon = mk(<><path d="M3 5c3-1.5 6-1.5 9 1 3-2.5 6-2.5 9-1v14c-3-1.5-6-1.5-9 1-3-2.5-6-2.5-9-1z" /><path d="M12 6v14" /></>);
export const ListIcon = mk(<><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" /></>);
export const ListCheckIcon = mk(<path d="M3.5 6l1.5 1.5L8 4.5M3.5 13l1.5 1.5L8 11.5M3.5 20l1.5 1.5L8 18.5M12 6h9M12 13h9M12 20h9" />);
export const VideoIcon = mk(<><rect x="2" y="6" width="14" height="12" rx="3" /><path d="m16 10 6-3v10l-6-3z" /></>);
export const FileIcon = mk(<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></>);
export const EditIcon = mk(<><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13 7l4 4" /></>);
export const CheckSquareIcon = mk(<><rect x="3" y="3" width="18" height="18" rx="4" /><path d="m8 12 3 3 5-6" /></>);
export const ClockIcon = mk(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>);
export const PlayIcon = mk(<path d="M7 5v14l12-7z" />);
export const CapIcon = mk(<><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" /></>);
export const CopyIcon = mk(<><rect x="9" y="9" width="12" height="12" rx="3" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></>);
export const KeyIcon = mk(<><circle cx="8" cy="15" r="4" /><path d="m11 12 9-9M16 7l3 3" /></>);
export const ShieldIcon = mk(<><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>);
export const LogoutIcon = mk(<><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 8l-4 4 4 4M6 12h11" /></>);
export const ArrowIcon = mk(<path d="M19 12H5M11 6l-6 6 6 6" />);

export function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
      <path d="M21.5 3.5 2.9 10.7c-1.3.5-1.3 1.3-.2 1.6l4.7 1.5 1.8 5.6c.2.6.1.8.7.8.5 0 .7-.2 1-.5l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8L22.9 5c.3-1.2-.5-1.8-1.4-1.5zM8.6 13.3l9.4-5.9c.4-.3.8-.1.5.2l-7.8 7-.3 3.3z" />
    </svg>
  );
}
