'use client';

import React, { useState } from 'react';

const ChatEscalateForm = ({ token }) => {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/tickets/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query_text: query })
      });

      if (res.ok) {
        setSubmitted(true);
        setQuery('');
      }
    } catch (err) {
      console.error("Error submitting query:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="escalate-container">
      {submitted ? (
        <div className="success-msg">
          ✅ Query sent to IT Admin! We will get back to you shortly.
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <p className="escalate-title">Didn't find an answer? Escalate to IT Admin:</p>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe your issue or remark in detail..."
            required
            rows={3}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Submit Query'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ChatEscalateForm;