'use client';

import React, { useEffect, useState } from 'react';
import './SupportTickets.css';

const AdminTicketsView = ({ adminToken }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/tickets/admin/all', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  const markStatus = async (ticketId, newStatus) => {
    try {
      const res = await fetch(`/api/tickets/admin/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchTickets();
      }
    } catch (err) {
      console.error("Error updating ticket:", err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  if (loading) return <div>Loading user queries...</div>;

  return (
    <div className="admin-tickets-container">
      <h2>User Escalations & Remarks</h2>
      <table className="tickets-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>User Name</th>
            <th>Email</th>
            <th>Query / Remark</th>
            <th>Status</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {tickets.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center' }}>No tickets found.</td>
            </tr>
          ) : (
            tickets.map(t => (
              <tr key={t.id}>
                <td>#{t.id}</td>
                <td><strong>{t.user_name}</strong></td>
                <td>{t.user_email}</td>
                <td className="query-text">{t.query_text}</td>
                <td>
                  <span className={`status-badge ${t.status.toLowerCase().replace(' ', '-')}`}>
                    {t.status}
                  </span>
                </td>
                <td>{new Date(t.created_at).toLocaleDateString()}</td>
                <td>
                  {t.status === 'Pending' && (
                    <button className="resolve-btn" onClick={() => markStatus(t.id, 'Resolved')}>
                      Mark Resolved
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminTicketsView;