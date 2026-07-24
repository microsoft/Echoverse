import React from 'react'
import ReactDOM from 'react-dom/client'
import TaskPage from './page'
import './index.css'

declare global {
  interface Window {
    __ACTIVE_TASK__?: {
      task_id: string;
      env_name?: string;
      instruction_text: string;
      widget_id?: string;
      task_type?: string;
      datepicker_type?: string;
      category?: string;
      initial_visible_state?: any;
      constraint_type?: string;
      suite?: string;
    };
    __ENV_TASKS__?: Array<{ task_id: string; widget_id: string; instruction_text: string; }>;
  }
}

function App() {
  const task = window.__ACTIVE_TASK__;
  const taskId = task?.task_id || 'unknown';

  const handleSubmit = async (value: { type: string; value: string; raw: any }) => {
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          selected_value: value.value,
          raw_payload: JSON.stringify(value.raw),
          is_partial: !value.value,
        }),
      });
      const data = await res.json();
      alert(data.task_completed ? 'Correct! Task completed.' : 'Incorrect selection. Try again.');
    } catch (e) {
      alert('Error: ' + e);
    }
  };

  return <TaskPage taskId={taskId} onSubmit={handleSubmit} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
);
