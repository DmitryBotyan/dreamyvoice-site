"use client";

import {
  cloneElement,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

type DockMetrics = {
  width: number;
  left: number;
};

type CatalogFiltersDockProps = {
  children: ReactElement;
};

const STICKY_TOP_OFFSET = 0;
const STACK_BREAKPOINT = 1110;

export function CatalogFiltersDock({
  children,
}: CatalogFiltersDockProps): ReactNode {
  const placeholderRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const [isDocked, setIsDocked] = useState(false);
  const [metrics, setMetrics] = useState<DockMetrics>({
    width: 0,
    left: 0,
  });
  const [dockedTop, setDockedTop] = useState(STICKY_TOP_OFFSET);

  const syncPlaceholderMetrics = () => {
    const placeholder = placeholderRef.current;
    if (!placeholder) {
      return;
    }
    const rect = placeholder.getBoundingClientRect();
    setMetrics((prev) => {
      if (prev.width === rect.width && prev.left === rect.left) {
        return prev;
      }
      return {
        ...prev,
        width: rect.width,
        left: rect.left,
      };
    });
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    syncPlaceholderMetrics();

    window.addEventListener("resize", syncPlaceholderMetrics);
    return () => {
      window.removeEventListener("resize", syncPlaceholderMetrics);
    };
  }, []);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") {
      return;
    }
    const placeholder = placeholderRef.current;
    if (!placeholder) {
      return;
    }
    const observer = new ResizeObserver(() => {
      syncPlaceholderMetrics();
    });
    observer.observe(placeholder);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const catalogSection = document.getElementById("catalog");
    if (!catalogSection) {
      return;
    }

    const computeTopOffset = () => {
      const header = document.querySelector<HTMLElement>(".site-header");
      const headerHeight =
        header && header.classList.contains("site-header--stuck")
          ? header.offsetHeight
          : 0;
      return headerHeight + 0;
    };

    const handleScroll = () => {
      if (!placeholderRef.current) {
        return;
      }

      if (window.innerWidth < STACK_BREAKPOINT) {
        if (isDocked) {
          setIsDocked(false);
        }
        return;
      }

      const topOffset = computeTopOffset();
      const sectionRect = catalogSection.getBoundingClientRect();
      const catalogResults =
        catalogSection.querySelector<HTMLElement>(".catalog-results");
      const resultsRect = catalogResults?.getBoundingClientRect();
      const topBoundary = resultsRect?.top ?? sectionRect.top;
      const bottomBoundary = resultsRect?.bottom ?? sectionRect.bottom;
      const panelHeight = panelRef.current?.offsetHeight ?? 0;
      const shouldDock =
        topBoundary <= topOffset &&
        bottomBoundary >= topOffset + panelHeight + 32;

      if (shouldDock) {
        const placeholderRect = placeholderRef.current.getBoundingClientRect();
        setMetrics((prev) => {
          const next = {
            ...prev,
            left: placeholderRect.left,
            width: placeholderRect.width,
          };
          if (prev.left === next.left && prev.width === next.width) {
            return prev;
          }
          return next;
        });
        if (!isDocked) {
          setDockedTop(topOffset);
        }
      }

      if (shouldDock !== isDocked) {
        setIsDocked(shouldDock);
      }
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isDocked]);

  useEffect(() => {
    if (!isDocked) {
      setDockedTop(STICKY_TOP_OFFSET);
    }
  }, [isDocked]);

  const childStyle = (children.props.style ?? {}) as CSSProperties;
  const transitionParts = ["top 0 ease", "left 0.25s ease", "width 0.25s ease"];
  const transitionValue = childStyle.transition
    ? `${childStyle.transition}, ${transitionParts.join(", ")}`
    : transitionParts.join(", ");

  const dockStyle = isDocked
    ? {
        position: "fixed",
        top: `${dockedTop}px`,
        left: `${metrics.left}px`,
        width: metrics.width ? `${metrics.width}px` : undefined,
        zIndex: 40,
      }
    : undefined;

  const mergedChild = cloneElement(children, {
    ref: (node: HTMLElement | null) => {
      panelRef.current = node;
      const { ref } = children as { ref?: unknown };
      if (typeof ref === "function") {
        ref(node);
      } else if (ref && typeof ref === "object") {
        const childRef = ref as { current: HTMLElement | null };
        // eslint-disable-next-line react-hooks/immutability
        childRef.current = node;
      }
    },
    style: {
      ...childStyle,
      transition: transitionValue,
      ...dockStyle,
    },
  });

  return (
    <div
      ref={placeholderRef}
      className="catalog-filters-wrapper"
      data-fixed={isDocked ? "true" : "false"}
    >
      {mergedChild}
    </div>
  );
}
