import Link from "next/link";

export function SiteNav() {
  return (
    <nav className="site-nav">
      <Link href="/#catalog">Каталог</Link>
      <Link href="/team">Команда</Link>
      <Link href="/support">Поддержать</Link>
    </nav>
  );
}
