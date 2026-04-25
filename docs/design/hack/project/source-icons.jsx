// Source Input — Lucide-style icons, stroke 1.5
const SIcon = ({ children, size = 16, className = "lucide", ...rest }) => (
  <svg className={className} viewBox="0 0 24 24" width={size} height={size} {...rest}>
    {children}
  </svg>
);

const IconGitHub = ({ size = 14 }) => (
  <SIcon size={size}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </SIcon>
);

const IconLinear = ({ size = 14 }) => (
  <SIcon size={size}>
    <path d="M3 13a9 9 0 0 1 9 9" />
    <path d="M3 8.5A12.5 12.5 0 0 1 15.5 21" />
    <path d="M3 4a17 17 0 0 1 17 17" />
  </SIcon>
);

const IconPdf = ({ size = 14 }) => (
  <SIcon size={size}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M9 13h6M9 17h4" />
  </SIcon>
);

const IconSettings = ({ size = 16 }) => (
  <SIcon size={size}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </SIcon>
);

const IconChevDown = ({ size = 14 }) => (
  <SIcon size={size}><path d="M6 9l6 6 6-6" /></SIcon>
);
const IconChevRight = ({ size = 14 }) => (
  <SIcon size={size}><path d="M9 6l6 6-6 6" /></SIcon>
);
const IconEye = ({ size = 14 }) => (
  <SIcon size={size}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </SIcon>
);
const IconPencil = ({ size = 12 }) => (
  <SIcon size={size}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></SIcon>
);
const IconCheck = ({ size = 10 }) => (
  <SIcon size={size}><path d="M20 6L9 17l-5-5" /></SIcon>
);
const IconArrowRight = ({ size = 14 }) => (
  <SIcon size={size}>
    <path d="M5 12h14" />
    <path d="M13 5l7 7-7 7" />
  </SIcon>
);
const IconPlay = ({ size = 12 }) => (
  <SIcon size={size}><polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none" /></SIcon>
);

Object.assign(window, {
  IconGitHub, IconLinear, IconPdf, IconSettings,
  IconChevDown, IconChevRight, IconEye, IconPencil,
  IconCheck, IconArrowRight, IconPlay,
});
