
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
  Gauge
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
  setGradient
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
    data
  } = useMockData();
  
  const isMobile = useIsMobile();

  // Get the latest alert if any
  const latestAlert = data.length > 0 ? data[data.length - 1].Alert : null;

  return (
    <div className="w-full p-4 space-y-4 bg-background border rounded-lg shadow-sm">
      {latestAlert && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            Alert Detected
          </AlertTitle>
          <AlertDescription>
            {latestAlert}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between controls-panel">
        <Button
          onClick={toggleStreaming}
          size={isMobile ? "sm" : "default"}
          variant="outline"
          className="flex items-center gap-2"
        >
          {isStreaming ? (
            <>
              <Pause size={16} /> Pause
            </>
          ) : (
            <>
              <Play size={16} /> Resume
            </>
          )}
        </Button>

        <div className="flex items-center gap-2">
          <BarChart3 size={16} />
          <Label htmlFor="gridToggle">Grid</Label>
          <Switch
            id="gridToggle"
            checked={showGrid}
            onCheckedChange={setShowGrid}
          />
        </div>

        <div className="flex items-center gap-2">
          <ChartLine size={16} />
          <Label htmlFor="legendToggle">Legend</Label>
          <Switch
            id="legendToggle"
            checked={showLegend}
            onCheckedChange={setShowLegend}
          />
        </div>

        <div className="flex items-center gap-2">
          <ChartLine size={16} />
          <Label htmlFor="gradientToggle">Gradient</Label>
          <Switch
            id="gradientToggle"
            checked={gradient}
            onCheckedChange={setGradient}
          />
        </div>
      </div>

      <div className="w-full flex justify-center pt-2">
        <Tabs 
          defaultValue={selectedMetric} 
          className="w-full max-w-md"
          onValueChange={(value) => setSelectedMetric(value as any)}
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

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="updateInterval">Update Speed: {updateInterval}ms</Label>
          </div>
          <Slider
            id="updateInterval"
            min={100}
            max={2000}
            step={100}
            value={[updateInterval]}
            onValueChange={(value) => setUpdateInterval(value[0])}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="dataPoints">Data Points: {dataPoints}</Label>
          </div>
          <Slider
            id="dataPoints"
            min={10}
            max={100}
            step={5}
            value={[dataPoints]}
            onValueChange={(value) => setDataPoints(value[0])}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="chartHeight">Chart Height: {chartHeight}px</Label>
          </div>
          <Slider
            id="chartHeight"
            min={200}
            max={600}
            step={50}
            value={[chartHeight]}
            onValueChange={(value) => setChartHeight(value[0])}
          />
        </div>
      </div>
    </div>
  );
};

export default ChartControls;
