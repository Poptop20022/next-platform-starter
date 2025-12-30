'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function TenderDetailPage() {
  const params = useParams();
  const [tender, setTender] = useState(null);
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    setToken(storedToken);
    if (storedToken) {
      fetchTenderData(storedToken);
    } else {
      setLoading(false);
    }
  }, [params.id]);

  const fetchTenderData = async (authToken) => {
    try {
      const [tenderRes, lotsRes] = await Promise.all([
        fetch(`${API_URL}/api/tenders/${params.id}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }),
        fetch(`${API_URL}/api/lots/tender/${params.id}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        })
      ]);

      if (!tenderRes.ok || !lotsRes.ok) {
        throw new Error('Failed to fetch tender data');
      }

      const tenderData = await tenderRes.json();
      const lotsData = await lotsRes.json();

      setTender(tenderData);
      setLots(lotsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Draft: 'bg-gray-100 text-gray-800',
      CollectingQuotes: 'bg-blue-100 text-blue-800',
      Evaluation: 'bg-yellow-100 text-yellow-800',
      Decision: 'bg-purple-100 text-purple-800',
      Closed: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <Link href="/login" className="text-blue-600 hover:underline">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error || !tender) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Error: {error || 'Tender not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/tenders" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Tenders
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{tender.title}</h1>
              <p className="text-gray-600">Tender #{tender.number}</p>
            </div>
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(tender.status)}`}>
              {tender.status}
            </span>
          </div>

          {tender.description && (
            <p className="text-gray-700 mb-4">{tender.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4 mt-4">
            {tender.start_date && (
              <div>
                <span className="text-sm text-gray-500">Start Date:</span>
                <p className="text-gray-900">{new Date(tender.start_date).toLocaleDateString()}</p>
              </div>
            )}
            {tender.end_date && (
              <div>
                <span className="text-sm text-gray-500">End Date:</span>
                <p className="text-gray-900">{new Date(tender.end_date).toLocaleDateString()}</p>
              </div>
            )}
            {tender.submission_deadline && (
              <div>
                <span className="text-sm text-gray-500">Submission Deadline:</span>
                <p className="text-gray-900">{new Date(tender.submission_deadline).toLocaleDateString()}</p>
              </div>
            )}
            <div>
              <span className="text-sm text-gray-500">Created:</span>
              <p className="text-gray-900">{new Date(tender.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <a
              href={`${API_URL}/api/documents/tender/${tender.id}/invitation?format=pdf`}
              target="_blank"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Download Invitation (PDF)
            </a>
            <a
              href={`${API_URL}/api/documents/tender/${tender.id}/quote-form?format=docx`}
              target="_blank"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Download Quote Form (DOCX)
            </a>
            <Link
              href={`/tenders/${tender.id}/comparison`}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              Compare Quotes
            </Link>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Lots</h2>
          
          {lots.length === 0 ? (
            <p className="text-gray-500">No lots found</p>
          ) : (
            <div className="space-y-4">
              {lots.map((lot) => (
                <div key={lot.id} className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Lot {lot.number}: {lot.title}
                  </h3>
                  {lot.description && (
                    <p className="text-gray-600 mb-2">{lot.description}</p>
                  )}
                  <Link
                    href={`/lots/${lot.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    View Details →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

