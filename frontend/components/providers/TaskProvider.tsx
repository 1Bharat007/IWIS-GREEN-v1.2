"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type TaskStatus = "running" | "success" | "error";
export type TaskType = "scan" | "chat" | "other";

export interface BackgroundTask {
  id: string;
  type: TaskType;
  status: TaskStatus;
  title: string;
  progressMessage?: string;
  progressPercent?: number;
  payload?: any;
  error?: string;
  createdAt: number;
}

interface TaskContextType {
  tasks: BackgroundTask[];
  startTask: (id: string, type: TaskType, title: string) => void;
  updateTaskProgress: (id: string, message: string, percent?: number) => void;
  completeTask: (id: string, payload: any) => void;
  failTask: (id: string, error: string) => void;
  dismissTask: (id: string) => void;
  getTask: (id: string) => BackgroundTask | undefined;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<BackgroundTask[]>([]);

  const startTask = useCallback((id: string, type: TaskType, title: string) => {
    setTasks((prev) => {
      // Remove any existing task with the same ID
      const filtered = prev.filter((t) => t.id !== id);
      return [
        ...filtered,
        {
          id,
          type,
          title,
          status: "running",
          createdAt: Date.now(),
        },
      ];
    });
  }, []);

  const updateTaskProgress = useCallback((id: string, message: string, percent?: number) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, progressMessage: message, progressPercent: percent ?? t.progressPercent } : t
      )
    );
  }, []);

  const completeTask = useCallback((id: string, payload: any) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: "success", payload, progressPercent: 100 } : t
      )
    );
  }, []);

  const failTask = useCallback((id: string, error: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: "error", error } : t
      )
    );
  }, []);

  const dismissTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getTask = useCallback((id: string) => {
    return tasks.find((t) => t.id === id);
  }, [tasks]);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        startTask,
        updateTaskProgress,
        completeTask,
        failTask,
        dismissTask,
        getTask,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error("useTasks must be used within a TaskProvider");
  }
  return context;
}
