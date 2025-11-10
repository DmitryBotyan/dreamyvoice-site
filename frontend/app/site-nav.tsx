import Link from "next/link";

export function SiteNav() {
  return (
    <nav className="site-nav">
      <a href="#catalog">Каталог</a>
      <Link href="/team">Команда</Link>
      <Link href="/support">Поддержать</Link>
    </nav>
  );
}
