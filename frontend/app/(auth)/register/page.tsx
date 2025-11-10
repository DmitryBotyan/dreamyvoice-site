import { AuthForm } from "../auth-form";

export default function RegisterPage() {
  return (
    <section>
      <h1>Регистрация</h1>
      <AuthForm mode="register" />
    </section>
  );
}
