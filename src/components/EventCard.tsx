import React, { useState } from 'react';
import { format } from 'date-fns';
import HumanEditDiff from './HumanEditDiff';
import type { Event, ToolCallData, AgentStepData, NetworkCallData, HumanEditData } from '../types';

interface EventCardProps {
  event: Event;
}

function EventCard({ event }: EventCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  const eventData = event.event_data;

  const getEventTypeBadgeClass = (type: string): string => {
    if (type.includes('ERROR')) return 'badge-error';
    if (type.includes('TOOL_CALL')) return 'badge-info';
    if (type === 'HUMAN_EDIT') return 'badge-warning';
    if (type.includes('START')) return 'badge-success';
    return 'badge-info';
  };

  const renderEventContent = () => {
    switch (event.event_type) {
      case 'HUMAN_EDIT':
        return <HumanEditDiff data={eventData as HumanEditData} />;
      
      case 'TOOL_CALL_START':
      case 'TOOL_CALL_END': {
        const toolData = eventData as ToolCallData;
        return (
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Tool:</strong> {toolData.tool_name}
            </div>
            {toolData.inputs && (
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Inputs:</strong>
                <pre className="json-viewer" style={{ marginTop: '0.25rem' }}>
                  {JSON.stringify(toolData.inputs, null, 2)}
                </pre>
              </div>
            )}
            {toolData.outputs && (
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Outputs:</strong>
                <pre className="json-viewer" style={{ marginTop: '0.25rem' }}>
                  {JSON.stringify(toolData.outputs, null, 2)}
                </pre>
              </div>
            )}
            {toolData.duration_ms && (
              <div>
                <strong>Duration:</strong> {toolData.duration_ms}ms
              </div>
            )}
            {toolData.error && (
              <div style={{ color: '#991b1b', marginTop: '0.5rem' }}>
                <strong>Error:</strong> {toolData.error}
              </div>
            )}
          </div>
        );
      }

      case 'AGENT_STEP': {
        const stepData = eventData as AgentStepData;
        return (
          <div style={{ marginTop: '0.75rem' }}>
            {stepData.step_name && (
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Step:</strong> {stepData.step_name}
              </div>
            )}
            {stepData.inputs && (
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Inputs:</strong>
                <pre className="json-viewer" style={{ marginTop: '0.25rem' }}>
                  {JSON.stringify(stepData.inputs, null, 2)}
                </pre>
              </div>
            )}
            {stepData.outputs && (
              <div>
                <strong>Outputs:</strong>
                <pre className="json-viewer" style={{ marginTop: '0.25rem' }}>
                  {JSON.stringify(stepData.outputs, null, 2)}
                </pre>
              </div>
            )}
          </div>
        );
      }

      case 'NETWORK_CALL': {
        const netData = eventData as NetworkCallData;
        return (
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>{netData.method}</strong> {netData.url}
            </div>
            {netData.status_code && (
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Status:</strong> {netData.status_code}
              </div>
            )}
            {netData.duration_ms && (
              <div>
                <strong>Duration:</strong> {netData.duration_ms}ms
              </div>
            )}
          </div>
        );
      }

      default:
        return (
          <div style={{ marginTop: '0.75rem' }}>
            <pre className="json-viewer">
              {JSON.stringify(eventData, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    <div className="card" style={{ marginBottom: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span className={`badge ${getEventTypeBadgeClass(event.event_type)}`}>
              {event.event_type}
            </span>
            {event.sequence_num !== null && (
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                #{event.sequence_num}
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
            {format(new Date(event.timestamp), 'MMM d, yyyy HH:mm:ss.SSS')}
          </div>
        </div>
        <button
          className="button button-secondary"
          onClick={() => setExpanded(!expanded)}
          style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
        >
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {expanded && renderEventContent()}
    </div>
  );
}

export default EventCard;
