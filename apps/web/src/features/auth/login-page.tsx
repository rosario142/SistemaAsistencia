import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '@/shared/api-client/client';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { useAuth } from './use-auth';

interface FieldErrors {
  email?: string;
  password?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!email.trim()) {
    errors.email = 'El correo es obligatorio.';
  } else if (!EMAIL_PATTERN.test(email.trim())) {
    errors.email = 'Introduce un correo válido.';
  }
  if (!password) {
    errors.password = 'La contraseña es obligatoria.';
  }
  return errors;
}

/** Página pública de inicio de sesión. */
export function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Si ya hay sesión iniciada, no se muestra el formulario.
  if (user) return <Navigate to={from} replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFormError(null);

    const errors = validate(email, password);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      navigate(from, { replace: true });
    } catch (cause) {
      if (cause instanceof ApiError) {
        setFormError(
          cause.statusCode === 401 || cause.statusCode === 400
            ? 'Correo o contraseña incorrectos. Revisa los datos e inténtalo de nuevo.'
            : cause.message,
        );
      } else {
        setFormError('No se pudo iniciar sesión. Inténtalo de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <section className="login-card card" aria-labelledby="login-title">
        <header className="login-card__brand">
          <span className="login-card__logo" aria-hidden="true">
            S
          </span>
          <div>
            <h1 className="login-card__title" id="login-title">
              SICAE
            </h1>
            <p className="login-card__subtitle">Sistema de Control de Asistencia Estudiantil</p>
          </div>
        </header>

        <form className="login-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
          {formError ? (
            <div className="alert alert--error" role="alert">
              {formError}
            </div>
          ) : null}

          <Input
            label="Correo electrónico"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="usuario@sicae.edu"
            value={email}
            error={fieldErrors.email}
            data-testid="login-email"
            onChange={(event) => {
              setEmail(event.target.value);
              if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }}
          />

          <Input
            label="Contraseña"
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            error={fieldErrors.password}
            data-testid="login-password"
            onChange={(event) => {
              setPassword(event.target.value);
              if (fieldErrors.password) {
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }
            }}
          />

          <Button
            type="submit"
            variant="primary"
            className="btn--block"
            loading={submitting}
            loadingText="Iniciando sesión…"
            data-testid="login-submit"
          >
            Iniciar sesión
          </Button>
        </form>

        <footer className="login-card__footer">
          <p className="muted">
            ¿Olvidaste tu contraseña? Solicita el restablecimiento al administrador del sistema.
          </p>
        </footer>
      </section>
    </div>
  );
}
