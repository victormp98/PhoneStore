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
        <div className="brandStage">
          <div className="brandIllustration">
            <div className="brandOrb brandOrbA"></div>
            <div className="brandOrb brandOrbB"></div>
            <div className="brandDevice">
              <div className="deviceHeader">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="deviceScreen">
                <div className="deviceLine wide"></div>
                <div className="deviceLine"></div>
                <div className="deviceLine mid"></div>
                <div className="deviceChart">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>

          <div className="brandIntro">
            <div className="brandLogo">PS</div>
            <span className="eyebrow">PhoneStore Admin</span>
            <h1>Control visual para la operación de la tienda.</h1>
            <p>Sistema administrativo conectado al backend real con foco en ventas, inventario y catálogo.</p>
          </div>
        </div>

        <div className="brandStats">
          <div>
            <strong>Ventas</strong>
            <span>Seguimiento diario y cobros</span>
          </div>
          <div>
            <strong>Inventario</strong>
            <span>Alertas de stock y reservas</span>
          </div>
          <div>
            <strong>Clientes</strong>
            <span>Base conectada al CRM</span>
          </div>
        </div>
      </section>

      <div className="loginCardContainer">
        <section className="loginCard">
          <div className="loginCardHeader">
            <span className="loginBadge">Acceso seguro</span>
            <h2>Iniciar sesión</h2>
            <p>Accede al panel con tus credenciales del sistema.</p>
          </div>

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

            <button type="submit" className="primaryButton" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
