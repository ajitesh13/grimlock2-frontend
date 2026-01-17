import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserStats } from '../api';
import type { UserStats as UserStatsType } from '../types';

interface StatCardProps {
  label: string;
  value: number;
  color: string;
}

function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div style={{
      padding: '1.5rem',
      borderRadius: '8px',
      backgroundColor: '#f9fafb',
      border: `2px solid ${color}20`,
    }}>
      <div style={{ 
        fontSize: '2rem', 
        fontWeight: 'bold', 
        color: color,
        marginBottom: '0.5rem'
      }}>
        {value}
      </div>
      <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
        {label}
      </div>
    </div>
  );
}

function UserStats() {
  const { userTokenHash } = useParams<{ userTokenHash: string }>();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userTokenHash) {
      loadStats();
    }
  }, [userTokenHash]);

  const loadStats = async () => {
    if (!userTokenHash) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await getUserStats(userTokenHash);
      setStats(data);
    } catch (err) {
      setError('Failed to load user stats: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading user stats...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
        <button className="button button-primary" onClick={loadStats}>
          Retry
        </button>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '1rem' }}>
        <button 
          className="button button-secondary"
          onClick={() => navigate('/')}
        >
          ← Back to Runs
        </button>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>User Statistics</h2>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>
            User Token Hash
          </div>
          <code style={{ fontSize: '0.9rem' }}>{stats.user_token_hash}</code>
        </div>

        {stats.user_id && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              User ID
            </div>
            <div>{stats.user_id}</div>
          </div>
        )}

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginTop: '1.5rem'
        }}>
          <StatCard label="Total Events" value={stats.total_events} color="#2563eb" />
          <StatCard label="Total Runs" value={stats.total_runs} color="#7c3aed" />
          <StatCard label="Tool Calls" value={stats.tool_calls} color="#0891b2" />
          <StatCard label="Human Edits" value={stats.human_edits} color="#ea580c" />
          <StatCard label="Custom Events" value={stats.custom_events} color="#65a30d" />
        </div>
      </div>
    </div>
  );
}

export default UserStats;
