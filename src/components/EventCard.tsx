import { useState } from 'react';
import { format } from 'date-fns';
import HumanEditDiff from './HumanEditDiff';
import type { Event, ToolCallData, AgentStepData, NetworkCallData, HumanEditData, LLMCallData, AgentRunData } from '../types';

interface EventCardProps {
  event: Event;
}

interface NetworkCallDetailsProps {
  netData: NetworkCallData;
}

function NetworkCallDetails({ netData }: NetworkCallDetailsProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  return (
    <div style={{ marginTop: '0.75rem' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '0.5rem',
        padding: '0.75rem',
        backgroundColor: '#f9fafb',
        borderRadius: '4px'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: '0.25rem' }}>
            <span style={{ 
              padding: '0.25rem 0.5rem',
              backgroundColor: netData.method === 'GET' ? '#dbeafe' : 
                             netData.method === 'POST' ? '#d1fae5' : 
                             netData.method === 'PUT' ? '#fef3c7' : 
                             netData.method === 'DELETE' ? '#fee2e2' : '#e5e7eb',
              color: netData.method === 'GET' ? '#1e40af' : 
                    netData.method === 'POST' ? '#065f46' : 
                    netData.method === 'PUT' ? '#92400e' : 
                    netData.method === 'DELETE' ? '#991b1b' : '#374151',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: '600',
              marginRight: '0.5rem'
            }}>
              {netData.method}
            </span>
            <span style={{ fontSize: '0.9rem', wordBreak: 'break-all' }}>
              {netData.url}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#6b7280' }}>
            {netData.status_code && (
              <span>
                Status: <strong style={{ 
                  color: netData.status_code >= 200 && netData.status_code < 300 ? '#065f46' : 
                         netData.status_code >= 400 ? '#991b1b' : '#92400e'
                }}>{netData.status_code}</strong>
              </span>
            )}
            {netData.duration_ms && (
              <span>Duration: <strong>{netData.duration_ms}ms</strong></span>
            )}
          </div>
          {netData.error && (
            <div style={{ 
              marginTop: '0.5rem',
              padding: '0.5rem',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              borderRadius: '4px',
              fontSize: '0.85rem'
            }}>
              <strong>Error:</strong> {netData.error}
            </div>
          )}
        </div>
        <button
          className="button button-secondary"
          onClick={() => setShowDetails(!showDetails)}
          style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem', marginLeft: '1rem' }}
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>
      
      {showDetails && (
        <div style={{ marginTop: '1rem', display: 'grid', gap: '1rem' }}>
          {netData.request_headers && Object.keys(netData.request_headers).length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                Request Headers
              </h4>
              <pre className="json-viewer" style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>
                {JSON.stringify(netData.request_headers, null, 2)}
              </pre>
            </div>
          )}
          
          {netData.request_payload && (
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                Request Payload
              </h4>
              <pre className="json-viewer" style={{ marginTop: '0.25rem', fontSize: '0.8rem', maxHeight: '300px', overflow: 'auto' }}>
                {typeof netData.request_payload === 'string' 
                  ? netData.request_payload 
                  : JSON.stringify(netData.request_payload, null, 2)}
              </pre>
            </div>
          )}
          
          {netData.response_headers && Object.keys(netData.response_headers).length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                Response Headers
              </h4>
              <pre className="json-viewer" style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>
                {JSON.stringify(netData.response_headers, null, 2)}
              </pre>
            </div>
          )}
          
          {netData.response_payload && (
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                Response Payload
              </h4>
              <pre className="json-viewer" style={{ marginTop: '0.25rem', fontSize: '0.8rem', maxHeight: '300px', overflow: 'auto' }}>
                {typeof netData.response_payload === 'string' 
                  ? netData.response_payload 
                  : JSON.stringify(netData.response_payload, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EventCard({ event }: EventCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  const eventData = event.event_data;

  const getEventTypeBadgeClass = (type: string): string => {
    if (type.includes('ERROR') || type.includes('.error')) return 'badge-error';
    if (type.includes('TOOL_CALL') || type.includes('tool.call')) return 'badge-info';
    if (type.includes('llm.call')) return 'badge-info';
    if (type.includes('agent.run')) return 'badge-success';
    if (type === 'HUMAN_EDIT') return 'badge-warning';
    if (type.includes('START') || type.includes('.start')) return 'badge-success';
    if (type.includes('END') || type.includes('.end')) return 'badge-success';
    return 'badge-info';
  };

  const renderEventContent = () => {
    switch (event.event_type) {
      case 'HUMAN_EDIT':
        return <HumanEditDiff data={eventData as HumanEditData} />;
      
      case 'TOOL_CALL_START':
      case 'TOOL_CALL_END':
      case 'tool.call.start':
      case 'tool.call.end':
      case 'tool.call.error': {
        const toolData = eventData as ToolCallData;
        const isStart = event.event_type === 'TOOL_CALL_START' || event.event_type === 'tool.call.start';
        const isEnd = event.event_type === 'TOOL_CALL_END' || event.event_type === 'tool.call.end';
        const isError = event.event_type === 'tool.call.error';
        
        return (
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ 
              padding: '0.75rem',
              backgroundColor: isStart ? '#eff6ff' : isError || (isEnd && toolData.status === 'error') ? '#fef2f2' : isEnd ? '#f0fdf4' : '#f9fafb',
              borderRadius: '4px',
              borderLeft: `4px solid ${isStart ? '#3b82f6' : isError || (isEnd && toolData.status === 'error') ? '#ef4444' : isEnd ? '#10b981' : '#6b7280'}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div>
                  <span className="badge badge-info" style={{ marginRight: '0.5rem' }}>
                    {toolData.tool_name || 'Unknown Tool'}
                  </span>
                  {isStart && <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Started</span>}
                  {isError && <span style={{ fontSize: '0.85rem', color: '#991b1b' }}>Error</span>}
                  {isEnd && !isError && (
                    <span style={{ fontSize: '0.85rem', color: toolData.status === 'error' ? '#991b1b' : '#065f46' }}>
                      {toolData.status === 'error' ? 'Failed' : 'Completed'}
                    </span>
                  )}
                </div>
                {toolData.duration_ms && (
                  <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                    Duration: <strong>{toolData.duration_ms}ms</strong>
                  </span>
                )}
              </div>
              
              {toolData.inputs && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#374151' }}>Inputs:</strong>
                  <pre className="json-viewer" style={{ marginTop: '0.25rem', fontSize: '0.8rem', maxHeight: '200px', overflow: 'auto' }}>
                    {JSON.stringify(toolData.inputs, null, 2)}
                  </pre>
                </div>
              )}
              
              {toolData.outputs && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#374151' }}>Outputs:</strong>
                  <pre className="json-viewer" style={{ marginTop: '0.25rem', fontSize: '0.8rem', maxHeight: '200px', overflow: 'auto' }}>
                    {JSON.stringify(toolData.outputs, null, 2)}
                  </pre>
                </div>
              )}
              
              {(toolData.error || (isError && eventData.error)) && (
                <div style={{ 
                  marginTop: '0.5rem',
                  padding: '0.5rem',
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  borderRadius: '4px',
                  fontSize: '0.85rem'
                }}>
                  <strong>Error:</strong> {toolData.error || eventData.error}
                  {eventData.stack_trace && (
                    <pre style={{ marginTop: '0.5rem', fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                      {eventData.stack_trace}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'AGENT_STEP':
      case 'agent.step': {
        const stepData = eventData as AgentStepData;
        return (
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ 
              padding: '0.75rem',
              backgroundColor: '#f9fafb',
              borderRadius: '4px',
              borderLeft: '4px solid #8b5cf6'
            }}>
              {stepData.step_name && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#374151' }}>Step:</strong>{' '}
                  <span style={{ fontSize: '0.9rem' }}>{stepData.step_name}</span>
                </div>
              )}
              {eventData.action && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#374151' }}>Action:</strong>{' '}
                  <span style={{ fontSize: '0.9rem' }}>{eventData.action}</span>
                </div>
              )}
              {eventData.log && (
                <div style={{ marginBottom: '0.75rem', padding: '0.5rem', backgroundColor: '#ffffff', borderRadius: '4px' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#374151' }}>Log:</strong>
                  <pre style={{ marginTop: '0.25rem', fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
                    {eventData.log}
                  </pre>
                </div>
              )}
              {stepData.inputs && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#374151' }}>Inputs:</strong>
                  <pre className="json-viewer" style={{ marginTop: '0.25rem', fontSize: '0.8rem', maxHeight: '200px', overflow: 'auto' }}>
                    {JSON.stringify(stepData.inputs, null, 2)}
                  </pre>
                </div>
              )}
              {eventData.tool_input && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#374151' }}>Tool Input:</strong>
                  <pre className="json-viewer" style={{ marginTop: '0.25rem', fontSize: '0.8rem', maxHeight: '200px', overflow: 'auto' }}>
                    {JSON.stringify(eventData.tool_input, null, 2)}
                  </pre>
                </div>
              )}
              {stepData.outputs && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#374151' }}>Outputs:</strong>
                  <pre className="json-viewer" style={{ marginTop: '0.25rem', fontSize: '0.8rem', maxHeight: '200px', overflow: 'auto' }}>
                    {JSON.stringify(stepData.outputs, null, 2)}
                  </pre>
                </div>
              )}
              {eventData.return_values && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#374151' }}>Return Values:</strong>
                  <pre className="json-viewer" style={{ marginTop: '0.25rem', fontSize: '0.8rem', maxHeight: '200px', overflow: 'auto' }}>
                    {JSON.stringify(eventData.return_values, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'llm.call.start':
      case 'llm.call.end':
      case 'llm.call.error': {
        const llmData = eventData as LLMCallData;
        const isStart = event.event_type === 'llm.call.start';
        const isEnd = event.event_type === 'llm.call.end';
        const isError = event.event_type === 'llm.call.error';
        
        return (
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ 
              padding: '0.75rem',
              backgroundColor: isStart ? '#fef3c7' : isError ? '#fef2f2' : isEnd ? '#f0fdf4' : '#f9fafb',
              borderRadius: '4px',
              borderLeft: `4px solid ${isStart ? '#f59e0b' : isError ? '#ef4444' : isEnd ? '#10b981' : '#6b7280'}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {llmData.model && (
                    <span className="badge badge-info" style={{ marginRight: '0.5rem' }}>
                      {llmData.model}
                    </span>
                  )}
                  {llmData.provider && (
                    <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                      Provider: <strong>{llmData.provider}</strong>
                    </span>
                  )}
                  {isStart && <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Started</span>}
                  {isError && <span style={{ fontSize: '0.85rem', color: '#991b1b' }}>Error</span>}
                  {isEnd && !isError && (
                    <span style={{ fontSize: '0.85rem', color: llmData.status === 'error' ? '#991b1b' : '#065f46' }}>
                      {llmData.status === 'error' ? 'Failed' : 'Completed'}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#6b7280' }}>
                  {llmData.duration_ms && (
                    <span>Duration: <strong>{llmData.duration_ms}ms</strong></span>
                  )}
                  {llmData.token_usage && (
                    <span>
                      Tokens: <strong>
                        {llmData.token_usage.total_tokens || 
                         ((llmData.token_usage.prompt_tokens || 0) + (llmData.token_usage.completion_tokens || 0))}
                      </strong>
                    </span>
                  )}
                </div>
              </div>
              
              {llmData.token_usage && (llmData.token_usage.prompt_tokens || llmData.token_usage.completion_tokens) && (
                <div style={{ 
                  marginBottom: '0.75rem',
                  padding: '0.5rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '4px',
                  fontSize: '0.85rem'
                }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    {llmData.token_usage.prompt_tokens !== undefined && (
                      <span>Prompt: <strong>{llmData.token_usage.prompt_tokens}</strong></span>
                    )}
                    {llmData.token_usage.completion_tokens !== undefined && (
                      <span>Completion: <strong>{llmData.token_usage.completion_tokens}</strong></span>
                    )}
                    {llmData.token_usage.total_tokens !== undefined && (
                      <span>Total: <strong>{llmData.token_usage.total_tokens}</strong></span>
                    )}
                  </div>
                </div>
              )}
              
              {llmData.prompts && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#374151' }}>Prompts:</strong>
                  <pre className="json-viewer" style={{ marginTop: '0.25rem', fontSize: '0.8rem', maxHeight: '200px', overflow: 'auto' }}>
                    {JSON.stringify(llmData.prompts, null, 2)}
                  </pre>
                </div>
              )}
              
              {llmData.outputs && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#374151' }}>Outputs:</strong>
                  <pre className="json-viewer" style={{ marginTop: '0.25rem', fontSize: '0.8rem', maxHeight: '200px', overflow: 'auto' }}>
                    {JSON.stringify(llmData.outputs, null, 2)}
                  </pre>
                </div>
              )}
              
              {(llmData.error || isError) && (
                <div style={{ 
                  marginTop: '0.5rem',
                  padding: '0.5rem',
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  borderRadius: '4px',
                  fontSize: '0.85rem'
                }}>
                  <strong>Error:</strong> {llmData.error || eventData.error}
                  {llmData.error_type && (
                    <div style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>
                      Type: {llmData.error_type}
                    </div>
                  )}
                  {llmData.stack_trace && (
                    <pre style={{ marginTop: '0.5rem', fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                      {llmData.stack_trace}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'agent.run.start':
      case 'agent.run.end':
      case 'agent.run.error': {
        const agentData = eventData as AgentRunData;
        const isStart = event.event_type === 'agent.run.start';
        const isEnd = event.event_type === 'agent.run.end';
        const isError = event.event_type === 'agent.run.error';
        
        return (
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ 
              padding: '0.75rem',
              backgroundColor: isStart ? '#dbeafe' : isError ? '#fef2f2' : isEnd ? '#f0fdf4' : '#f9fafb',
              borderRadius: '4px',
              borderLeft: `4px solid ${isStart ? '#2563eb' : isError ? '#ef4444' : isEnd ? '#10b981' : '#6b7280'}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {agentData.agent_name && (
                    <span className="badge badge-success" style={{ marginRight: '0.5rem' }}>
                      {agentData.agent_name}
                    </span>
                  )}
                  {agentData.chain_type && (
                    <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                      Chain: <strong>{agentData.chain_type}</strong>
                    </span>
                  )}
                  {agentData.framework && (
                    <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                      Framework: <strong>{agentData.framework}</strong>
                    </span>
                  )}
                  {isStart && <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Started</span>}
                  {isError && <span style={{ fontSize: '0.85rem', color: '#991b1b' }}>Error</span>}
                  {isEnd && !isError && (
                    <span style={{ fontSize: '0.85rem', color: agentData.status === 'error' ? '#991b1b' : '#065f46' }}>
                      {agentData.status === 'error' ? 'Failed' : 'Completed'}
                    </span>
                  )}
                </div>
                {agentData.duration_ms && (
                  <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                    Duration: <strong>{agentData.duration_ms}ms</strong>
                  </span>
                )}
              </div>
              
              {agentData.inputs && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#374151' }}>Inputs:</strong>
                  <pre className="json-viewer" style={{ marginTop: '0.25rem', fontSize: '0.8rem', maxHeight: '200px', overflow: 'auto' }}>
                    {JSON.stringify(agentData.inputs, null, 2)}
                  </pre>
                </div>
              )}
              
              {agentData.outputs && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#374151' }}>Outputs:</strong>
                  <pre className="json-viewer" style={{ marginTop: '0.25rem', fontSize: '0.8rem', maxHeight: '200px', overflow: 'auto' }}>
                    {JSON.stringify(agentData.outputs, null, 2)}
                  </pre>
                </div>
              )}
              
              {agentData.tags && agentData.tags.length > 0 && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#374151' }}>Tags:</strong>
                  <div style={{ marginTop: '0.25rem', display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                    {agentData.tags.map((tag, idx) => (
                      <span key={idx} className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {(agentData.error || isError) && (
                <div style={{ 
                  marginTop: '0.5rem',
                  padding: '0.5rem',
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  borderRadius: '4px',
                  fontSize: '0.85rem'
                }}>
                  <strong>Error:</strong> {agentData.error || eventData.error}
                  {agentData.error_type && (
                    <div style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>
                      Type: {agentData.error_type}
                    </div>
                  )}
                  {agentData.stack_trace && (
                    <pre style={{ marginTop: '0.5rem', fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                      {agentData.stack_trace}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'NETWORK_CALL': {
        const netData = eventData as NetworkCallData;
        return <NetworkCallDetails netData={netData} />;
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
