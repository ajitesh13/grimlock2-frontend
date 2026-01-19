import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRunTimeline } from '../api';
import EventCard from './EventCard';
import type { Event } from '../types';

type ViewMode = 'all' | 'logs' | 'network';

function RunTimeline() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('all');

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

  const { logs, networkCalls } = useMemo(() => {
    const logsList: Event[] = [];
    const networkList: Event[] = [];

    events.forEach(event => {
      // Network-related events
      if (event.event_type === 'NETWORK_CALL' || 
          event.event_type === 'TOOL_CALL_START' || 
          event.event_type === 'TOOL_CALL_END' ||
          event.event_type === 'tool.call.start' ||
          event.event_type === 'tool.call.end' ||
          event.event_type === 'tool.call.error') {
        networkList.push(event);
      } else {
        // All other events (agent runs, LLM calls, agent steps, human edits, etc.)
        logsList.push(event);
      }
    });

    return { logs: logsList, networkCalls: networkList };
  }, [events]);

  const displayedEvents = useMemo(() => {
    switch (viewMode) {
      case 'logs':
        return logs;
      case 'network':
        return networkCalls;
      default:
        return events;
    }
  }, [viewMode, logs, networkCalls, events]);

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading timeline...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
        <button className="button button-primary" onClick={loadTimeline}>
          Retry
        </button>
      </div>
    );
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ marginBottom: '0.5rem' }}>Run Timeline</h2>
            <p style={{ color: '#6b7280', margin: 0 }}>
              <code style={{ fontSize: '0.9rem' }}>{runId}</code>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className={`button ${viewMode === 'all' ? 'button-primary' : 'button-secondary'}`}
              onClick={() => setViewMode('all')}
            >
              All ({events.length})
            </button>
            <button
              className={`button ${viewMode === 'logs' ? 'button-primary' : 'button-secondary'}`}
              onClick={() => setViewMode('logs')}
            >
              Logs ({logs.length})
            </button>
            <button
              className={`button ${viewMode === 'network' ? 'button-primary' : 'button-secondary'}`}
              onClick={() => setViewMode('network')}
            >
              Network Calls ({networkCalls.length})
            </button>
          </div>
        </div>

        {displayedEvents.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
            No {viewMode === 'all' ? '' : viewMode} events found for this run.
          </p>
        ) : (
          <div className="timeline">
            {displayedEvents.map((event) => (
              <div key={event.event_id} className="timeline-item">
                <div className="timeline-dot"></div>
                <EventCard event={event} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RunTimeline;
