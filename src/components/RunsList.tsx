import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { getRuns } from '../api';
import type { Run } from '../types';

function RunsList() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userFilter, setUserFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadRuns();
  }, [userFilter]);

  const loadRuns = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRuns(userFilter);
      setRuns(data || []);
    } catch (err) {
      setError('Failed to load runs: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunClick = (runId: string) => {
    navigate(`/runs/${runId}`);
  };

  const handleUserClick = (e: React.MouseEvent, userTokenHash: string) => {
    e.stopPropagation();
    navigate(`/users/${userTokenHash}`);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading runs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
        <button className="button button-primary" onClick={loadRuns}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>Audit Trail Runs</h2>
        
        <div className="filters">
          <div className="filter-group">
            <label>Filter by User Token Hash</label>
            <input
              type="text"
              className="input"
              placeholder="Enter user token hash..."
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              style={{ width: '300px' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button 
              className="button button-secondary"
              onClick={() => setUserFilter('')}
            >
              Clear Filter
            </button>
          </div>
        </div>

        {runs.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
            No runs found. Start using the Python SDK to create audit trails.
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Run ID</th>
                <th>User Token Hash</th>
                <th>Events</th>
                <th>Event Types</th>
                <th>Started</th>
                <th>Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.run_id} onClick={() => handleRunClick(run.run_id)}>
                  <td>
                    <code style={{ fontSize: '0.85rem' }}>{run.run_id}</code>
                  </td>
                  <td>
                    <button
                      className="button button-secondary"
                      onClick={(e) => handleUserClick(e, run.user_token_hash)}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                    >
                      {run.user_token_hash.substring(0, 12)}...
                    </button>
                  </td>
                  <td>
                    <span className="badge badge-info">{run.event_count}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {run.event_types && run.event_types.slice(0, 3).map((type, idx) => (
                        <span key={idx} className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                          {type}
                        </span>
                      ))}
                      {run.event_types && run.event_types.length > 3 && (
                        <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                          +{run.event_types.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {format(new Date(run.first_event_at), 'MMM d, yyyy HH:mm:ss')}
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {format(new Date(run.last_event_at), 'MMM d, yyyy HH:mm:ss')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default RunsList;
