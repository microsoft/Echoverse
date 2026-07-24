import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { CountPill, EmptyState, Icon, Loader, PageTitle, SectionCard } from '../echoforge-ui';
import type { Todo } from '../types';
import { classNames, relativeTime } from '../utils';

export function TodoList({ addToast }: { addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [state, setState] = useState<'pending' | 'done'>('pending');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await api.listTodos({ state, limit: 100 });
      setTodos(response.todos);
    } catch (err) {
      setTodos([]);
      setLoadError(err instanceof Error ? err.message : 'Failed to load todos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [state]);

  const markDone = async (todoId: number) => {
    try {
      await api.markTodoDone(todoId);
      await load();
      addToast('Todo marked as done', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to update todo', 'error');
    }
  };

  const markAllDone = async () => {
    try {
      await api.markAllTodosDone();
      await load();
      addToast('Marked all todos as done', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to update todos', 'error');
    }
  };

  if (loading) return <Loader label="Loading todos…" />;
  if (loadError) return <EmptyState title="To-dos unavailable" description={loadError} action={<button className="gl-button btn btn-default" type="button" onClick={() => void load()}>Retry</button>} />;

  return (
    <div>
      <PageTitle title="To-Do List" controls={state === 'pending' ? <button className="gl-button btn btn-default" type="button" onClick={() => void markAllDone()}>Mark all as done</button> : undefined} description="Items that need your attention" />
      <SectionCard className="issuable-filter-bar page-section">
        <div className="top-area">
          <ul className="nav gl-tabs-nav">
            <li className="nav-item"><button type="button" className={classNames('nav-link gl-tab-nav-item', state === 'pending' && 'gl-tab-nav-item-active')} onClick={() => setState('pending')}>To do <CountPill value={state === 'pending' ? todos.length : 0} /></button></li>
            <li className="nav-item"><button type="button" className={classNames('nav-link gl-tab-nav-item', state === 'done' && 'gl-tab-nav-item-active')} onClick={() => setState('done')}>Done</button></li>
          </ul>
        </div>
      </SectionCard>
      <SectionCard className="list-card">
        {todos.length ? (
          <div>
            {todos.map((todo) => (
              <div key={todo.id} className="todo-item gl2-todo-row">
                <div className="gl2-todo-icon"><Icon name="todo" /></div>
                <div>
                  <div className="todo-title">{todo.action} · {todo.target_type} · {todo.project?.full_path ?? todo.project_name}</div>
                  <div className="todo-body">{todo.body ?? `${todo.action} ${todo.target_type.toLowerCase()} #${todo.target_id}`}</div>
                  <div className="gl2-compact-meta">Created {relativeTime(todo.created_at)}</div>
                </div>
                <div className="todo-actions">
                  {todo.project ? <Link to={`/${todo.project.full_path}`} className="gl-button btn btn-default">Open project</Link> : null}
                  {state === 'pending' ? <button className="gl-button btn btn-success" type="button" onClick={() => void markDone(todo.id)}>Done</button> : null}
                </div>
              </div>
            ))}
          </div>
        ) : <EmptyState title="Nothing is on your to-do list" description="When issues or merge requests are assigned to you, they appear here just like in EchoForge." />}
      </SectionCard>
    </div>
  );
}
