export type CategoryStyle = {
  class?: string;
  style?: string;
};

export const getCategoryStyle = (category: string): CategoryStyle => {
  const styles: Record<string, CategoryStyle> = {
    Gommose: {
      style:
        "background-color: var(--brand-yellow); color: color-mix(in srgb, var(--brand-pink) 60%, black); ",
    },
    Frizzanti: {
      class: "bg-teal-100 text-teal-800",
    },
    Mix: {
      style:
        "background: linear-gradient(to right, var(--brand-pink), var(--brand-blue), var(--brand-green)); color: white;",
    },
    Marshmallow: {
      class: "bg-white text-black border border-neutral-200",
    },
    Natale: {
      style: "background-color: var(--brand-red); color: white; ",
    },
    "Limited Edition": {
      style: "background-color:var(--brand-pink); color: white;",
    },
    Liquirizie: {
      class: "bg-neutral-800 text-white",
    },
    Pasqua: {
      style:
        "background-color: color-mix(in srgb, var(--brand-green) 60%, white); color: #022c22;",
    },
  };

  return styles[category] || { class: "bg-neutral-100 text-neutral-600" };
};
