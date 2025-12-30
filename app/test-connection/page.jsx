'use client';

import { useState } from 'react';

export default function TestConnectionPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('api_url') || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    }
    return 'http://localhost:3001';
  });

  const addResult = (test, status, message, details = null) => {
    setResults(prev => [...prev, { test, status, message, details, timestamp: new Date().toISOString() }]);
  };

  const runTests = async () => {
    setResults([]);
    setLoading(true);

    const url = apiUrl.trim();
    if (!url) {
      addResult('URL Check', 'error', 'API URL не указан');
      setLoading(false);
      return;
    }

    // Test 1: URL Format
    addResult('URL Format', 'info', `Проверяю URL: ${url}`);
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      addResult('URL Format', 'error', 'URL должен начинаться с http:// или https://');
      setLoading(false);
      return;
    }

    // Test 2: Health Check
    try {
      addResult('Health Check', 'info', `Проверяю доступность: ${url}/api/health`);
      const healthResponse = await fetch(`${url}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        addResult('Health Check', 'success', 'Backend доступен', healthData);
      } else {
        addResult('Health Check', 'error', `HTTP ${healthResponse.status}: ${healthResponse.statusText}`);
      }
    } catch (err) {
      addResult('Health Check', 'error', `Ошибка подключения: ${err.message}`, {
        name: err.name,
        stack: err.stack
      });
    }

    // Test 3: Auth Endpoint
    try {
      addResult('Auth Endpoint', 'info', `Проверяю: ${url}/api/auth/login`);
      const authResponse = await fetch(`${url}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com', password: 'test' })
      });

      if (authResponse.status === 401) {
        addResult('Auth Endpoint', 'success', 'Endpoint работает (ожидаемая ошибка 401 - неверные credentials)');
      } else if (authResponse.status === 404) {
        addResult('Auth Endpoint', 'error', 'Endpoint не найден (404) - проверьте маршруты backend');
      } else {
        addResult('Auth Endpoint', 'warning', `Неожиданный статус: ${authResponse.status}`);
      }
    } catch (err) {
      addResult('Auth Endpoint', 'error', `Ошибка: ${err.message}`);
    }

    // Test 4: CORS Check
    try {
      addResult('CORS Check', 'info', 'Проверяю CORS настройки');
      const corsResponse = await fetch(`${url}/api/health`, {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'GET'
        }
      });
      
      const corsHeaders = {
        'access-control-allow-origin': corsResponse.headers.get('access-control-allow-origin'),
        'access-control-allow-methods': corsResponse.headers.get('access-control-allow-methods'),
        'access-control-allow-headers': corsResponse.headers.get('access-control-allow-headers')
      };

      if (corsHeaders['access-control-allow-origin']) {
        addResult('CORS Check', 'success', 'CORS настроен', corsHeaders);
      } else {
        addResult('CORS Check', 'warning', 'CORS заголовки не найдены', corsHeaders);
      }
    } catch (err) {
      addResult('CORS Check', 'error', `Ошибка проверки CORS: ${err.message}`);
    }

    // Test 5: Environment Variables
    addResult('Environment Check', 'info', 'Проверяю переменные окружения');
    const envCheck = {
      'NEXT_PUBLIC_API_URL (build time)': process.env.NEXT_PUBLIC_API_URL || 'не настроена',
      'API URL from localStorage': localStorage.getItem('api_url') || 'не сохранена',
      'Current API URL': url,
      'Window location': typeof window !== 'undefined' ? window.location.origin : 'N/A'
    };
    addResult('Environment Check', 'info', 'Переменные окружения', envCheck);

    // Test 6: Network Connectivity
    try {
      addResult('Network Test', 'info', 'Проверяю базовую сетевую доступность');
      const testUrls = [
        'https://www.google.com',
        'https://api.github.com'
      ];
      
      for (const testUrl of testUrls) {
        try {
          const testResponse = await fetch(testUrl, { method: 'HEAD', mode: 'no-cors' });
          addResult('Network Test', 'success', `Сеть работает (${testUrl})`);
          break;
        } catch {
          continue;
        }
      }
    } catch (err) {
      addResult('Network Test', 'error', `Проблемы с сетью: ${err.message}`);
    }

    // Test 7: Backend Routes Check
    const routesToCheck = [
      '/api/health',
      '/api/auth/login',
      '/api/tenders',
      '/api-docs'
    ];

    for (const route of routesToCheck) {
      try {
        const routeResponse = await fetch(`${url}${route}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (routeResponse.status === 404) {
          addResult(`Route: ${route}`, 'error', `404 - маршрут не найден`);
        } else if (routeResponse.status === 401) {
          addResult(`Route: ${route}`, 'success', `Маршрут существует (требует авторизации)`);
        } else if (routeResponse.ok) {
          addResult(`Route: ${route}`, 'success', `Маршрут доступен (${routeResponse.status})`);
        } else {
          addResult(`Route: ${route}`, 'warning', `Статус: ${routeResponse.status}`);
        }
      } catch (err) {
        addResult(`Route: ${route}`, 'error', `Ошибка: ${err.message}`);
      }
    }

    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800 border-green-300';
      case 'error': return 'bg-red-100 text-red-800 border-red-300';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Диагностика подключения</h1>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API URL Backend:
            </label>
            <div className="flex gap-2">
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
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={runTests}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Проверка...' : 'Запустить тесты'}
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Текущий URL из переменных: {process.env.NEXT_PUBLIC_API_URL || 'не настроен'}
            </div>
          </div>

          {results.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">Результаты тестов:</h2>
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold mb-1">
                        {getStatusIcon(result.status)} {result.test}
                      </div>
                      <div className="text-sm">{result.message}</div>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs font-semibold">Детали</summary>
                          <pre className="mt-2 text-xs bg-white bg-opacity-50 p-2 rounded overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 ml-4">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              Нажмите "Запустить тесты" для диагностики
            </div>
          )}

          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <div className="mt-2 text-gray-600">Выполняются тесты...</div>
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Что проверяется:</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>✅ Формат URL</li>
            <li>✅ Доступность backend (/api/health)</li>
            <li>✅ Существование auth endpoint (/api/auth/login)</li>
            <li>✅ Настройки CORS</li>
            <li>✅ Переменные окружения</li>
            <li>✅ Сетевая доступность</li>
            <li>✅ Основные маршруты API</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

