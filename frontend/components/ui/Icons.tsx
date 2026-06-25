// Minimal inline SVG icon library — no external dependencies
// All icons are 16x16 by default, stroke-based, single-color

type IconProps = {
  size?: number;
  className?: string;
  strokeWidth?: number;
};

const icon = (path: string, viewBox = "0 0 16 16") =>
  function Icon({ size = 16, className = "", strokeWidth = 1.5 }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox={viewBox}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d={path} />
      </svg>
    );
  };

// Navigation & UI
export const MenuIcon = icon("M2 4h12M2 8h12M2 12h12");
export const XIcon = icon("M3 3l10 10M13 3L3 13");
export const ChevronDownIcon = icon("M4 6l4 4 4-4");
export const ChevronRightIcon = icon("M6 4l4 4-4 4");
export const ArrowRightIcon = icon("M3 8h10M9 4l4 4-4 4");
export const ArrowLeftIcon = icon("M13 8H3M7 4L3 8l4 4");
export const SearchIcon = icon("M7 13A6 6 0 107 1a6 6 0 000 12zM12.5 12.5L15 15");
export const SettingsIcon = icon("M8 10a2 2 0 100-4 2 2 0 000 4zM8 1v2M8 13v2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M1 8h2M13 8h2M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41");
export const LogOutIcon = icon("M10 2h4v12h-4M7 11l3-3-3-3M1 8h9");

// Content
export const ScanIcon = icon("M1 4V2h3M12 1h3v3M15 12v3h-3M4 15H1v-3M6 6h4v4H6z");
export const HistoryIcon = icon("M8 5v3l2 2M1 8a7 7 0 1014 0A7 7 0 001 8z");
export const MapPinIcon = icon("M8 9a3 3 0 100-6 3 3 0 000 6zM8 15s-5-4.686-5-8a5 5 0 0110 0c0 3.314-5 8-5 8z");
export const ShoppingIcon = icon("M1 1h3l1.5 7.5M5 10h8l1.5-6H4M8 14a1 1 0 100-2 1 1 0 000 2zM13 14a1 1 0 100-2 1 1 0 000 2z");
export const LayoutIcon = icon("M1 1h6v6H1zM9 1h6v6H9zM1 9h6v6H1zM9 9h6v6H9z");
export const TrophyIcon = icon("M5 1h6M3 1v4a5 5 0 0010 0V1M1 4h2M13 4h2M8 10v4M5 14h6");
export const BotIcon = icon("M6 3a2 2 0 014 0M3 7h10l1 6H2L3 7zM6 11v2M10 11v2M8 1v2");
export const LeafIcon = icon("M14 2C8 2 3 7 2 14c4-1 7-4 7-4s-1 4-3 6c8 0 8-7 8-14z");
export const UploadIcon = icon("M8 10V2M5 5l3-3 3 3M2 12v1a1 1 0 001 1h10a1 1 0 001-1v-1");
export const DownloadIcon = icon("M8 2v8M5 7l3 3 3-3M2 12v1a1 1 0 001 1h10a1 1 0 001-1v-1");
export const UserIcon = icon("M8 8a3 3 0 100-6 3 3 0 000 6zM2 14a6 6 0 0112 0");
export const MailIcon = icon("M1 3h14v10H1zM1 3l7 6 7-6");
export const LockIcon = icon("M4 7V5a4 4 0 018 0v2M2 7h12v8H2z");
export const EyeIcon = icon("M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5zM8 10a2 2 0 100-4 2 2 0 000 4z");
export const EyeOffIcon = icon("M2 2l12 12M6.7 6.7A2 2 0 0011 10.3M9.3 9.3A2 2 0 015 6M1 8s2.3-3.6 5.3-4.7M9.7 3.5C13 4.6 15 8 15 8s-2.5 3.9-6 4.8");
export const AlertIcon = icon("M8 1L1 14h14L8 1zM8 6v4M8 11.5v.5");
export const CheckIcon = icon("M2 8l4 4 8-8");
export const CheckCircleIcon = icon("M15 8A7 7 0 111 8a7 7 0 0114 0zM5 8l2 2 4-4");
export const InfoIcon = icon("M8 15A7 7 0 108 1a7 7 0 000 14zM8 7v5M8 5.5V5");
export const RefreshIcon = icon("M14 8A6 6 0 112 8M14 2v4h-4");
export const SunIcon = icon("M8 12a4 4 0 100-8 4 4 0 000 8zM8 1v2M8 13v2M4.22 4.22l1.42 1.42M10.36 10.36l1.42 1.42M1 8h2M13 8h2M4.22 11.78l1.42-1.42M10.36 5.64l1.42-1.42");
export const MoonIcon = icon("M14 10A5 5 0 014 4a6 6 0 1010 6z");
export const PlusIcon = icon("M8 2v12M2 8h12");
export const TrashIcon = icon("M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10");
export const SendIcon = icon("M14 2L1 8l6 2 2 6 5-14z");
export const ExternalLinkIcon = icon("M9 2h5v5M14 2L8 8M6 3H3a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1v-3");
export const FilterIcon = icon("M1 3h14M4 8h8M7 13h2");

// Data / Charts
export const BarChartIcon = icon("M1 13V5h4v8M6 13V3h4v10M11 13V7h4v6M1 13h14");
export const TrendUpIcon = icon("M1 13L6 7l4 3 5-7M12 3h3v3");
export const CO2Icon = icon("M3 11a4 4 0 008 0c0-3-2-5-4-8-2 3-4 5-4 8zM9 13h4M11 11v4");
export const FlameIcon = icon("M8 2c0 4-4 5-4 9a4 4 0 008 0c0-3-1-5-4-9zM6 14a2 2 0 004 0");

// Category indicators (text-based, no emoji)
export const categoryIcon = (cat: string) => {
  const map: Record<string, typeof UploadIcon> = {
    Plastic: LeafIcon,
    Paper: HistoryIcon,
    Metal: BarChartIcon,
    Glass: InfoIcon,
    Organic: LeafIcon,
    Other: RefreshIcon,
  };
  return map[cat] || RefreshIcon;
};

// Tier badge config
export const tierConfig = (tier: string) => {
  switch (tier) {
    case "Gold":   return { label: "Gold",   className: "text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20" };
    case "Silver": return { label: "Silver", className: "text-zinc-600  bg-zinc-100 dark:text-zinc-300  dark:bg-zinc-800" };
    case "Bronze": return { label: "Bronze", className: "text-orange-700 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20" };
    default:       return { label: "Member", className: "text-zinc-500  bg-zinc-100 dark:text-zinc-400  dark:bg-zinc-800" };
  }
};
