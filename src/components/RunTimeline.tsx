import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRunTimeline } from '../api';
import TraceView from './TraceView';
import type { Event } from '../types';

function RunTimeline() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (runId) {
      loadTimeline();
    }
  }, [runId]);

  const loadTimeline = async () => {
    if (!runId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await getRunTimeline(runId);
      setEvents(data || []);
    } catch (err) {
      setError('Failed to load timeline: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: 'calc(100vh - 64px)'
      }}>
        <div className="loading">Loading timeline...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ padding: '2rem' }}>
        <div className="error">{error}</div>
        <button className="button button-primary" onClick={loadTimeline}>
          Retry
        </button>
        <button 
          className="button button-secondary" 
          onClick={() => navigate('/')}
          style={{ marginLeft: '0.5rem' }}
        >
          ← Back to Runs
        </button>
      </div>
    );
  }

  if (!runId) {
    return (
      <div className="container" style={{ padding: '2rem' }}>
        <div className="error">No run ID provided</div>
        <button 
          className="button button-secondary" 
          onClick={() => navigate('/')}
        >
          ← Back to Runs
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ 
        position: 'absolute', 
        top: '80px', 
        left: '1rem', 
        zIndex: 10 
      }}>
        <button 
          className="button button-secondary"
          onClick={() => navigate('/')}
        >
          ← Back to Runs
        </button>
      </div>
      {events.length === 0 ? (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: 'calc(100vh - 64px)',
          color: '#9ca3af'
        }}>
          <div>
            <p>No events found for this run.</p>
            <button 
              className="button button-primary" 
              onClick={loadTimeline}
              style={{ marginTop: '1rem' }}
            >
              Refresh
            </button>
          </div>
        </div>
      ) : (
        <TraceView events={events} runId={runId} />
      )}
    </div>
  );
}

export default RunTimeline;
