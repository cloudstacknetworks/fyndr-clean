'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import Link from 'next/link';

// Define status order based on workflow
const STATUS_ORDER = [
  'draft',
  'published',
  'completed'
];

// Pretty print status labels
const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  published: 'Published',
  completed: 'Completed'
};

// Status column colors
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-50',
  published: 'bg-blue-50',
  completed: 'bg-green-50'
};

// Priority colors
const PRIORITY_COLORS = {
  LOW: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-red-100 text-red-700'
};

interface RFP {
  id: string;
  title: string;
  status: string;
  priority: string | null;
  dueDate: Date | null;
  company: { name: string } | null;
}

interface KanbanBoardProps {
  initialRfps: RFP[];
}

export default function KanbanBoard({ initialRfps }: KanbanBoardProps) {
  const [rfps, setRfps] = useState(initialRfps);
  const [error, setError] = useState<string | null>(null);

  // Group RFPs by status
  const groupedRfps = rfps.reduce((acc, rfp) => {
    if (!acc[rfp.status]) {
      acc[rfp.status] = [];
    }
    acc[rfp.status].push(rfp);
    return acc;
  }, {} as Record<string, RFP[]>);

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Dropped outside a droppable area
    if (!destination) return;

    // Dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const newStatus = destination.droppableId;
    const rfpId = draggableId;

    // Find the RFP
    const rfp = rfps.find(r => r.id === rfpId);
    if (!rfp) return;

    const oldStatus = rfp.status;

    // Optimistic update
    setRfps(prev =>
      prev.map(r => (r.id === rfpId ? { ...r, status: newStatus } : r))
    );

    // Persist to backend
    try {
      const res = await fetch(`/api/rfps/${rfpId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }

      setError(null);
    } catch (err) {
      // Revert on error
      setRfps(prev =>
        prev.map(r => (r.id === rfpId ? { ...r, status: oldStatus } : r))
      );
      setError('Failed to update RFP status. Please try again.');
      
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  };

  return (
    <div>
      {/* Error Toast */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUS_ORDER.map(status => {
            const statusRfps = groupedRfps[status] || [];
            const label = STATUS_LABELS[status] || status;
            const bgColor = STATUS_COLORS[status] || 'bg-gray-50';

            return (
              <div
                key={status}
                className={`flex-shrink-0 w-80 ${bgColor} rounded-lg p-4`}
              >
                {/* Column Header */}
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900">
                    {label} ({statusRfps.length})
                  </h3>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-3 min-h-[200px] transition-colors ${
                        snapshot.isDraggingOver ? 'bg-indigo-50 rounded-lg p-2' : ''
                      }`}
                    >
                      {statusRfps.map((rfp, index) => (
                        <Draggable
                          key={rfp.id}
                          draggableId={rfp.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white rounded-lg shadow p-4 hover:shadow-md transition cursor-move ${
                                snapshot.isDragging ? 'shadow-lg ring-2 ring-indigo-500' : ''
                              }`}
                            >
                              {/* RFP Card */}
                              <Link
                                href={`/dashboard/rfps/${rfp.id}`}
                                className="block"
                              >
                                <h4 className="font-semibold text-gray-900 hover:text-indigo-600 mb-2">
                                  {rfp.title}
                                </h4>
                              </Link>

                              {/* Company */}
                              {rfp.company && (
                                <p className="text-sm text-gray-600 mb-2">
                                  {rfp.company.name}
                                </p>
                              )}

                              {/* Priority Badge */}
                              {rfp.priority && (
                                <span
                                  className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                                    PRIORITY_COLORS[rfp.priority as keyof typeof PRIORITY_COLORS] ||
                                    'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {rfp.priority}
                                </span>
                              )}

                              {/* Due Date */}
                              {rfp.dueDate && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Due: {new Date(rfp.dueDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
