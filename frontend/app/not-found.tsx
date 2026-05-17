import Link from 'next/link';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <div className={styles.root}>
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>Страница не найдена</h1>
      <p className={styles.description}>
        Такой страницы не существует или она была удалена.
      </p>
      <Link href="/" className={styles.link}>
        На главную
      </Link>
    </div>
  );
}
