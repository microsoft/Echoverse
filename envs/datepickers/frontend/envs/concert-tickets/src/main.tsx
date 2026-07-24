import React from 'react'
import ReactDOM from 'react-dom/client'
import TaskPage from './page'
import './index.css'

declare global {
  interface Window {
    __ACTIVE_TASK__?: { task_id: string; instruction_text: string; widget_id?: string; };
    __ENV_TASKS__?: Array<{ task_id: string; widget_id: string; instruction_text: string; }>;
  }
}

function App() {
  const taskId = window.__ACTIVE_TASK__?.task_id || 'unknown';
  const handleSubmit = async (value: { type: string; value: string; raw: any }) => {
    // Determine which task_id to submit for based on widget_id
    const widgetId = value.raw?.widget_id;
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
      })
      const data = await res.json()
      alert(data.task_completed ? 'Correct! Task completed.' : 'Incorrect selection. Try again.')
    } catch (e) { alert('Error: ' + e) }
  }
  return <TaskPage taskId={taskId} onSubmit={handleSubmit} />
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
