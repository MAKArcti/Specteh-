import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Header() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  if (!session) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="app-header">
      <Link to="/" className="app-header__brand">
        Spectech
      </Link>
      <span className="app-header__role">{session.role}</span>
      <button type="button" onClick={handleLogout}>
        Log out
      </button>
    </header>
  );
}
