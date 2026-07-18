import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserRole } from '@spectech/shared-types';
import { ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';

const REGISTERABLE_ROLES = [UserRole.CUSTOMER, UserRole.EQUIPMENT_OWNER];

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>(UserRole.CUSTOMER);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({
        role,
        fullName,
        phone,
        email: email || undefined,
        password,
      });
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        <label>
          I am a
          <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
            {REGISTERABLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label>
          Full name
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>
        <label>
          Phone
          <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </label>
        <label>
          Email (optional)
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
