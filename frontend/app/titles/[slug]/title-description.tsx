"use client";

import { useState } from "react";

type TitleDescriptionProps = {
  description: string;
};

export function TitleDescriptionExpander({ description }: TitleDescriptionProps) {
  const [expanded, setExpanded] = useState(false);
  const toggleLabel = expanded ? "Свернуть описание" : "Подробное описание";

  return (
    <>
      <p
        className={`title-hero-description${
          expanded
            ? " title-hero-description--expanded"
            : " title-hero-description--clamped"
        }`}
      >
        {description}
      </p>
      <a
        href="#"
        className="title-description-toggle"
        aria-expanded={expanded}
        onClick={(event) => {
          event.preventDefault();
          setExpanded((prev) => !prev);
        }}
      >
        {toggleLabel}
      </a>
    </>
  );
}
