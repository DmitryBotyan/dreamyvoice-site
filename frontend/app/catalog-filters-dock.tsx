'use client';

import {
  cloneElement,
  type ReactElement,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';

type DockMetrics = {
  width: number;
  height: number;
  left: number;
  top: number;
};

type CatalogFiltersDockProps = {
  children: ReactElement;
};

export function CatalogFiltersDock({ children }: CatalogFiltersDockProps): ReactNode {
  const placeholderRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const [isDocked, setIsDocked] = useState(false);
  const [metrics, setMetrics] = useState<DockMetrics>({
    width: 0,
    height: 0,
    left: 0,
    top: 24,
  });

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
    if (typeof window === 'undefined') {
      return;
    }
    syncPlaceholderMetrics();

    window.addEventListener('resize', syncPlaceholderMetrics);
    return () => {
      window.removeEventListener('resize', syncPlaceholderMetrics);
    };
  }, []);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') {
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
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const panel = panelRef.current;
    if (!panel) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const nextHeight = Math.round(entry?.contentRect?.height ?? panel.offsetHeight);
      setMetrics((prev) => {
        if (prev.height === nextHeight) {
          return prev;
        }
        return {
          ...prev,
          height: nextHeight,
        };
      });
    });
    observer.observe(panel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const placeholder = placeholderRef.current;
    if (!placeholder) {
      return;
    }
    placeholder.style.minHeight = isDocked && metrics.height ? `${metrics.height}px` : '';
  }, [isDocked, metrics.height]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const catalogSection = document.getElementById('catalog');
    if (!catalogSection) {
      return;
    }

    const computeTopOffset = () => {
      const header = document.querySelector<HTMLElement>('.site-header');
      const headerHeight =
        header && header.classList.contains('site-header--stuck') ? header.offsetHeight : 0;
      return headerHeight + 24;
    };

    const handleScroll = () => {
      if (!placeholderRef.current) {
        return;
      }

      if (window.innerWidth < 900) {
        if (isDocked) {
          setIsDocked(false);
        }
        return;
      }

      const topOffset = computeTopOffset();
      const sectionRect = catalogSection.getBoundingClientRect();
      const shouldDock =
        sectionRect.top <= topOffset && sectionRect.bottom >= topOffset + metrics.height + 32;

      if (shouldDock) {
        const placeholderRect = placeholderRef.current.getBoundingClientRect();
        setMetrics((prev) => {
          const next = {
            ...prev,
            left: placeholderRect.left,
            width: placeholderRect.width,
            top: topOffset,
          };
          if (
            prev.left === next.left &&
            prev.width === next.width &&
            prev.top === next.top
          ) {
            return prev;
          }
          return next;
        });
      }

      if (shouldDock !== isDocked) {
        setIsDocked(shouldDock);
      }
    };

    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isDocked, metrics.height]);

  const mergedChild = cloneElement(children, {
    ref: (node: HTMLElement | null) => {
      panelRef.current = node;
      const { ref } = children as { ref?: unknown };
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref && typeof ref === 'object') {
        const childRef = ref as { current: HTMLElement | null };
        // eslint-disable-next-line react-hooks/immutability
        childRef.current = node;
      }
    },
    style: {
      ...(children.props.style ?? {}),
      ...(isDocked
        ? {
            position: 'fixed',
            top: `${metrics.top}px`,
            left: `${metrics.left}px`,
            width: metrics.width ? `${metrics.width}px` : undefined,
            zIndex: 40,
          }
        : undefined),
    },
  });

  return (
    <div
      ref={placeholderRef}
      className="catalog-filters-wrapper"
      data-fixed={isDocked ? 'true' : 'false'}
    >
      {mergedChild}
    </div>
  );
}
