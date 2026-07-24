import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../App';
import { login, register } from '../api';

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser, addToast } = useAppContext();

  const isLogin = location.pathname === '/login';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const result = await login(email, password);
        setUser(result);
        addToast('success', 'Welcome back!');
      } else {
        const result = await register(name, email, password);
        setUser(result);
        addToast('success', 'Account created successfully!');
      }
      navigate('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
      addToast('error', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-[160px] min-h-screen bg-gray-50 flex items-start justify-center px-4">
      <div className="w-full max-w-md mt-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4 text-center">
            <h1 className="text-lg font-semibold text-gray-900">
              {isLogin ? 'Log in' : 'Sign up'}
            </h1>
          </div>

          <div className="px-6 py-6">
            {/* Branding */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-rose-500">echostay</h2>
              <p className="text-sm text-gray-500 mt-1">
                {isLogin ? 'Welcome back to EchoStay' : 'Create your account'}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="Email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="Password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-semibold py-3 rounded-lg text-sm transition"
              >
                {loading ? 'Please wait...' : isLogin ? 'Log in' : 'Sign up'}
              </button>
            </form>

            {/* Toggle link */}
            <div className="mt-6 text-center text-sm text-gray-600">
              {isLogin ? (
                <>
                  Don&apos;t have an account?{' '}
                  <Link to="/signup" className="text-rose-500 font-semibold hover:underline">
                    Sign up
                  </Link>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <Link to="/login" className="text-rose-500 font-semibold hover:underline">
                    Log in
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
