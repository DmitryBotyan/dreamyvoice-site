import Link from 'next/link';
import { AuthForm } from '../auth-form';

export default function RegisterPage() {
  return (
    <section className="auth-page-card">
      <header className="auth-page-header">
        <h1 className="auth-page-title">Создание аккаунта</h1>
        <p className="auth-page-subtitle">
          Уже зарегистрированы? <Link href="/login">Войдите</Link>
        </p>
      </header>
      <AuthForm mode="register" />
    </section>
  );
}
