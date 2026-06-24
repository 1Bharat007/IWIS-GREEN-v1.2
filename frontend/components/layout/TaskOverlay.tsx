"use client";

import { useTasks, BackgroundTask } from "@/components/providers/TaskProvider";
import { CheckIcon, AlertIcon, ScanIcon, BotIcon } from "@/components/ui/Icons";
import { usePathname, useRouter } from "next/navigation";

export function TaskOverlay() {
  const { tasks, dismissTask } = useTasks();
  const pathname = usePathname();
  const router = useRouter();

  // Don't show overlay on the auth pages or if there are no tasks
  if (pathname === "/login" || pathname === "/signup" || tasks.length === 0) {
    return null;
  }

  const handleTaskClick = (task: BackgroundTask) => {
    if (task.status === "running") return;
    
    if (task.type === "scan") {
      router.push("/scan");
    } else if (task.type === "chat") {
      router.push("/chat");
    }
    
    // Auto dismiss if it's completed or errored after clicking
    if (task.status !== "running") {
      dismissTask(task.id);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-80 pointer-events-none">
      {tasks.map((task) => {
        // If the user is actually on the page related to the task, we don't need to show the overlay
        // since the page itself will be showing the loading state.
        if (task.type === "scan" && pathname === "/scan") return null;
        if (task.type === "chat" && pathname === "/chat") return null;

        const isClickable = task.status !== "running";

        return (
          <div
            key={task.id}
            onClick={() => isClickable && handleTaskClick(task)}
            className={`pointer-events-auto overflow-hidden rounded-xl border bg-[var(--surface)] shadow-lg animate-fadeIn ${
              isClickable ? "cursor-pointer hover:border-[var(--accent)] transition-colors" : "border-[var(--border)]"
            } ${task.status === "error" ? "border-[var(--destructive-border)]" : ""}`}
          >
            <div className="p-3 flex items-start gap-3">
              {/* Icon */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                task.status === "running" ? "bg-[var(--surface-raised)] text-[var(--accent)]" :
                task.status === "success" ? "bg-[var(--accent-subtle)] text-[var(--accent-text)]" :
                "bg-[var(--destructive-bg)] text-[var(--destructive)]"
              }`}>
                {task.status === "running" ? (
                  task.type === "scan" ? <ScanIcon size={14} className="animate-pulse" /> : <BotIcon size={14} className="animate-pulse" />
                ) : task.status === "success" ? (
                  <CheckIcon size={14} />
                ) : (
                  <AlertIcon size={14} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex justify-between items-start mb-0.5">
                  <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                    {task.title}
                  </p>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissTask(task.id);
                    }}
                    className="text-2xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors ml-2"
                  >
                    Close
                  </button>
                </div>
                
                <p className="text-xs text-[var(--text-secondary)] truncate">
                  {task.status === "running" 
                    ? task.progressMessage || "Processing..."
                    : task.status === "success"
                    ? "Complete! Click to view."
                    : "Failed. Click to view error."
                  }
                </p>

                {/* Progress Bar */}
                {task.status === "running" && (
                  <div className="mt-2 h-1 w-full bg-[var(--surface-raised)] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[var(--accent)] rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${task.progressPercent || 0}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
