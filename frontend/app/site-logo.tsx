"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type MouseEvent } from "react";

export function SiteLogo() {
  const router = useRouter();

  const handleLogoClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    if (typeof window === "undefined") {
      return;
    }

    const scrollToTop = () =>
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    scrollToTop();
    void router.push("/", { scroll: false });
  };

  return (
    <Link href="/" className="site-logo" onClick={handleLogoClick}>
      DreamyVoice
    </Link>
  );
}
