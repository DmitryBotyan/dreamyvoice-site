import Link from 'next/link';
import { AuthForm } from '../auth-form';

export default function LoginPage() {
  return (
    <section className="auth-page-card">
      <header className="auth-page-header">
        <h1 className="auth-page-title">Вход в аккаунт</h1>
        <p className="auth-page-subtitle">
          Нет аккаунта? <Link href="/register">Зарегистрируйтесь</Link>
        </p>
      </header>
      <AuthForm mode="login" />
    </section>
  );
}
