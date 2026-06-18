import { FormEvent, useState } from "react";
import { apiRequest } from "../api/apiClient";
import { ErrorBox } from "../components/ErrorBox";
import type { LoginResponse } from "../types/api";

export function LoginPage(props: {
  authError: string;
  setAuthError: (value: string) => void;
  onLoginSuccess: (accessToken: string) => void;
}) {
  const [email, setEmail] = useState("admin@phonestore.com");
  const [password, setPassword] = useState("Admin123!");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    props.setAuthError("");

    try {
      const response = await apiRequest<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password
        })
      });

      if (!response.accessToken) {
        throw new Error("La respuesta no contiene accessToken.");
      }

      props.onLoginSuccess(response.accessToken);
    } catch (error) {
      props.setAuthError(error instanceof Error ? error.message : "Error de login.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="loginPage">
      <section className="loginBrand">
        <div className="brandLogo">PS</div>
        <h1>PhoneStore</h1>
        <p>Sistema administrativo conectado al backend real.</p>
        <ul>
          <li>Inventario real</li>
          <li>Ventas reales</li>
          <li>Clientes reales</li>
          <li>Autenticación JWT</li>
        </ul>
      </section>

      <section className="loginCard">
        <h2>Iniciar sesión</h2>
        <p>Accede usando credenciales existentes del backend.</p>

        <form onSubmit={handleSubmit}>
          <label>
            Correo electrónico
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Contraseña
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
              required
            />
          </label>

          {props.authError && <ErrorBox message={props.authError} />}

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
