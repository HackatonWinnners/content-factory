// Result-screen-specific icons (extends source-icons.jsx)
const RIcon = ({ children, size = 16 }) => (
  <svg className="lucide" viewBox="0 0 24 24" width={size} height={size}>{children}</svg>
);

const IconArrowLeft = ({ size = 14 }) => (
  <RIcon size={size}>
    <path d="M19 12H5" /><path d="M11 5l-7 7 7 7" />
  </RIcon>
);
const IconDownload = ({ size = 14 }) => (
  <RIcon size={size}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M7 10l5 5 5-5" />
    <path d="M12 15V3" />
  </RIcon>
);
const IconLink = ({ size = 14 }) => (
  <RIcon size={size}>
    <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
    <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" />
  </RIcon>
);
const IconRefresh = ({ size = 14 }) => (
  <RIcon size={size}>
    <path d="M21 12a9 9 0 1 1-3-6.7" />
    <path d="M21 4v5h-5" />
  </RIcon>
);
const IconVolume = ({ size = 14 }) => (
  <RIcon size={size}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.5 8.5a4 4 0 0 1 0 7" />
  </RIcon>
);
const IconCC = ({ size = 14 }) => (
  <RIcon size={size}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M9 10a2 2 0 1 0 0 4M16 10a2 2 0 1 0 0 4" />
  </RIcon>
);
const IconFullscreen = ({ size = 14 }) => (
  <RIcon size={size}>
    <path d="M3 8V5a2 2 0 0 1 2-2h3" />
    <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
    <path d="M3 16v3a2 2 0 0 0 2 2h3" />
    <path d="M21 16v3a2 2 0 0 1-2 2h-3" />
  </RIcon>
);
const IconMore = ({ size = 14 }) => (
  <RIcon size={size}>
    <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
  </RIcon>
);
const IconBigPlay = ({ size = 28 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size}>
    <polygon points="7 4 21 12 7 20 7 4" fill="currentColor" />
  </svg>
);
const IconSpeaker = ({ size = 14 }) => (
  <RIcon size={size}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
  </RIcon>
);

Object.assign(window, {
  IconArrowLeft, IconDownload, IconLink, IconRefresh,
  IconVolume, IconCC, IconFullscreen, IconMore,
  IconBigPlay, IconSpeaker,
});
