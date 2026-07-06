export type CategoryStyle = {
  class?: string;
  style?: string;
};

export const getCategoryStyle = (category: string): CategoryStyle => {
  const styles: Record<string, CategoryStyle> = {
    Gommose: {
      style: "background-color: var(--brand-green); color: #022c22;",
    },
    Frizzanti: {
      style:
        "background-color: var(--brand-yellow); color: color-mix(in srgb, var(--brand-pink) 60%, black); ",
    },
    Mix: {
      style:
        "background-color:var(--brand-blue); color: white;",
    },
    Marshmallow: {
      class: "bg-white text-black border border-neutral-200",
    },
    Natale: {
      style:
        "background-color: var(--brand-red); " +
        "color: black; " +
        "background-image: radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px), radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px); " +
        "background-size: 8px 8px; " +
        "background-position: 0 0, 4px 4px;",
    },
    "Limited Edition": {
      style:
        "background: linear-gradient(to right, var(--brand-pink), var(--brand-blue), var(--brand-green)); color: white;",
    },
    Liquirizie: {
      class: "bg-neutral-800 text-white",
    },
    Pasqua: {
      class: "bg-teal-100 text-teal-800",
    },
  };

  return styles[category] || { class: "bg-neutral-100 text-neutral-600" };
};
