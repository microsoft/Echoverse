import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { EchoForgeLogo, SectionCard } from '../echoforge-ui';
import type { User } from '../types';

export function AuthPage({ mode, setCurrentUser, currentUser, addToast }: { mode: 'login' | 'register'; setCurrentUser: (user: User | null) => void; currentUser: User | null; addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = mode === 'login'
        ? await api.login({ email, password })
        : await api.register({ username, name, email, password });
      setCurrentUser(response.user);
      addToast(mode === 'login' ? 'Signed in successfully' : 'Account created', 'success');
      navigate('/');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Authentication failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-shell-inner">
        <div className="auth-brand-panel">
          <EchoForgeLogo />
          <h1>Collaborate on code, issues, and merge requests.</h1>
          <p>
            This rebuilt frontend mirrors the real EchoForge CE sign-in experience: dark indigo masthead, centered form card, and a product narrative beside the auth flow.
          </p>
          <p>
            EchoForge is a complete DevOps platform, from project planning and source code management to CI/CD and monitoring.
          </p>
        </div>

        <SectionCard className="auth-card">
          <h2>{mode === 'login' ? 'Sign in' : 'Register'}</h2>
          <p>{mode === 'login' ? 'Continue to your dashboard.' : 'Create an account for this self-managed instance.'}</p>
          {currentUser ? <p>Currently signed in as <strong>{currentUser.name}</strong>. You can switch identities below.</p> : null}
          <form onSubmit={submit} className="form-grid">
            {mode === 'register' ? (
              <>
                <div className="field-group">
                  <label className="field-label">Username</label>
                  <input className="gl-form-input" value={username} onChange={(event) => setUsername(event.target.value)} required />
                </div>
                <div className="field-group">
                  <label className="field-label">Name</label>
                  <input className="gl-form-input" value={name} onChange={(event) => setName(event.target.value)} required />
                </div>
              </>
            ) : null}
            <div className="field-group">
              <label className="field-label">Email</label>
              <input type="email" className="gl-form-input" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <div className="field-group">
              <label className="field-label">Password</label>
              <input type="password" className="gl-form-input" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </div>
            <button disabled={submitting} className="gl-button btn btn-primary">{submitting ? 'Working…' : mode === 'login' ? 'Sign in' : 'Register'}</button>
          </form>
          <div className="auth-footer">
            {mode === 'login' ? 'Don’t have an account?' : 'Already registered?'}{' '}
            <Link to={mode === 'login' ? '/register' : '/login'}>{mode === 'login' ? 'Register now' : 'Sign in'}</Link>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
