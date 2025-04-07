import React, { useState } from "react";
import { MockDataProvider } from "@/components/MockDataProvider";
import StreamingChart from "@/components/StreamingChart";
import ChartControls from "@/components/ChartControls";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMockData } from "@/components/MockDataProvider";
import { Heart, Droplets, Thermometer, Gauge } from "lucide-react";

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
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
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
    </div>
  );
};

const Index = () => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-primary-foreground p-4 shadow-md">
        <h1 className="text-xl font-bold">Health Monitoring Dashboard</h1>
        <p className="text-sm opacity-80">
          Real-time vital signs visualization
        </p>
      </header>

      <main className="flex-1 p-4 max-w-7xl mx-auto w-full space-y-6">
        <MockDataProvider>
          <MonitoringDashboard />
        </MockDataProvider>
      </main>

      <footer className="bg-card p-4 text-center text-sm text-muted-foreground border-t">
        <p>Health Monitoring System</p>
        <p>Developed by Shravan</p>
      </footer>
    </div>
  );
};

export default Index;
