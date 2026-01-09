import React from "react";

export type IconProps = React.SVGProps<SVGSVGElement> & {
  title?: string;
};

function Svg({ title, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : "presentation"}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function IconHome(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m3 9 9-7 9 7" />
      <path d="M9 22V12h6v10" />
      <path d="M21 10v11a1 1 0 0 1-1 1h-4" />
      <path d="M3 10v11a1 1 0 0 0 1 1h4" />
    </Svg>
  );
}

export function IconSettings(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.03.03a2.2 2.2 0 0 1-1.56 3.76 2.2 2.2 0 0 1-1.56-.65l-.03-.03a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.09 1.63V21a2.2 2.2 0 0 1-4.4 0v-.04a1.8 1.8 0 0 0-1.09-1.63 1.8 1.8 0 0 0-1.98.36l-.03.03a2.2 2.2 0 0 1-3.11 0 2.2 2.2 0 0 1 0-3.11l.03-.03A1.8 1.8 0 0 0 4.6 15a1.8 1.8 0 0 0-1.63-1.09H2.93a2.2 2.2 0 0 1 0-4.4h.04A1.8 1.8 0 0 0 4.6 8.42a1.8 1.8 0 0 0-.36-1.98l-.03-.03a2.2 2.2 0 0 1 3.11-3.11l.03.03a1.8 1.8 0 0 0 1.98.36A1.8 1.8 0 0 0 10.42 2.9V2.86a2.2 2.2 0 0 1 4.4 0v.04a1.8 1.8 0 0 0 1.09 1.63 1.8 1.8 0 0 0 1.98-.36l.03-.03a2.2 2.2 0 0 1 3.11 3.11l-.03.03a1.8 1.8 0 0 0-.36 1.98 1.8 1.8 0 0 0 1.63 1.09h.04a2.2 2.2 0 0 1 0 4.4h-.04A1.8 1.8 0 0 0 19.4 15Z" />
    </Svg>
  );
}

export function IconHistory(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 3v6h6" />
      <path d="M12 7v5l3 3" />
    </Svg>
  );
}

export function IconBot(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 8V4" />
      <path d="M8 4h8" />
      <rect x="4" y="8" width="16" height="12" rx="2" />
      <path d="M9 12h.01" />
      <path d="M15 12h.01" />
      <path d="M10 16h4" />
    </Svg>
  );
}

export function IconShield(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </Svg>
  );
}

export function IconBarChart(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 3v18h18" />
      <path d="M7 16V9" />
      <path d="M12 16V5" />
      <path d="M17 16v-7" />
    </Svg>
  );
}

export function IconGitCompare(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3v18" />
      <path d="m7 7 5-4 5 4" />
      <path d="m7 17 5 4 5-4" />
    </Svg>
  );
}

export function IconGitCommit(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v6" />
      <path d="M12 15v6" />
    </Svg>
  );
}

export function IconFileDown(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M12 18v-6" />
      <path d="m9 15 3 3 3-3" />
    </Svg>
  );
}

export function IconZap(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
    </Svg>
  );
}

export function IconArrowRight(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </Svg>
  );
}

export function IconArrowLeft(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </Svg>
  );
}

export function IconSparkles(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 3l1.5 4.5L15 9l-4.5 1.5L9 15l-1.5-4.5L3 9l4.5-1.5L9 3Z" />
      <path d="M19 5l.8 2.2L22 8l-2.2.8L19 11l-.8-2.2L16 8l2.2-.8L19 5Z" />
    </Svg>
  );
}

export function IconFileText(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
      <path d="M10 9H8" />
    </Svg>
  );
}

export function IconBookOpen(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 7v14" />
      <path d="M3 18V6a2 2 0 0 1 2-2h4a3 3 0 0 1 3 3" />
      <path d="M21 18V6a2 2 0 0 0-2-2h-4a3 3 0 0 0-3 3" />
    </Svg>
  );
}

export function IconRocket(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4.5 16.5c-1.5 1.5-1.5 4 0 5.5 1.5-1.5 4-1.5 5.5 0 1.5-1.5 1.5-4 0-5.5-1.5-1.5-4-1.5-5.5 0Z" />
      <path d="M9 18c0-5 5-10 10-10 0 5-5 10-10 10Z" />
      <path d="M12 12l-4-4" />
      <path d="M16 8l-4-4" />
    </Svg>
  );
}

export function IconTerminal(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m4 17 6-6-6-6" />
      <path d="M12 19h8" />
    </Svg>
  );
}

export function IconRefreshCw(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M21 12a9 9 0 0 0-15.5-6.4" />
      <path d="M3 4v6h6" />
      <path d="M3 12a9 9 0 0 0 15.5 6.4" />
      <path d="M21 20v-6h-6" />
    </Svg>
  );
}

