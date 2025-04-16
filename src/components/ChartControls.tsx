import React from "react";
import { useMockData } from "./MockDataProvider";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
  const STATUS_OPTIONS = [
    { value: "1", label: "BPM" },
    { value: "2", label: "Temp" },
    { value: "3", label: "Accel" },
    { value: "4", label: "ECG" },
  ];
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
  const currentStatus = data.length > 0 ? data[data.length - 1].STATUS : "1";

  const handleStatusChange = (value: string) => {
    if (value) {
      fetch("https://auth-44578-default-rtdb.firebaseio.com/.json", {
        method: "PATCH",
        body: JSON.stringify({ STATUS: value }),
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  };

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

      <div className="w-full flex flex-col gap-3">
        <Label className="text-sm font-medium text-gray-700 text-center">
          Status Control
        </Label>
        <ToggleGroup
          type="single"
          value={currentStatus}
          onValueChange={handleStatusChange}
          className="flex gap-2"
        >
          {STATUS_OPTIONS.map((option) => (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              aria-label={option.label}
              className="px-4 py-2 rounded-xl border text-sm font-medium transition-colors
                   data-[state=on]:bg-primary data-[state=on]:text-white
                   data-[state=on]:border-primary
                   hover:bg-muted hover:text-black"
            >
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  );
};

export default ChartControls;
