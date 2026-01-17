import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRunTimeline } from '../api';
import EventCard from './EventCard';
import type { Event } from '../types';

function RunTimeline() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventTypeFilter, setEventTypeFilter] = useState('');

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

  const filteredEvents = eventTypeFilter
    ? events.filter(e => e.event_type === eventTypeFilter)
    : events;

  const uniqueEventTypes = [...new Set(events.map(e => e.event_type))];

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
        <h2 style={{ marginBottom: '0.5rem' }}>Run Timeline</h2>
        <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
          <code style={{ fontSize: '0.9rem' }}>{runId}</code>
        </p>

        <div className="filters">
          <div className="filter-group">
            <label>Filter by Event Type</label>
            <select
              className="input"
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              style={{ width: '250px' }}
            >
              <option value="">All Events ({events.length})</option>
              {uniqueEventTypes.map(type => (
                <option key={type} value={type}>
                  {type} ({events.filter(e => e.event_type === type).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
            No events found for this run.
          </p>
        ) : (
          <div className="timeline">
            {filteredEvents.map((event) => (
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