export function IconHelpCircle(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4" />
      <path d="M12 17h.01" />
    </Svg>
  );
}

export function IconGithub(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 19c-4 1.5-4-2.5-5-3" />
      <path d="M14 22v-3.2a2.8 2.8 0 0 0-.8-2.2c2.7-.3 5.5-1.3 5.5-6a4.7 4.7 0 0 0-1.2-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.3 1.2a11.5 11.5 0 0 0-6 0C5.8 3.9 4.8 4.2 4.8 4.2a4.3 4.3 0 0 0-.1 3.2A4.7 4.7 0 0 0 3.5 10.6c0 4.7 2.8 5.7 5.5 6a2.8 2.8 0 0 0-.8 2.1V22" />
    </Svg>
  );
}

export function IconGitlab(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 21 3 14l3-10h4l2 6 2-6h4l3 10-9 7Z" />
    </Svg>
  );
}

export function IconWrench(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4l-6.8 6.8a2 2 0 0 0 2.8 2.8l6.8-6.8a4 4 0 0 0 5.4-5.4l-2.1 2.1-2.8-2.8 2.1-2.1Z" />
    </Svg>
  );
}

export function IconCloud(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M17.5 19H7a4 4 0 0 1 0-8 5.5 5.5 0 0 1 10.8 1.2A3.5 3.5 0 0 1 17.5 19Z" />
    </Svg>
  );
}

export function IconCpu(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="8" y="8" width="8" height="8" rx="1" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M5 5l1.5 1.5" />
      <path d="M17.5 17.5 19 19" />
      <path d="M19 5l-1.5 1.5" />
      <path d="M5 19l1.5-1.5" />
    </Svg>
  );
}

export function IconGem(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 3h12l3 6-9 12L3 9l3-6Z" />
      <path d="M3 9h18" />
      <path d="M12 21 6 9l6-6 6 6-6 12Z" />
    </Svg>
  );
}

export function IconBrain(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7.5 8.5a3.5 3.5 0 0 1 6-2.4A3.5 3.5 0 0 1 18.5 9a3.5 3.5 0 0 1-1.5 6.6V17a3 3 0 0 1-3 3h-1.5" />
      <path d="M9 20H8a3 3 0 0 1-3-3v-1.4A3.5 3.5 0 0 1 6.5 9a3.5 3.5 0 0 1 1-0.5" />
      <path d="M12 7v14" />
    </Svg>
  );
}

export function IconMasks(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 4h6v6a3 3 0 0 1-6 0V4Z" />
      <path d="M14 4h6v6a3 3 0 0 1-6 0V4Z" />
      <path d="M7 10a2 2 0 0 0 2-2" />
      <path d="M17 10a2 2 0 0 1-2-2" />
    </Svg>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6l1 16h10l1-16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </Svg>
  );
}

export function IconX(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M18 6 6 18" />
      <path d="M6 6l12 12" />
    </Svg>
  );
}

export function IconPin(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 17v5" />
      <path d="M9 7V4h6v3" />
      <path d="M6 7h12l-1 8H7L6 7Z" />
    </Svg>
  );
}

export function IconMessageSquare(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
    </Svg>
  );
}

export function IconExpand(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M15 3h6v6" />
      <path d="M9 21H3v-6" />
      <path d="M21 3 14 10" />
      <path d="M3 21l7-7" />
    </Svg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 6 9 17l-5-5" />
    </Svg>
  );
}

export function IconAlertTriangle(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M10.3 3.7 1.9 18.1A2 2 0 0 0 3.6 21h16.8a2 2 0 0 0 1.7-2.9L13.7 3.7a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </Svg>
  );
}

export function IconInfo(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </Svg>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Svg>
  );
}

export function IconExternalLink(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M14 7H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9" />
    </Svg>
  );
}

export function IconChevronDown(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  );
}

export function IconChevronRight(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m9 18 6-6-6-6" />
    </Svg>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Svg>
  );
}

export function IconSave(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l3 3v13a2 2 0 0 1-2 2Z" />
      <path d="M7 21v-8h10v8" />
      <path d="M7 3v4h8" />
    </Svg>
  );
}

export function IconUpload(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3v12" />
      <path d="m7 8 5-5 5 5" />
      <path d="M21 21H3" />
    </Svg>
  );
}

export function IconDownload(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M21 21H3" />
    </Svg>
  );
}

export function IconLightbulb(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12c.7.6 1 1.5 1 2.5V18h6v-1.5c0-1 .3-1.9 1-2.5a7 7 0 0 0-4-12Z" />
    </Svg>
  );
}

export function IconHeart(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
    </Svg>
  );
}

export function IconSquare(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="6" y="6" width="12" height="12" />
    </Svg>
  );
}
