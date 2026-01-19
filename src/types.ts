// Type definitions for Grimlock2 Dashboard

export interface Event {
  id: number;
  event_id: string;
  tenant_id: string;
  user_token_hash: string;
  user_id: string | null;
  run_id: string;
  event_type: string;
  event_data: Record<string, any>;
  timestamp: string;
  sequence_num: number | null;
  created_at: string;
  span_id?: string | null;
  parent_span_id?: string | null;
  trace_id?: string | null;
}

export interface Run {
  run_id: string;
  user_token_hash: string;
  user_id: string | null;
  first_event_at: string;
  last_event_at: string;
  event_count: number;
  event_types: string[];
}

export interface UserStats {
  user_token_hash: string;
  user_id: string | null;
  total_events: number;
  total_runs: number;
  tool_calls: number;
  human_edits: number;
  custom_events: number;
}

export interface HumanEditData {
  original: string;
  edited: string;
  editor_id: string;
  edited_at?: string;
  context?: Record<string, any>;
}

export interface ToolCallData {
  tool_call_id?: string;
  tool_name: string;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  duration_ms?: number;
  status?: 'success' | 'error';
  error?: string;
}

export interface AgentStepData {
  step_name: string;
  inputs?: any;
  outputs?: any;
}

export interface NetworkCallData {
  method: string;
  url: string;
  status_code?: number;
  duration_ms?: number;
  request_headers?: Record<string, string>;
  response_headers?: Record<string, string>;
  request_payload?: any;
  response_payload?: any;
  error?: string;
  tool_call_id?: string; // Links network call to a tool call
}

export interface LLMCallData {
  framework?: string;
  model?: string;
  provider?: string;
  prompts?: any;
  outputs?: any;
  token_usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  duration_ms?: number;
  status?: 'ok' | 'error';
  error?: string;
  error_type?: string;
  stack_trace?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface AgentRunData {
  framework?: string;
  chain_type?: string;
  agent_name?: string;
  inputs?: any;
  outputs?: any;
  duration_ms?: number;
  status?: 'ok' | 'error';
  error?: string;
  error_type?: string;
  stack_trace?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}
