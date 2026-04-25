// Lucide-style icons, 16px stroke 1.5
const Icon = ({ d, size = 16, ...rest }) => (
  <svg className="lucide" viewBox="0 0 24 24" width={size} height={size} {...rest}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const IconChevronLeft = (p) => <Icon {...p} d="M15 18l-6-6 6-6" />;
const IconX = (p) => <Icon {...p} d={["M18 6L6 18", "M6 6l12 12"]} />;
const IconPencil = (p) => (
  <svg className="lucide" viewBox="0 0 24 24" width={p.size || 12} height={p.size || 12}>
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);
const IconPlay = (p) => (
  <svg className="lucide" viewBox="0 0 24 24" width={p.size || 18} height={p.size || 18}>
    <polygon points="6 4 20 12 6 20 6 4" />
  </svg>
);
const IconFilm = (p) => (
  <svg className="lucide" viewBox="0 0 24 24" width={p.size || 18} height={p.size || 18}>
    <rect x="2" y="3" width="20" height="18" rx="2" />
    <path d="M2 8h20M2 16h20M7 3v18M17 3v18" />
  </svg>
);

window.IconChevronLeft = IconChevronLeft;
window.IconX = IconX;
window.IconPencil = IconPencil;
window.IconPlay = IconPlay;
window.IconFilm = IconFilm;
