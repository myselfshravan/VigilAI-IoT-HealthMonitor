import React from "react";
import { useMockData } from "./MockDataProvider";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartLine,
  Play,
  Pause,
  BarChart3,
  Heart,
  Droplets,
  Thermometer,
  Gauge,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface ChartControlsProps {
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  showLegend: boolean;
  setShowLegend: (show: boolean) => void;
  chartHeight: number;
  setChartHeight: (height: number) => void;
  gradient: boolean;
  setGradient: (show: boolean) => void;
}

const ChartControls: React.FC<ChartControlsProps> = ({
  showGrid,
  setShowGrid,
  showLegend,
  setShowLegend,
  chartHeight,
  setChartHeight,
  gradient,
  setGradient,
}) => {
  const {
    isStreaming,
    toggleStreaming,
    updateInterval,
    setUpdateInterval,
    dataPoints,
    setDataPoints,
    selectedMetric,
    setSelectedMetric,
    data,
  } = useMockData();

  const isMobile = useIsMobile();

  // Get the latest alert if any
  const latestAlert = data.length > 0 ? data[data.length - 1].Alert : null;

  return (
    <div className="w-full p-4 space-y-4 bg-background border rounded-lg shadow-sm">
      <div className="w-full flex justify-center pt-2">
        <Tabs
          defaultValue={selectedMetric}
          className="w-full max-w-md"
          onValueChange={(value: "BPM" | "SPO2" | "Temp" | "Pressure") =>
            setSelectedMetric(value)
          }
        >
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="BPM" className="flex items-center gap-1">
              <Heart size={14} /> BPM
            </TabsTrigger>
            <TabsTrigger value="SPO2" className="flex items-center gap-1">
              <Droplets size={14} /> SPO2
            </TabsTrigger>
            <TabsTrigger value="Temp" className="flex items-center gap-1">
              <Thermometer size={14} /> Temp
            </TabsTrigger>
            <TabsTrigger value="Pressure" className="flex items-center gap-1">
              <Gauge size={14} /> Press
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
};

export default ChartControls;
