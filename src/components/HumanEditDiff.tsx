import React from 'react';
import type { HumanEditData } from '../types';

interface HumanEditDiffProps {
  data: HumanEditData;
}

function HumanEditDiff({ data }: HumanEditDiffProps) {
  return (
    <div style={{ marginTop: '1rem' }}>
      {data.editor_id && (
        <div style={{ marginBottom: '0.75rem', fontSize: '0.9rem' }}>
          <strong>Editor:</strong> {data.editor_id}
          {data.edited_at && (
            <span style={{ color: '#6b7280', marginLeft: '0.5rem' }}>
              at {new Date(data.edited_at).toLocaleString()}
            </span>
          )}
        </div>
      )}

      <div className="diff-container">
        <div className="diff-side" style={{ backgroundColor: '#fef2f2' }}>
          <h4 style={{ color: '#991b1b' }}>Original (AI)</h4>
          <div className="diff-content">
            {data.original}
          </div>
        </div>
        <div className="diff-side" style={{ backgroundColor: '#f0fdf4' }}>
          <h4 style={{ color: '#166534' }}>Edited (Human)</h4>
          <div className="diff-content">
            {data.edited}
          </div>
        </div>
      </div>

      {data.context && (
        <div style={{ marginTop: '0.75rem' }}>
          <strong>Context:</strong>
          <pre className="json-viewer" style={{ marginTop: '0.25rem' }}>
            {JSON.stringify(data.context, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default HumanEditDiff;
