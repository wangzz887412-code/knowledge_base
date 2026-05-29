import React, { createContext, useContext, useState, useCallback } from 'react';

export type PetTaskStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'failed';

interface TaskState {
  status: PetTaskStatus;
  message: string;
  progress: number;
}

interface TaskContextValue {
  task: TaskState;
  setTaskStatus: (status: PetTaskStatus, message?: string, progress?: number) => void;
  clearTask: () => void;
}

const TaskContext = createContext<TaskContextValue>({
  task: { status: 'idle', message: '', progress: 0 },
  setTaskStatus: () => {},
  clearTask: () => {},
});

export const usePetTask = () => useContext(TaskContext);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [task, setTask] = useState<TaskState>({ status: 'idle', message: '', progress: 0 });

  const setTaskStatus = useCallback(
    (status: PetTaskStatus, message: string = '', progress: number = 0) => {
      setTask({ status, message, progress });
    },
    []
  );

  const clearTask = useCallback(() => {
    setTask({ status: 'idle', message: '', progress: 0 });
  }, []);

  return (
    <TaskContext.Provider value={{ task, setTaskStatus, clearTask }}>
      {children}
    </TaskContext.Provider>
  );
};