'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://next-platform-starter-production.up.railway.app';

export default function ComparisonPage() {
  const params = useParams();
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLot, setSelectedLot] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    // Fetch lots first
    fetch(`${API_URL}/api/lots/tender/${params.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(lots => {
        if (lots.length > 0) {
          setSelectedLot(lots[0].id);
          fetchComparison(lots[0].id, token);
        } else {
          setLoading(false);
        }
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [params.id]);

  const fetchComparison = async (lotId, token) => {
    try {
      const response = await fetch(`${API_URL}/api/comparison/lot/${lotId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch comparison');
      }

      const data = await response.json();
      setComparison(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const token = localStorage.getItem('token');
    window.open(`${API_URL}/api/comparison/lot/${selectedLot}/export?token=${token}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!comparison) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">No comparison data available</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href={`/tenders/${params.id}`} className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Tender
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Quote Comparison - {comparison.lot.title}
            </h1>
            <button
              onClick={handleExport}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Export to Excel
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                  {comparison.quotes.map((quote) => (
                    <th key={quote.id} colSpan={3} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border-l">
                      {quote.supplier_name}
                    </th>
                  ))}
                </tr>
                <tr>
                  <th colSpan={3}></th>
                  {comparison.quotes.map((quote) => (
                    <th key={quote.id} colSpan={3} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border-l bg-gray-50">
                      Price | Delivery | Total
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {comparison.comparison.map((item) => (
                  <tr key={item.position.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {item.position.number}. {item.position.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.position.unit || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.position.quantity || '-'}</td>
                    {item.quotes.map((quote, idx) => (
                      <td key={idx} colSpan={3} className="px-4 py-3 text-sm border-l">
                        <div className="grid grid-cols-3 gap-2">
                          <span>{quote.unit_price ? `${quote.unit_price.toFixed(2)}` : '-'}</span>
                          <span>{quote.delivery_time_days ? `${quote.delivery_time_days} дн.` : '-'}</span>
                          <span className="font-semibold">{quote.total_price ? `${quote.total_price.toFixed(2)}` : '-'}</span>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

