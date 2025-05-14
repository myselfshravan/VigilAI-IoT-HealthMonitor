import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MockDataProvider } from "@/components/MockDataProvider";
import heartbeatGif from "@/assets/heartbeat.gif";
import StreamingChart from "@/components/StreamingChart";
import ChartControls from "@/components/ChartControls";
import SensorData from "@/components/SensorData";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useMockData } from "@/components/MockDataProvider";
import {
  Heart,
  Droplets,
  Thermometer,
  Gauge,
  AlertTriangle,
  Info,
  MessageSquare,
  Mic,
} from "lucide-react";

// VitalCard component to display latest health metrics
const VitalCard = ({
  title,
  value,
  unit,
  icon: Icon,
}: {
  title: string;
  value: number | string;
  unit: string;
  icon: React.ElementType;
}) => {
  const [animationKey, setAnimationKey] = React.useState(0);

  React.useEffect(() => {
    setAnimationKey((prev) => prev + 1);
  }, [value]);

  return (
    <Card className="h-full shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {title === "Heart Rate" ? (
          <img src={heartbeatGif} alt="heartbeat" className="h-5 w-5" />
        ) : (
          <Icon className="h-4 w-4 text-muted-foreground animate-pulse" />
        )}
      </CardHeader>
      <CardContent>
        <style>
          {`
            @keyframes highlightValue {
              0% { 
                color: inherit;
              }
              50% { 
                color: red;
              }
              100% { 
                color: inherit;
              }
            }
            .highlight-change {
              animation: highlightValue 1s ease;
            }
          `}
        </style>
        <div
          key={animationKey}
          className="text-xl font-bold p-1 rounded-md highlight-change"
        >
          {value}
          {unit}
        </div>
      </CardContent>
    </Card>
  );
};

// Wrapper component that uses the context
const MonitoringDashboard = () => {
  const [showGrid, setShowGrid] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [chartHeight, setChartHeight] = useState(300);
  const [gradient, setGradient] = useState(true);
  const isMobile = useIsMobile();
  const { data, selectedMetric } = useMockData();

  // Get the latest health data
  const latestData = data.length > 0 ? data[data.length - 1] : null;

  return (
    <div className={`space-y-6 ${isMobile ? "px-0" : "px-4"}`}>
      {latestData && latestData.fallalert === 1 && (
        <Alert variant="destructive" className="animate-pulse">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Fall Detected!</AlertTitle>
          <AlertDescription>
            A potential fall has been detected. Please check on the person
            immediately.
          </AlertDescription>
        </Alert>
      )}

      {latestData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <VitalCard
            title="Heart Rate"
            value={latestData.BPM.toFixed(0)}
            unit=" bpm"
            icon={Heart}
          />
          <VitalCard
            title="Blood Oxygen"
            value={latestData.SPO2.toFixed(1)}
            unit="%"
            icon={Droplets}
          />
          <VitalCard
            title="Temperature"
            value={latestData.Temp.toFixed(1)}
            unit="°C"
            icon={Thermometer}
          />
          <VitalCard
            title="Pressure"
            value={latestData.Pressure.toFixed(1)}
            unit=" hPa"
            icon={Gauge}
          />
        </div>
      )}

      <div className="bg-card rounded-lg shadow-lg border overflow-hidden">
        <ChartControls
          showGrid={showGrid}
          setShowGrid={setShowGrid}
          showLegend={showLegend}
          setShowLegend={setShowLegend}
          chartHeight={chartHeight}
          setChartHeight={setChartHeight}
          gradient={gradient}
          setGradient={setGradient}
        />
        <StreamingChart
          showGrid={showGrid}
          showLegend={showLegend}
          chartHeight={chartHeight}
          gradient={gradient}
        />
      </div>

      {latestData && <SensorData />}
    </div>
  );
};

import { Header } from "@/components/ui/header";

const Index = () => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        title="VigilAI - Health Monitoring System"
        subtitle="Real-time vital signs visualization"
      />

      <main className="flex-1 p-4 max-w-6xl mx-auto w-full space-y-6">
        <MockDataProvider>
          <MonitoringDashboard />
        </MockDataProvider>
      </main>

      <footer className="bg-card p-4 text-center text-sm text-muted-foreground border-t">
        <p>Vigil AI - Smart Health Monitoring System</p>
        <p>Developed by Team: Namratha, Nisha, Chiranth and Shravan</p>
      </footer>
    </div>
  );
};

export default Index;
