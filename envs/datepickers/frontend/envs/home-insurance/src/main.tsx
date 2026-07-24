import React from 'react'
import ReactDOM from 'react-dom/client'
import TaskPage from './page'
import './index.css'

declare global {
  interface Window {
    __ACTIVE_TASK__?: {
      task_id: string;
      instruction_text: string;
      widget_id?: string;
      task_type?: string;
      compound_parts?: { widget_a: { widget_id: string; canonical: string }; widget_b: { widget_id: string; canonical: string } };
    };
    __ENV_TASKS__?: Array<{ task_id: string; widget_id: string; instruction_text: string; }>;
  }
}

// Track compound widget values
const compoundValues: Record<string, string> = {};

function App() {
  const task = window.__ACTIVE_TASK__;
  const taskId = task?.task_id || 'unknown';
  const isCompound = task?.task_type === 'compound';

  const handleSubmit = async (value: { type: string; value: string; raw: any }) => {
    const widgetId = value.raw?.widget_id;

    if (isCompound && widgetId && task?.compound_parts) {
      // Compound mode: accumulate values from both widgets
      compoundValues[widgetId] = value.value;
      const partA = task.compound_parts.widget_a.widget_id;
      const partB = task.compound_parts.widget_b.widget_id;
      if (compoundValues[partA] && compoundValues[partB]) {
        // Both widgets filled — submit compound value
        const compoundValue = compoundValues[partA] + '|' + compoundValues[partB];
        try {
          const res = await fetch('/api/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task_id: taskId, selected_value: compoundValue, raw_payload: JSON.stringify({ ...value.raw, compound: true }), is_partial: false }),
          });
          const data = await res.json();
          alert(data.task_completed ? 'Correct! Both selections verified.' : 'Incorrect. Check both selections.');
        } catch (e) { alert('Error: ' + e); }
      } else {
        alert('Widget value recorded. Now fill the other widget and submit.');
      }
      return;
    }

    // Single-selection mode: submit immediately
    let submitTaskId = taskId;
    if (widgetId && window.__ENV_TASKS__) {
      const match = window.__ENV_TASKS__.find(t => t.widget_id === widgetId);
      if (match) submitTaskId = match.task_id;
    }
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: submitTaskId, selected_value: value.value, raw_payload: JSON.stringify(value.raw), is_partial: !value.value }),
      });
      const data = await res.json();
      alert(data.task_completed ? 'Correct! Task completed.' : 'Incorrect selection. Try again.');
    } catch (e) { alert('Error: ' + e); }
  };
  return <TaskPage taskId={taskId} onSubmit={handleSubmit} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
