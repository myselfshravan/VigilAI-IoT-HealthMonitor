import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
} from "react";
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  onValue,
  off,
  DataSnapshot,
} from "firebase/database";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

// Define the Firebase data structure
interface FirebaseData {
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
}

// Firebase configuration
const firebaseConfig = {
  databaseURL: "https://auth-44578-default-rtdb.firebaseio.com/",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const firestore = getFirestore(app);

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
  savedAt?: ReturnType<typeof serverTimestamp> | null; // Optional field for Firestore server timestamp
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
    "timestamp" | "id" | "Lat" | "Long" | "Compass" | "Alert" | "STATUS" | "savedAt"
  >;
  setSelectedMetric: (
    metric: keyof Omit<
      HealthData,
      "timestamp" | "id" | "Lat" | "Long" | "Compass" | "Alert" | "STATUS" | "savedAt"
    >
  ) => void;
  isSavingToFirestore: boolean;
  toggleFirestoreSaving: () => void;
}

const MockDataContext = createContext<MockDataContextType | undefined>(
  undefined
);

interface MockDataProviderProps {
  children: ReactNode;
}

// Function to create a health data record from Firebase snapshot
const createHealthData = (snapshot: DataSnapshot): HealthData => {
  const now = Date.now();
  const val = (snapshot.val() || {}) as Partial<FirebaseData>;

  // Check for fall condition
  const isYAxisAbnormal = val.Compass?.Y > 3 || val.Compass?.Y < 1;

  return {
    timestamp: now,
    BPM: val.BPM || 80,
    SPO2: val.SPO2 || 97,
    Temp: val.Temp || 36.5,
    Pressure: val.Pressure || 1000,
    Lat: val.Lat || 0,
    Long: val.Long || 0,
    Compass: {
      X: val.Compass?.X || 0,
      Y: val.Compass?.Y || 2,
      Z: val.Compass?.Z || 9.8,
    },
    Alert: isYAxisAbnormal ? "Person Falling!" : val.Alert || null,
    STATUS: val.STATUS || "1",
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
        "timestamp" | "id" | "Lat" | "Long" | "Compass" | "Alert" | "STATUS" | "savedAt"
      >
    >("BPM");
  const [isSavingToFirestore, setIsSavingToFirestore] = useState(false);
  const dataRef = useRef<HealthData[]>(data); // Ref to access latest data in effect

  // Update ref whenever data changes
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (!isStreaming) return;

    const dataRef = ref(database, "/");

    const handleData = (snapshot: DataSnapshot) => {
      setData((currentData) => {
        const newData =
          currentData.length >= dataPoints
            ? [...currentData.slice(1)]
            : [...currentData];

        newData.push(createHealthData(snapshot));
        return newData;
      });
    };

    onValue(dataRef, handleData);

    return () => {
      off(dataRef, "value", handleData);
    };
  }, [isStreaming, updateInterval, dataPoints]);

  // Effect to save data to Firestore when enabled
  useEffect(() => {
    if (!isSavingToFirestore || data.length === 0) return;

    const latestDataPoint = data[data.length - 1];
    const saveData = async () => {
      try {
        const docRef = await addDoc(collection(firestore, "healthDataReadings"), {
          ...latestDataPoint,
          savedAt: serverTimestamp(), // Add Firestore server timestamp
        });
        console.log("Document written with ID: ", docRef.id);
      } catch (e) {
        console.error("Error adding document: ", e);
      }
    };

    saveData();
  }, [data, isSavingToFirestore, firestore]); // Depend on data to trigger on new data points

  const toggleStreaming = () => {
    setIsStreaming((prev) => !prev);
  };

  const toggleFirestoreSaving = () => {
    setIsSavingToFirestore((prev) => !prev);
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
    isSavingToFirestore,
    toggleFirestoreSaving,
  };

  return (
    <MockDataContext.Provider value={value}>
      {children}
    </MockDataContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useMockData = () => {
  const context = useContext(MockDataContext);
  if (context === undefined) {
    throw new Error("useMockData must be used within a MockDataProvider");
  }
  return context;
};
