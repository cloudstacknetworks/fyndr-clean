'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, Loader2, RefreshCw } from 'lucide-react';
import { STAGE_LABELS } from '@/lib/stages';

interface StageTask {
  id: string;
  title: string;
  completed: boolean;
  completedAt: Date | null;
  stage: string;
  rfpId: string;
}

interface StageTasksProps {
  rfpId: string;
  stage: string;
  initialTasks: StageTask[];
}

export default function StageTasks({ rfpId, stage, initialTasks }: StageTasksProps) {
  const [tasks, setTasks] = useState<StageTask[]>(initialTasks);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);

  const stageLabel = STAGE_LABELS[stage] || stage;
  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;

  const handleGenerateTasks = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`/api/rfps/${rfpId}/tasks/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate tasks');
      }

      const data = await response.json();
      setTasks(data.tasks);
    } catch (err) {
      console.error('Error generating tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate tasks');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    setLoadingTaskId(taskId);
    setError(null);

    // Optimistic update
    const previousTasks = [...tasks];
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, completed: !currentCompleted, completedAt: !currentCompleted ? new Date() : null }
        : task
    ));

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: !currentCompleted }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update task');
      }

      const data = await response.json();
      // Update with server response to ensure consistency
      setTasks(tasks.map(task => 
        task.id === taskId ? data.task : task
      ));
    } catch (err) {
      console.error('Error updating task:', err);
      setError(err instanceof Error ? err.message : 'Failed to update task');
      // Revert optimistic update on error
      setTasks(previousTasks);
    } finally {
      setLoadingTaskId(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Stage Tasks</h2>
          <p className="text-sm text-gray-500 mt-1">
            Current Stage: <span className="font-medium">{stageLabel}</span>
          </p>
        </div>
        {tasks.length > 0 && (
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-indigo-600">{completedCount}</span> of{' '}
            <span className="font-semibold">{totalCount}</span> completed
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="text-center py-8">
          <Circle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No tasks generated yet for this stage.</p>
          <button
            onClick={handleGenerateTasks}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Tasks...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Generate Tasks for This Stage
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <label
              key={task.id}
              className={`flex items-start gap-3 p-3 rounded-lg transition cursor-pointer ${
                task.completed ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center h-5 mt-0.5">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleToggleTask(task.id, task.completed)}
                  disabled={loadingTaskId === task.id}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                />
              </div>
              <div className="flex-1 min-w-0">
                <span
                  className={`text-sm ${
                    task.completed
                      ? 'text-gray-500 line-through'
                      : 'text-gray-900'
                  }`}
                >
                  {task.title}
                </span>
                {task.completed && task.completedAt && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Completed
                  </span>
                )}
              </div>
              {loadingTaskId === task.id && (
                <Loader2 className="h-4 w-4 text-gray-400 animate-spin mt-0.5" />
              )}
            </label>
          ))}
        </div>
      )}

      {tasks.length > 0 && completedCount === totalCount && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-700 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            All tasks for this stage are completed! Great work!
          </p>
        </div>
      )}
    </div>
  );
}
