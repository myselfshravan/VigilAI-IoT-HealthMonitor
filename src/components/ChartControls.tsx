
import React from "react";
import { useMockData } from "./MockDataProvider";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  ChartLine,
  Play, 
  Pause,
  BarChart3
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

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
    setDataPoints 
  } = useMockData();
  
  const isMobile = useIsMobile();

  return (
    <div className="w-full p-4 space-y-4 bg-background border rounded-lg shadow-sm">
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
