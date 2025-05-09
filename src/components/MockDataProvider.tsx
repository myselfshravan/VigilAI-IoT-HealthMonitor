import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
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
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  addDoc,
  Timestamp,
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
  Alert: number;
  STATUS: string;
}

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAnDdhpJcWGfkHE9YAkFYEULRb8uBuCcIc",
  authDomain: "major-project-1d78c.firebaseapp.com",
  databaseURL: "https://major-project-1d78c-default-rtdb.firebaseio.com",
  projectId: "major-project-1d78c",
  storageBucket: "major-project-1d78c.firebasestorage.app",
  messagingSenderId: "999324211490",
  appId: "1:999324211490:web:0b8cae75dc334f30d8ed7b",
  measurementId: "G-6DZY6F54G5",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Initialize Firestore with persistence
const firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

// Enable Firestore debug mode in development
if (process.env.NODE_ENV === "development") {
  console.log("Firestore debug mode enabled");
}

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
  fallalert: number;
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
  backupEnabled: boolean;
  toggleBackup: () => void;
  backupInterval: number;
  setBackupInterval: (interval: number) => void;
  lastBackupTime: number | null;
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
    fallalert: typeof val.Alert === "number" ? val.Alert : 0,
    STATUS: val.STATUS || "1",
    id: crypto.randomUUID(),
  };
};

export const MockDataProvider: React.FC<MockDataProviderProps> = ({
  children,
}) => {
  const latestDataRef = useRef<HealthData[]>([]);
  const [data, setData] = useState<HealthData[]>([]);
  const [isStreaming, setIsStreaming] = useState(true);
  const [updateInterval, setUpdateInterval] = useState(1000); // 1 second
  const [dataPoints, setDataPoints] = useState(20); // Max data points to show
  const [backupEnabled, setBackupEnabled] = useState(false);
  const [backupInterval, setBackupInterval] = useState(300000); // 5 minutes
  const [lastBackupTime, setLastBackupTime] = useState<number | null>(null);
  const [selectedMetric, setSelectedMetric] =
    useState<
      keyof Omit<
        HealthData,
        "timestamp" | "id" | "Lat" | "Long" | "Compass" | "Alert" | "STATUS"
      >
    >("BPM");

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

  const toggleStreaming = () => {
    setIsStreaming((prev) => !prev);
  };

  const toggleBackup = () => {
    setBackupEnabled((prev) => !prev);
  };

  // Function to backup data to Firestore
  const backupToFirestore = async (dataToBackup: HealthData[]) => {
    try {
      // Check if we have data to backup
      if (!dataToBackup.length) {
        console.log("No data to backup");
        return;
      }

      console.log("Starting Firestore backup...", {
        dataLength: dataToBackup.length,
        timestamp: new Date().toISOString(),
      });

      // Create a smaller version of the data for backup
      const backupData = {
        timestamp: Timestamp.now(),
        lastDataPoint: {
          BPM: dataToBackup[dataToBackup.length - 1].BPM,
          SPO2: dataToBackup[dataToBackup.length - 1].SPO2,
          Temp: dataToBackup[dataToBackup.length - 1].Temp,
          Pressure: dataToBackup[dataToBackup.length - 1].Pressure,
        },
        dataPoints: dataToBackup.map((item) => ({
          timestamp: item.timestamp,
          BPM: item.BPM,
          SPO2: item.SPO2,
          Temp: item.Temp,
          Pressure: item.Pressure,
        })),
      };

      // Try to access and write to the collection
      const backupCollection = collection(firestore, "sensorDataBackups");
      const docRef = await addDoc(backupCollection, backupData);

      console.log("Backup successful:", {
        documentId: docRef.id,
        timestamp: new Date().toISOString(),
        dataPointsCount: dataToBackup.length,
      });

      setLastBackupTime(Date.now());

      // Update UI with success status
      if (typeof window !== "undefined") {
        const event = new CustomEvent("backupStatus", {
          detail: {
            type: "success",
            title: "Backup Successful",
            description: `Backed up ${dataToBackup.length} data points`,
          },
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error("Error backing up to Firestore:", error);
      if (error instanceof Error) {
        console.error({
          name: error.name,
          message: error.message,
          stack: error.stack,
          firestoreInstance: !!firestore,
        });
      }

      // Update UI with error status
      if (typeof window !== "undefined") {
        const event = new CustomEvent("backupStatus", {
          detail: {
            type: "error",
            title: "Backup Failed",
            description:
              error instanceof Error ? error.message : "Unknown error occurred",
            action: {
              label: "Try Again",
              onClick: () => backupToFirestore(dataToBackup),
            },
          },
        });
        window.dispatchEvent(event);
      }

      // Temporarily disable backup on error to prevent rapid retries
      setBackupEnabled(false);
    }
  };

  // Function to check if it's time for the next backup
  const shouldBackup = useRef<boolean>(true);
  const backupTimeoutRef = useRef<NodeJS.Timeout>();

  // Effect for managing backup state
  useEffect(() => {
    if (!backupEnabled) {
      console.log("Backup disabled");
      if (backupTimeoutRef.current) {
        clearTimeout(backupTimeoutRef.current);
      }
      return;
    }

    // Validate backup interval
    if (backupInterval < 60000) {
      // Minimum 1 minute
      console.warn("Backup interval too short, setting to 1 minute");
      setBackupInterval(60000);
      return;
    }

    console.log("Setting up backup interval:", {
      intervalMs: backupInterval,
      enabled: backupEnabled,
    });

    const scheduleNextBackup = () => {
      shouldBackup.current = true;
      backupTimeoutRef.current = setTimeout(async () => {
        if (latestDataRef.current.length > 0) {
          console.log("Performing scheduled backup");
          await backupToFirestore(latestDataRef.current);
        }
        scheduleNextBackup();
      }, backupInterval);
    };

    // Start the backup cycle
    scheduleNextBackup();

    // Perform initial backup
    if (data.length > 0 && shouldBackup.current) {
      console.log("Performing initial backup");
      backupToFirestore(data);
      shouldBackup.current = false;
    }

    return () => {
      console.log("Cleaning up backup interval");
      if (backupTimeoutRef.current) {
        clearTimeout(backupTimeoutRef.current);
      }
    };
  }, [backupEnabled, backupInterval]);

  // Keep the ref updated with latest data
  useEffect(() => {
    latestDataRef.current = data;
  }, [data]);

  // Effect to handle cleanup on unmount
  useEffect(() => {
    return () => {
      if (backupTimeoutRef.current) {
        clearTimeout(backupTimeoutRef.current);
      }
    };
  }, []);

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
    backupEnabled,
    toggleBackup,
    backupInterval,
    setBackupInterval,
    lastBackupTime,
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
