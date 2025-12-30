'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiUrl, setApiUrl] = useState(() => {
    // Проверяем сохраненный URL из localStorage или используем env
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('api_url');
      if (saved) return saved;
    }
    return API_URL;
  });
  const [showApiInput, setShowApiInput] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    // Проверка API URL при загрузке
    const url = process.env.NEXT_PUBLIC_API_URL || apiUrl || 'http://localhost:3001';
    if (url && url !== 'http://localhost:3001') {
      setApiUrl(url);
      if (typeof window !== 'undefined') {
        localStorage.setItem('api_url', url);
      }
    } else {
      // Если URL не настроен, показываем поле для ввода
      setShowApiInput(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Проверка наличия API URL
      if (!apiUrl || apiUrl === 'http://localhost:3001') {
        throw new Error(
          'API URL не настроен. Пожалуйста, настройте NEXT_PUBLIC_API_URL в Netlify Environment Variables.'
        );
      }

      console.log('Attempting login to:', `${apiUrl}/api/auth/login`);

      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: { message: `HTTP ${response.status}: ${response.statusText}` } };
        }
        throw new Error(errorData.error?.message || `Login failed: ${response.status}`);
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/tenders');
    } catch (err) {
      console.error('Login error:', err);
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.name === 'TypeError') {
        setError(
          `Не удалось подключиться к серверу. Проверьте:\n` +
          `1. Backend запущен и доступен: ${apiUrl}\n` +
          `2. NEXT_PUBLIC_API_URL настроен в Netlify\n` +
          `3. CORS настроен на backend`
        );
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const testConnection = async () => {
    if (!apiUrl || apiUrl === 'http://localhost:3001') {
      alert('⚠️ Пожалуйста, введите URL backend');
      setShowApiInput(true);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`✅ Backend доступен!\n\nURL: ${apiUrl}\n\nОтвет:\n${JSON.stringify(data, null, 2)}\n\nТеперь можно войти!`);
        setShowApiInput(false);
        setError(null);
      } else {
        alert(`❌ Backend вернул ошибку: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      alert(`❌ Не удалось подключиться к backend:\n\n${err.message}\n\nПроверьте:\n1. URL правильный (начинается с https://)\n2. Backend запущен\n3. Нет проблем с CORS`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">TenderHub Login</h1>

        {/* API URL Input - показываем если не настроен */}
        {showApiInput && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <div className="text-sm font-semibold text-yellow-800 mb-2">
              ⚠️ API URL не настроен
            </div>
            <div className="text-xs text-yellow-700 mb-3">
              Введите URL вашего backend (например: https://your-backend.railway.app)
            </div>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => {
                const url = e.target.value.trim();
                setApiUrl(url);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('api_url', url);
                }
              }}
              placeholder="https://your-backend.railway.app"
              className="w-full px-3 py-2 border border-yellow-300 rounded-md text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={testConnection}
                className="text-xs px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                Проверить подключение
              </button>
              <button
                type="button"
                onClick={() => {
                  if (apiUrl && apiUrl !== 'http://localhost:3001') {
                    setShowApiInput(false);
                  }
                }}
                className="text-xs px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Скрыть
              </button>
            </div>
          </div>
        )}

        {/* Debug info */}
        <div className="mb-4 p-3 bg-gray-100 rounded text-xs">
          <div className="font-semibold mb-1">Текущий API URL:</div>
          <div className="font-mono text-xs break-all mb-2">{apiUrl || 'не настроен'}</div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowApiInput(!showApiInput)}
              className="text-blue-600 hover:underline text-xs"
            >
              {showApiInput ? 'Скрыть' : 'Изменить'} URL
            </button>
            <button
              type="button"
              onClick={testConnection}
              className="text-blue-600 hover:underline text-xs"
            >
              Тест подключения →
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 whitespace-pre-line text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="admin@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="admin123"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-4 text-xs text-gray-500 text-center space-y-1">
          <div>По умолчанию: admin@example.com / admin123</div>
          {(!apiUrl || apiUrl === 'http://localhost:3001') && (
            <div className="text-red-600 font-semibold mt-2">
              ⚠️ Настройте NEXT_PUBLIC_API_URL в Netlify или введите URL вручную выше
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
