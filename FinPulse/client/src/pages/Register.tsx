import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Could not create account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-paper-100 mb-1">FinPulse</h1>
        <p className="text-sm text-paper-500 mb-6">Create your account</p>

        <form onSubmit={submit} className="space-y-3">
          <input
            required
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-ink-800 border border-ink-border rounded-sm px-3 py-2 text-sm text-paper-100 placeholder:text-paper-500"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-ink-800 border border-ink-border rounded-sm px-3 py-2 text-sm text-paper-100 placeholder:text-paper-500"
          />
          <input
            required
            type="password"
            placeholder="Password (min. 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-ink-800 border border-ink-border rounded-sm px-3 py-2 text-sm text-paper-100 placeholder:text-paper-500"
          />
          {error && <p className="text-loss-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-marigold-500 hover:bg-marigold-600 disabled:opacity-50 text-ink-950 font-medium rounded-sm py-2 text-sm transition-colors"
          >
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-sm text-paper-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-marigold-400 hover:text-marigold-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
