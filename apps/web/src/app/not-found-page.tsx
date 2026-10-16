import { Link } from 'react-router-dom';

/** Página 404 para rutas no reconocidas. */
export function NotFoundPage() {
  return (
    <div className="page page--centered">
      <div className="card not-found">
        <h1 className="not-found__code">404</h1>
        <p className="not-found__text">La página que buscas no existe o fue movida.</p>
        <Link className="btn btn--primary" to="/">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
