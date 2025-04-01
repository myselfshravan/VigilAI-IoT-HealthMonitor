
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Define our data point structure
export interface DataPoint {
  timestamp: number;
  value: number;
  id: string;
}

interface MockDataContextType {
  data: DataPoint[];
  isStreaming: boolean;
  toggleStreaming: () => void;
  updateInterval: number;
  setUpdateInterval: (interval: number) => void;
  dataPoints: number;
  setDataPoints: (points: number) => void;
}

const MockDataContext = createContext<MockDataContextType | undefined>(undefined);

interface MockDataProviderProps {
  children: ReactNode;
}

export const MockDataProvider: React.FC<MockDataProviderProps> = ({ children }) => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [isStreaming, setIsStreaming] = useState(true);
  const [updateInterval, setUpdateInterval] = useState(1000); // 1 second
  const [dataPoints, setDataPoints] = useState(20); // Max data points to show

  useEffect(() => {
    if (!isStreaming) return;

    // Initialize with some data if empty
    if (data.length === 0) {
      const initialData: DataPoint[] = [];
      const now = Date.now();
      
      for (let i = dataPoints - 1; i >= 0; i--) {
        initialData.push({
          timestamp: now - (i * updateInterval),
          value: 20 + Math.random() * 60,
          id: crypto.randomUUID()
        });
      }
      
      setData(initialData);
    }

    const interval = setInterval(() => {
      setData(currentData => {
        // Remove oldest data point if we have reached the limit
        const newData = currentData.length >= dataPoints 
          ? [...currentData.slice(1)] 
          : [...currentData];
        
        // Add new data point
        newData.push({
          timestamp: Date.now(),
          value: Math.max(5, Math.min(95, newData.length > 0 
            ? newData[newData.length - 1].value + (Math.random() * 10 - 5) 
            : 50)),
          id: crypto.randomUUID()
        });
        
        return newData;
      });
    }, updateInterval);

    return () => clearInterval(interval);
  }, [isStreaming, updateInterval, dataPoints]);

  const toggleStreaming = () => {
    setIsStreaming(prev => !prev);
  };

  const value = {
    data,
    isStreaming,
    toggleStreaming,
    updateInterval,
    setUpdateInterval,
    dataPoints,
    setDataPoints,
  };

  return <MockDataContext.Provider value={value}>{children}</MockDataContext.Provider>;
};

export const useMockData = () => {
  const context = useContext(MockDataContext);
  if (context === undefined) {
    throw new Error("useMockData must be used within a MockDataProvider");
  }
  return context;
};
