import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import type { Event } from '../types';

interface TraceViewProps {
  events: Event[];
  runId: string;
}

interface TraceNode {
  event: Event;
  children: TraceNode[];
  networkCalls: Event[];
  level: number;
  isLast: boolean;
}

function getEventTypeBadge(eventType: string, eventData: any): { label: string; color: string; bgColor: string } {
  if (eventType.includes('AGENT_START') || eventType.includes('agent.run.start')) {
    return { label: 'AGENT', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)' };
  }
  if (eventType.includes('TOOL_CALL') || eventType.includes('tool.call')) {
    return { label: 'TOOL', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)' };
  }
  if (eventType.includes('NETWORK_CALL')) {
    return { label: 'HTTP', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.15)' };
  }
  if (eventType.includes('llm.call')) {
    return { label: 'LLM', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)' };
  }
  if (eventType.includes('AGENT_STEP') || eventType.includes('agent.step')) {
    return { label: 'CHAIN', color: '#06b6d4', bgColor: 'rgba(6, 182, 212, 0.15)' };
  }
  if (eventType === 'HUMAN_EDIT') {
    return { label: 'EDIT', color: '#ec4899', bgColor: 'rgba(236, 72, 153, 0.15)' };
  }
  return { label: 'EVENT', color: '#9ca3af', bgColor: 'rgba(156, 163, 175, 0.15)' };
}

