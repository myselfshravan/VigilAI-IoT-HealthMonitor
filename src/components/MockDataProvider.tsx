import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// Define our health monitoring data structure
export interface HealthData {
  timestamp: number;
  BPM: number;
  SPO2: number;
  Temp: number;
  Pressure: number;
  Lat: number;
  Long: number;
  Compass: {
    X: number;
    Y: number;
    Z: number;
  };
  Alert: string | null;
  STATUS: string;
  id: string;
}

interface MockDataContextType {
  data: HealthData[];
  isStreaming: boolean;
  toggleStreaming: () => void;
  updateInterval: number;
  setUpdateInterval: (interval: number) => void;
  dataPoints: number;
  setDataPoints: (points: number) => void;
  selectedMetric: keyof Omit<
    HealthData,
    "timestamp" | "id" | "Lat" | "Long" | "Compass" | "Alert" | "STATUS"
  >;
  setSelectedMetric: (
    metric: keyof Omit<
      HealthData,
      "timestamp" | "id" | "Lat" | "Long" | "Compass" | "Alert" | "STATUS"
    >
  ) => void;
}

const MockDataContext = createContext<MockDataContextType | undefined>(
  undefined
);

interface MockDataProviderProps {
  children: ReactNode;
}

// Generate random value within a range
const getRandomValue = (min: number, max: number, precision = 1) => {
  return parseFloat((min + Math.random() * (max - min)).toFixed(precision));
};

// Generate a random health data record
const generateHealthData = (prevData?: HealthData): HealthData => {
  // Base values
  const baseData = prevData || {
    BPM: 72,
    SPO2: 98,
    Temp: 36.5,
    Pressure: 1000,
    Compass: { X: 0, Y: 0, Z: 9.8 },
  };

  // Random fluctuations (smaller if we have previous data)
  const factor = prevData ? 0.02 : 0.2;

  // Generate an alert randomly (10% chance)
  const alertTypes = [
    null,
    "Person Falling!",
    "Low SPO2!",
    "High BPM!",
    "Low BPM!",
  ];
  const showAlert = Math.random() < 0.1;
  const alertIndex = showAlert
    ? Math.floor(Math.random() * (alertTypes.length - 1)) + 1
    : 0;

  return {
    timestamp: Date.now(),
    BPM: Math.max(
      40,
      Math.min(
        180,
        getRandomValue(
          baseData.BPM * (1 - factor),
          baseData.BPM * (1 + factor),
          0
        )
      )
    ),
    SPO2: Math.max(
      85,
      Math.min(
        100,
        getRandomValue(
          baseData.SPO2 * (1 - factor * 0.5),
          baseData.SPO2 * (1 + factor * 0.1),
          1
        )
      )
    ),
    Temp: Math.max(
      35,
      Math.min(
        40,
        getRandomValue(
          baseData.Temp * (1 - factor * 0.1),
          baseData.Temp * (1 + factor * 0.1),
          1
        )
      )
    ),
    Pressure: Math.max(
      980,
      Math.min(
        1020,
        getRandomValue(
          baseData.Pressure * (1 - factor * 0.01),
          baseData.Pressure * (1 + factor * 0.01),
          1
        )
      )
    ),
    Lat: getRandomValue(12.975, 12.985, 6),
    Long: getRandomValue(77.755, 77.765, 6),
    Compass: {
      X: getRandomValue(baseData.Compass.X - 0.1, baseData.Compass.X + 0.1, 2),
      Y: getRandomValue(baseData.Compass.Y - 0.1, baseData.Compass.Y + 0.1, 2),
      Z: getRandomValue(baseData.Compass.Z - 0.1, baseData.Compass.Z + 0.1, 2),
    },
    Alert: alertTypes[alertIndex],
    STATUS: String(Math.floor(Math.random() * 5)),
    id: crypto.randomUUID(),
  };
};

export const MockDataProvider: React.FC<MockDataProviderProps> = ({
  children,
}) => {
  const [data, setData] = useState<HealthData[]>([]);
  const [isStreaming, setIsStreaming] = useState(true);
  const [updateInterval, setUpdateInterval] = useState(1000); // 1 second
  const [dataPoints, setDataPoints] = useState(20); // Max data points to show
  const [selectedMetric, setSelectedMetric] =
    useState<
      keyof Omit<
        HealthData,
        "timestamp" | "id" | "Lat" | "Long" | "Compass" | "Alert" | "STATUS"
      >
    >("BPM");

  useEffect(() => {
    if (!isStreaming) return;

    // Initialize with some data if empty
    if (data.length === 0) {
      const initialData: HealthData[] = [];
      const now = Date.now();

      let prevData: HealthData | undefined = undefined;
      for (let i = dataPoints - 1; i >= 0; i--) {
        prevData = generateHealthData(prevData);
        prevData.timestamp = now - i * updateInterval;
        initialData.push(prevData);
      }

      setData(initialData);
    }

    const interval = setInterval(() => {
      setData((currentData) => {
        // Remove oldest data point if we have reached the limit
        const newData =
          currentData.length >= dataPoints
            ? [...currentData.slice(1)]
            : [...currentData];

        // Add new data point based on the last one
        const lastData =
          newData.length > 0 ? newData[newData.length - 1] : undefined;
        newData.push(generateHealthData(lastData));

        return newData;
      });
    }, updateInterval);

    return () => clearInterval(interval);
  }, [isStreaming, updateInterval, dataPoints]);

  const toggleStreaming = () => {
    setIsStreaming((prev) => !prev);
  };

  const value = {
    data,
    isStreaming,
    toggleStreaming,
    updateInterval,
    setUpdateInterval,
    dataPoints,
    setDataPoints,
    selectedMetric,
    setSelectedMetric,
  };

  return (
    <MockDataContext.Provider value={value}>
      {children}
    </MockDataContext.Provider>
  );
};

export const useMockData = () => {
  const context = useContext(MockDataContext);
  if (context === undefined) {
    throw new Error("useMockData must be used within a MockDataProvider");
  }
  return context;
};
