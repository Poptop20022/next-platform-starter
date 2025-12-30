'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://next-platform-starter-production.up.railway.app';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiUrl, setApiUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('api_url');
      // Проверяем, что сохраненный URL не является неправильным (PostgreSQL proxy и т.д.)
      if (saved) {
        const invalidPatterns = [
          /tramway\.proxy\.rlwy\.net/i,
          /\.proxy\./i,
          /:5432/i,
          /:29343/i,
          /railway\.internal/i,
          /localhost:3001/i
        ];
        
        const isInvalid = invalidPatterns.some(pattern => pattern.test(saved));
        if (!isInvalid && (saved.startsWith('http://') || saved.startsWith('https://'))) {
          return saved;
        } else {
          // Удаляем неправильный URL из localStorage
          localStorage.removeItem('api_url');
        }
      }
    }
    return API_URL;
  });
  const [showApiInput, setShowApiInput] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    // Очищаем неправильные URL из localStorage при загрузке
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('api_url');
      if (saved) {
        const invalidPatterns = [
          /tramway\.proxy\.rlwy\.net/i,
          /\.proxy\./i,
          /:5432/i,
          /:29343/i,
          /railway\.internal/i,
          /localhost:3001/i
        ];
        
        const isInvalid = invalidPatterns.some(pattern => pattern.test(saved));
        if (isInvalid) {
          // Удаляем неправильный URL
          localStorage.removeItem('api_url');
          console.log('Удален неправильный URL из localStorage:', saved);
        }
      }
    }

    const defaultUrl = 'https://next-platform-starter-production.up.railway.app';
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    const currentUrl = apiUrl;
    
    // Определяем какой URL использовать
    let urlToUse = envUrl || currentUrl || defaultUrl;
    
    // Проверяем, что URL правильный
    const invalidPatterns = [
      /tramway\.proxy\.rlwy\.net/i,
      /\.proxy\./i,
      /:5432/i,
      /:29343/i,
      /railway\.internal/i,
      /localhost:3001/i
    ];
    
    const isInvalid = invalidPatterns.some(pattern => pattern.test(urlToUse));
    
    if (isInvalid) {
      // Используем правильный URL по умолчанию
      urlToUse = defaultUrl;
      console.log('Обнаружен неправильный URL, используется по умолчанию:', defaultUrl);
    }
    
    // Устанавливаем правильный URL
    setApiUrl(urlToUse);
    if (typeof window !== 'undefined') {
      localStorage.setItem('api_url', urlToUse);
    }
    
    // Не показываем поле ввода, если URL правильный
    if (urlToUse.includes('railway.app') || urlToUse.includes('render.com') || urlToUse.includes('fly.dev')) {
      setShowApiInput(false);
    } else {
      setShowApiInput(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!apiUrl) {
        throw new Error(
          'API URL не настроен. Используется URL по умолчанию: https://next-platform-starter-production.up.railway.app'
        );
      }

      // Валидация URL перед запросом
      const validation = validateUrl(apiUrl);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Очищаем URL от слеша в конце
      const cleanUrl = apiUrl.trim().replace(/\/$/, '');

      const response = await fetch(`${cleanUrl}/api/auth/login`, {
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

  const validateUrl = (url) => {
    if (!url) return { valid: false, error: 'URL не может быть пустым' };
    
    // Проверка на неправильные URL (PostgreSQL proxy и т.д.)
    const invalidPatterns = [
      /tramway\.proxy\.rlwy\.net/i,
      /\.proxy\./i,
      /:5432/i,
      /:29343/i,
      /postgres/i,
      /database/i
    ];
    
    for (const pattern of invalidPatterns) {
      if (pattern.test(url)) {
        return { 
          valid: false, 
          error: 'Это похоже на URL базы данных, а не backend API. Нужен URL вашего backend сервиса (например: https://your-backend.railway.app)' 
        };
      }
    }
    
    // Проверка формата URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return { valid: false, error: 'URL должен начинаться с http:// или https://' };
    }
    
    try {
      new URL(url);
      return { valid: true };
    } catch {
      return { valid: false, error: 'Неверный формат URL' };
    }
  };

  const testConnection = async () => {
    if (!apiUrl) {
      setError('⚠️ Пожалуйста, введите URL backend');
      setShowApiInput(true);
      return;
    }

    // Валидация URL
    const validation = validateUrl(apiUrl);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Убедимся, что URL правильный (без слеша в конце)
      const cleanUrl = apiUrl.trim().replace(/\/$/, '');
      
      const response = await fetch(`${cleanUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setError(null);
        setShowApiInput(false);
        // Показываем успешное сообщение через временный success state
        const successMsg = `✅ Backend доступен! URL настроен правильно. Теперь можно войти.`;
        setError(null);
        alert(successMsg);
      } else {
        setError(`❌ Backend вернул ошибку: ${response.status} ${response.statusText}\n\nПроверьте, что это правильный URL вашего backend сервиса.`);
      }
    } catch (err) {
      let errorMsg = `❌ Не удалось подключиться к backend:\n\n${err.message}\n\n`;
      
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.name === 'TypeError') {
        errorMsg += `🔍 Диагностика:\n\n`;
        errorMsg += `1. Проверьте доступность в браузере:\n`;
        errorMsg += `   Откройте: ${cleanUrl}/api/health\n\n`;
        errorMsg += `2. Проверьте Railway Dashboard:\n`;
        errorMsg += `   - Backend сервис запущен? (статус "Running")\n`;
        errorMsg += `   - Есть ли ошибки в логах? (Deployments → View Logs)\n`;
        errorMsg += `   - Правильный ли Public Domain?\n\n`;
        errorMsg += `3. Проверьте переменные окружения:\n`;
        errorMsg += `   - DATABASE_URL настроен? (Neon connection string)\n`;
        errorMsg += `   - PORT = 3001?\n`;
        errorMsg += `   - JWT_SECRET задан?\n\n`;
        errorMsg += `4. Возможна проблема с CORS:\n`;
        errorMsg += `   - Проверьте backend/src/index.ts\n`;
        errorMsg += `   - Убедитесь, что ваш Netlify домен добавлен в allowedOrigins\n\n`;
        errorMsg += `Текущий URL: ${apiUrl}\n\n`;
        errorMsg += `💡 Попробуйте открыть URL в браузере напрямую для проверки.`;
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">TenderHub</h1>
          <p className="text-gray-600">Система управления тендерами</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Вход в систему</h2>

          {/* API URL Configuration - Collapsible */}
          {showApiInput && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-semibold text-amber-800 mb-2">
                    Настройка API URL
                  </h3>
                  <p className="text-xs text-amber-700 mb-3">
                    Настройте переменную <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900">NEXT_PUBLIC_API_URL</code> в Netlify или введите URL вручную:
                  </p>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={apiUrl}
                      onChange={(e) => {
                        const url = e.target.value.trim();
                        setApiUrl(url);
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('api_url', url);
                        }
                        // Очищаем ошибку при изменении
                        if (error && error.includes('URL')) {
                          setError(null);
                        }
                      }}
                      placeholder="https://next-platform-starter-production.up.railway.app"
                      className="w-full px-3 py-2 text-sm border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={testConnection}
                        disabled={loading}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? 'Проверка...' : 'Проверить подключение'}
                      </button>
                    </div>
                    <div className="text-xs text-amber-700 bg-amber-100 p-2 rounded">
                      <strong>Как найти правильный URL:</strong>
                      <ol className="list-decimal list-inside mt-1 space-y-1 ml-2">
                        <li>Railway Dashboard → ваш <strong>backend сервис</strong> (Node.js, не PostgreSQL!)</li>
                        <li>Settings → Networking</li>
                        <li>Скопируйте <strong>Public Domain</strong></li>
                        <li>Добавьте <code className="bg-amber-200 px-1">https://</code> в начало</li>
                      </ol>
                      <p className="mt-2 text-amber-800">
                        ⚠️ <strong>Не используйте</strong> URL базы данных (tramway.proxy.rlwy.net) - это не backend!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800 whitespace-pre-line">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@example.com"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Пароль
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !apiUrl}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Вход...
                </>
              ) : (
                'Войти'
              )}
            </button>
          </form>

          {/* Debug Info - Collapsible */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <details className="group">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 flex items-center justify-between">
                <span>Техническая информация</span>
                <svg className="h-4 w-4 transform group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <span className="text-gray-500">API URL:</span>
                  <code className="text-gray-700 bg-gray-100 px-2 py-1 rounded break-all text-left max-w-[70%]">
                    {apiUrl || 'https://next-platform-starter-production.up.railway.app'}
                  </code>
                </div>
                <div className="text-gray-500 text-xs pt-1">
                  По умолчанию: <code className="bg-gray-100 px-1">https://next-platform-starter-production.up.railway.app</code>
                </div>
                <div className="flex gap-2 pt-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShowApiInput(!showApiInput)}
                    className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                  >
                    {showApiInput ? 'Скрыть' : 'Изменить'} URL
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={testConnection}
                    className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                  >
                    Тест подключения
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        localStorage.removeItem('api_url');
                        const defaultUrl = 'https://next-platform-starter-production.up.railway.app';
                        setApiUrl(defaultUrl);
                        localStorage.setItem('api_url', defaultUrl);
                        setShowApiInput(false);
                        setError(null);
                        alert('URL сброшен на значение по умолчанию');
                      }
                    }}
                    className="text-red-600 hover:text-red-800 text-xs font-medium"
                    title="Сбросить URL на значение по умолчанию"
                  >
                    Сбросить URL
                  </button>
                </div>
              </div>
            </details>
          </div>

          {/* Default Credentials Hint */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              По умолчанию: <span className="font-mono text-gray-700">admin@example.com</span> / <span className="font-mono text-gray-700">admin123</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500">
          © 2025 TenderHub. Система управления тендерами.
        </p>
      </div>
    </div>
  );
}