function formatDuration(ms: number | null | undefined): string {
  if (!ms) return '0.00s';
  if (ms < 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatTokens(tokens: number | null | undefined): string {
  if (!tokens) return '';
  return tokens.toLocaleString();
}

function buildHierarchicalTree(events: Event[]): TraceNode[] {
  const nodes: TraceNode[] = [];
  const eventMap = new Map<string, TraceNode>();
  const toolCallMap = new Map<string, TraceNode>();
  const networkCallsByToolCall = new Map<string, Event[]>();
  const childrenByParent = new Map<string, Event[]>();

  // Sort events by sequence_num or timestamp
  const sortedEvents = [...events].sort((a, b) => {
    if (a.sequence_num !== null && b.sequence_num !== null) {
      return a.sequence_num - b.sequence_num;
    }
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });

  // First pass: collect network calls by tool_call_id
  sortedEvents.forEach(event => {
    if (event.event_type === 'NETWORK_CALL') {
      const toolCallId = event.event_data?.tool_call_id;
      if (toolCallId) {
        if (!networkCallsByToolCall.has(toolCallId)) {
          networkCallsByToolCall.set(toolCallId, []);
        }
        networkCallsByToolCall.get(toolCallId)!.push(event);
      }
    }
  });

  // Second pass: build parent-child relationships using span_id/parent_span_id
  sortedEvents.forEach(event => {
    const node: TraceNode = {
      event,
      children: [],
      networkCalls: [],
      level: 0,
      isLast: false,
    };

    eventMap.set(event.event_id, node);

    // Link by parent_span_id if available
    if (event.parent_span_id) {
      if (!childrenByParent.has(event.parent_span_id)) {
        childrenByParent.set(event.parent_span_id, []);
      }
      childrenByParent.get(event.parent_span_id)!.push(event);
    }
  });

  // Third pass: build tree structure
  const rootNodes: TraceNode[] = [];
  const processed = new Set<string>();

  function buildNodeTree(node: TraceNode, level: number, isLast: boolean): void {
    // Prevent infinite recursion - if already processed, skip
    if (processed.has(node.event.event_id)) {
      return;
    }

    node.level = level;
    node.isLast = isLast;
    processed.add(node.event.event_id);

    // Add network calls if this is a tool call
    if (node.event.event_data?.tool_call_id) {
      const toolCallId = node.event.event_data.tool_call_id;
      const networkCalls = networkCallsByToolCall.get(toolCallId) || [];
      node.networkCalls = networkCalls;
    }

    // Store tool call start nodes for later linking
    if (node.event.event_type === 'TOOL_CALL_START' || node.event.event_type === 'tool.call.start') {
      const toolCallId = node.event.event_data?.tool_call_id;
      if (toolCallId) {
        toolCallMap.set(toolCallId, node);
      }
    }

    // Find children by parent_span_id
    const spanId = node.event.span_id;
    if (spanId && childrenByParent.has(spanId)) {
      const childEvents = childrenByParent.get(spanId)!;
      childEvents.forEach((childEvent, index) => {
        if (!processed.has(childEvent.event_id)) {
          const childNode = eventMap.get(childEvent.event_id);
          if (childNode) {
            const isLastChild = index === childEvents.length - 1;
            buildNodeTree(childNode, level + 1, isLastChild);
            node.children.push(childNode);
          }
        }
      });
    }
  }

  // Fourth pass: Link tool call end to start (after tree is built to avoid cycles)
  sortedEvents.forEach(event => {
    if ((event.event_type === 'TOOL_CALL_END' || event.event_type === 'tool.call.end') && !processed.has(event.event_id)) {
      const toolCallId = event.event_data?.tool_call_id;
      if (toolCallId && toolCallMap.has(toolCallId)) {
        const startNode = toolCallMap.get(toolCallId)!;
        const endNode = eventMap.get(event.event_id);
        if (endNode && !startNode.children.some(c => c.event.event_id === event.event_id)) {
          // Add end node as child of start node without recursion
          endNode.level = startNode.level + 1;
          endNode.isLast = true;
          startNode.children.push(endNode);
          processed.add(event.event_id);
        }
      }
    }
  });

  // Build tree starting from root nodes (no parent_span_id or parent_span_id not found)
  sortedEvents.forEach(event => {
    if (!processed.has(event.event_id)) {
      // Skip network calls as they're nested
      if (event.event_type === 'NETWORK_CALL') {
        return;
      }

      const node = eventMap.get(event.event_id);
      if (node && (!event.parent_span_id || !eventMap.has(event.parent_span_id))) {
        const isLast = rootNodes.length === 0 || sortedEvents.indexOf(event) === sortedEvents.length - 1;
        buildNodeTree(node, 0, isLast);
        rootNodes.push(node);
      }
    }
  });

  return rootNodes;
}

interface TraceItemProps {
  node: TraceNode;
  isSelected: boolean;
  onSelect: (event: Event) => void;
  parents: boolean[]; // Track which parent levels have siblings after
}

function TraceItem({ node, isSelected, onSelect, parents }: TraceItemProps) {
  const [expanded, setExpanded] = useState(true);
  const event = node.event;
  const eventType = event.event_type;
  const eventData = event.event_data;
  const badge = getEventTypeBadge(eventType, eventData);
  
  const duration = eventData?.duration_ms || null;
  const tokens = eventData?.token_usage?.total_tokens || 
    (eventData?.token_usage?.prompt_tokens && eventData?.token_usage?.completion_tokens
      ? eventData.token_usage.prompt_tokens + eventData.token_usage.completion_tokens
      : null);
  
  const inputTokens = eventData?.token_usage?.prompt_tokens;
  const outputTokens = eventData?.token_usage?.completion_tokens;

  const hasChildren = node.children.length > 0 || node.networkCalls.length > 0;

  const eventName = eventData?.tool_name || 
    eventData?.step_name || 
    eventData?.model ||
    eventData?.agent_name ||
    eventData?.chain_type ||
    eventType;

  const indent = node.level * 24;

  return (
    <div style={{ position: 'relative' }}>
      <div
        className="trace-item-hierarchical"
        style={{
          backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
          borderLeft: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
        }}
        onClick={() => onSelect(event)}
      >
        {/* Vertical connector lines from parent levels */}
        <div className="trace-connector" style={{ left: '0', width: `${indent + 24}px`, height: '100%' }}>
          {parents.slice(0, node.level).map((hasSibling, idx) => {
            if (!hasSibling) return null;
            return (
              <div
                key={idx}
                className="trace-connector-line"
                style={{
                  left: `${idx * 24 + 12}px`,
                  width: '1px',
                  height: '100%',
                  backgroundColor: '#3a3a3a',
                  position: 'absolute',
                  top: '0',
                }}
              />
            );
          })}
          {/* Horizontal line to the dot */}
          {node.level > 0 && (
            <div
              className="trace-connector-horizontal"
              style={{
                left: `${(node.level - 1) * 24 + 12}px`,
                width: '12px',
                height: '1px',
                backgroundColor: '#3a3a3a',
                position: 'absolute',
                top: '50%',
              }}
            />
          )}
          {/* Dot */}
          <div
            className="trace-connector-dot"
            style={{
              left: `${node.level * 24 + 12}px`,
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: badge.color,
              border: '2px solid #111111',
              position: 'absolute',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1,
            }}
          />
        </div>

        <div className="trace-item-content-hierarchical" style={{ marginLeft: `${indent + 24}px` }}>
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="trace-expand-button"
            >
              {expanded ? '▼' : '▶'}
            </button>
          )}
          {!hasChildren && <div style={{ width: '20px' }} />}

          {/* Type Badge */}
          <div
            className="trace-type-badge"
            style={{
              backgroundColor: badge.bgColor,
              color: badge.color,
              border: `1px solid ${badge.color}40`,
            }}
          >
            {badge.label}
          </div>

          {/* Event Name */}
          <div className="trace-item-name">{eventName}</div>

          {/* Duration */}
          {duration && (
            <div className="trace-metric">
              <span className="trace-metric-icon">⏱</span>
              <span>{formatDuration(duration)}</span>
            </div>
          )}

          {/* Token Usage */}
          {tokens && (
            <div className="trace-metric trace-tokens">
              <span className="trace-metric-icon">ABC</span>
              {inputTokens !== undefined && outputTokens !== undefined ? (
                <span>{formatTokens(inputTokens)} → {formatTokens(outputTokens)}</span>
              ) : (
                <span>{formatTokens(tokens)}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {expanded && hasChildren && (
        <div>
          {/* Render network calls first */}
          {node.networkCalls.map((networkEvent, idx) => {
            const isLastNetwork = idx === node.networkCalls.length - 1 && node.children.length === 0;
            const networkBadge = getEventTypeBadge('NETWORK_CALL', networkEvent.event_data);
            const networkParents = [...parents, !isLastNetwork];
            
            const networkIndent = (node.level + 1) * 24;
            return (
              <div key={networkEvent.event_id} style={{ position: 'relative' }}>
                <div
                  className="trace-item-hierarchical trace-item-nested"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(networkEvent);
                  }}
                >
                  <div className="trace-connector" style={{ left: '0', width: `${networkIndent + 24}px`, height: '100%' }}>
                    {networkParents.slice(0, node.level + 1).map((hasSibling, idx) => {
                      if (!hasSibling || idx >= node.level) return null;
                      return (
                        <div
                          key={idx}
                          className="trace-connector-line"
                          style={{
                            left: `${idx * 24 + 12}px`,
                            width: '1px',
                            height: '100%',
                            backgroundColor: '#3a3a3a',
                            position: 'absolute',
                            top: '0',
                          }}
                        />
                      );
                    })}
                    {node.level >= 0 && (
                      <div
                        className="trace-connector-horizontal"
                        style={{
                          left: `${node.level * 24 + 12}px`,
                          width: '12px',
                          height: '1px',
                          backgroundColor: '#3a3a3a',
                          position: 'absolute',
                          top: '50%',
                        }}
                      />
                    )}
                    <div
                      className="trace-connector-dot"
                      style={{
                        left: `${(node.level + 1) * 24 + 12}px`,
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: networkBadge.color,
                        border: '2px solid #111111',
                        position: 'absolute',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 1,
                      }}
                    />
                  </div>

                  <div className="trace-item-content-hierarchical" style={{ marginLeft: `${networkIndent + 24}px` }}>
                    <div style={{ width: '20px' }} />
                    <div
                      className="trace-type-badge"
                      style={{
                        backgroundColor: networkBadge.bgColor,
                        color: networkBadge.color,
                        border: `1px solid ${networkBadge.color}40`,
                      }}
                    >
                      {networkBadge.label}
                    </div>
                    <div className="trace-item-name">
                      {networkEvent.event_data?.method} {networkEvent.event_data?.url}
                    </div>
                    {networkEvent.event_data?.duration_ms && (
                      <div className="trace-metric">
                        <span className="trace-metric-icon">⏱</span>
                        <span>{formatDuration(networkEvent.event_data.duration_ms)}</span>
                      </div>
                    )}
                    {networkEvent.event_data?.status_code && (
                      <div className="trace-metric" style={{
                        color: networkEvent.event_data.status_code >= 200 && networkEvent.event_data.status_code < 300 
                          ? '#10b981' 
                          : networkEvent.event_data.status_code >= 400 
                          ? '#ef4444' 
                          : '#f59e0b'
                      }}>
                        {networkEvent.event_data.status_code}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Render child nodes */}
          {node.children.map((child, idx) => {
            const isLastChild = idx === node.children.length - 1;
            const childParents = [...parents, !isLastChild];
            return (
              <TraceItem
                key={child.event.event_id}
                node={child}
                isSelected={false}
                onSelect={onSelect}
                parents={childParents}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function DetailPanel({ event }: { event: Event | null }) {
  if (!event) {
    return (
      <div className="detail-panel">
        <div className="detail-content" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#9ca3af'
        }}>
          Select an event to view details
        </div>
      </div>
    );
  }

  const eventData = event.event_data;
  const eventType = event.event_type;
  const badge = getEventTypeBadge(eventType, eventData);

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <div className="detail-header-left">
          <div
            className="detail-header-icon"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: badge.bgColor,
              color: badge.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              fontWeight: '600',
            }}
          >
            {badge.label}
          </div>
          <div>
            <div className="detail-header-title">
              {eventData?.tool_name || 
               eventData?.step_name || 
               eventData?.model ||
               eventData?.agent_name ||
               eventType}
            </div>
            <div className="detail-header-id">ID: {event.event_id.substring(0, 8)}...</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="button button-secondary" style={{ fontSize: '0.75rem', padding: '0.5rem' }}>
            Playground
          </button>
          <button className="button button-secondary" style={{ fontSize: '0.75rem', padding: '0.5rem' }}>
            Compare
          </button>
        </div>
      </div>

      <div className="detail-tabs">
        <button className="detail-tab active">Run</button>
        <button className="detail-tab">Feedback</button>
        <button className="detail-tab">Metadata</button>
      </div>

      <div className="detail-content">
        {/* State Section */}
        {(eventData?.inputs || eventData?.prompts) && (
          <div className="detail-section">
            <div className="detail-section-header">
              <div className="detail-section-title">State</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {eventData.inputs && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.5rem', fontWeight: '500' }}>Human</div>
                  <div className="detail-section-content">
                    {typeof eventData.inputs === 'string' 
                      ? eventData.inputs 
                      : JSON.stringify(eventData.inputs, null, 2)}
                  </div>
                </div>
              )}
              {eventData.prompts && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.5rem', fontWeight: '500' }}>AI</div>
                  <div className="detail-section-content">
                    {typeof eventData.prompts === 'string' 
                      ? eventData.prompts 
                      : JSON.stringify(eventData.prompts, null, 2)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tool Call Section */}
        {(eventType.includes('TOOL_CALL') || eventType.includes('tool.call')) && (
          <div className="detail-section">
            <div className="detail-section-header">
              <div className="detail-section-title">Tool Call</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {eventData.tool_call_id && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem', fontWeight: '500' }}>Id</div>
                  <div className="detail-section-content" style={{ fontSize: '0.8rem' }}>
                    {eventData.tool_call_id}
                  </div>
                </div>
              )}
              {eventData.tool_name && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem', fontWeight: '500' }}>Name</div>
                  <div className="detail-section-content" style={{ fontSize: '0.8rem' }}>
                    {eventData.tool_name}
                  </div>
                </div>
              )}
              <div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem', fontWeight: '500' }}>Type</div>
                <div className="detail-section-content" style={{ fontSize: '0.8rem' }}>
                  tool_call
                </div>
              </div>
              {eventData.inputs && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem', fontWeight: '500' }}>Args</div>
                  <div className="detail-section-content">
                    {JSON.stringify(eventData.inputs, null, 2)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Network Call Section */}
        {eventType === 'NETWORK_CALL' && (
          <div className="detail-section">
            <div className="detail-section-header">
              <div className="detail-section-title">Network Call</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem', fontWeight: '500' }}>Method</div>
                <div className="detail-section-content" style={{ fontSize: '0.8rem' }}>
                  {eventData.method}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem', fontWeight: '500' }}>URL</div>
                <div className="detail-section-content" style={{ fontSize: '0.8rem' }}>
                  {eventData.url}
                </div>
              </div>
              {eventData.status_code && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem', fontWeight: '500' }}>Status Code</div>
                  <div className="detail-section-content" style={{ fontSize: '0.8rem' }}>
                    {eventData.status_code}
                  </div>
                </div>
              )}
              {eventData.duration_ms && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem', fontWeight: '500' }}>Duration</div>
                  <div className="detail-section-content" style={{ fontSize: '0.8rem' }}>
                    {formatDuration(eventData.duration_ms)}
                  </div>
                </div>
              )}
              {eventData.request_payload && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem', fontWeight: '500' }}>Request Payload</div>
                  <div className="detail-section-content">
                    {typeof eventData.request_payload === 'string'
                      ? eventData.request_payload
                      : JSON.stringify(eventData.request_payload, null, 2)}
                  </div>
                </div>
              )}
              {eventData.response_payload && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem', fontWeight: '500' }}>Response Payload</div>
                  <div className="detail-section-content">
                    {typeof eventData.response_payload === 'string'
                      ? eventData.response_payload
                      : JSON.stringify(eventData.response_payload, null, 2)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Output Section */}
        {(eventData?.outputs || eventData?.response_payload) && (
          <div className="detail-section">
            <div className="detail-section-header">
              <div className="detail-section-title">Output</div>
            </div>
            <div className="detail-section-content">
              {typeof (eventData.outputs || eventData.response_payload) === 'string'
                ? (eventData.outputs || eventData.response_payload)
                : JSON.stringify(eventData.outputs || eventData.response_payload, null, 2)}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="detail-section">
          <div className="detail-section-header">
            <div className="detail-section-title">Metadata</div>
          </div>
          <div className="detail-section-content">
            {JSON.stringify({
              event_id: event.event_id,
              timestamp: format(new Date(event.timestamp), 'yyyy-MM-dd HH:mm:ss.SSS'),
              sequence_num: event.sequence_num,
              duration_ms: eventData?.duration_ms,
              status: eventData?.status,
            }, null, 2)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TraceView({ events, runId }: TraceViewProps) {
  const traceTree = useMemo(() => buildHierarchicalTree(events), [events]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  // Auto-select first event when trace tree is built
  useEffect(() => {
    if (traceTree.length > 0 && !selectedEvent) {
      setSelectedEvent(traceTree[0].event);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [traceTree.length]);

  return (
    <div className="trace-container">
      <div className="trace-sidebar">
        <div className="trace-header">
          <h2>Child Runs</h2>
          <div className="trace-controls">
            <button title="Previous">↑</button>
            <button title="Next">↓</button>
            <button title="Refresh">↻</button>
          </div>
        </div>
        <div className="trace-list">
          {traceTree.map((node, idx) => {
            const isLast = idx === traceTree.length - 1;
            return (
              <TraceItem
                key={node.event.event_id}
                node={node}
                isSelected={selectedEvent?.event_id === node.event.event_id}
                onSelect={setSelectedEvent}
                parents={[!isLast]}
              />
            );
          })}
        </div>
      </div>
      <DetailPanel event={selectedEvent} />
    </div>
  );
}
