import React, { useEffect } from "react";
import { useMockData } from "./MockDataProvider";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartLine,
  Play,
  Pause,
  BarChart3,
  Heart,
  Droplets,
  Thermometer,
  Gauge,
  Database,
  Clock,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";

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
    backupEnabled,
    toggleBackup,
    backupInterval,
    setBackupInterval,
    lastBackupTime,
  } = useMockData();

  const isMobile = useIsMobile();
  const { toast } = useToast();

  // Handle backup status events
  useEffect(() => {
    const handleBackupStatus = (
      event: CustomEvent<{
        type: "success" | "error";
        title: string;
        description: string;
        action?: {
          label: string;
          onClick: () => void;
        };
      }>
    ) => {
      const { type, title, description, action } = event.detail;

      toast({
        title,
        description,
        variant: type === "success" ? "default" : "destructive",
        action: action && (
          <ToastAction altText={action.label} onClick={action.onClick}>
            {action.label}
          </ToastAction>
        ),
      });
    };

    window.addEventListener(
      "backupStatus",
      handleBackupStatus as EventListener
    );

    return () => {
      window.removeEventListener(
        "backupStatus",
        handleBackupStatus as EventListener
      );
    };
  }, [toast]);

  // Get the latest alert if any
  const latestAlert = data.length > 0 ? data[data.length - 1].Alert : null;
  const currentStatus = data.length > 0 ? data[data.length - 1].STATUS : "1";

  const handleStatusChange = (value: string) => {
    if (value) {
      fetch("https://major-project-1d78c-default-rtdb.firebaseio.com/.json", {
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
        <div className="flex items-center justify-between flex-col gap-2">
          {backupEnabled && lastBackupTime && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Last backup: {new Date(lastBackupTime).toLocaleTimeString()}
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="flex items-center space-x-2">
              <Switch
                checked={backupEnabled}
                onCheckedChange={(enabled) => {
                  toggleBackup();
                  toast({
                    title: enabled ? "Backup Enabled" : "Backup Disabled",
                    description: enabled
                      ? "Data will be backed up to Firestore automatically"
                      : "Automatic backup has been disabled",
                    duration: 3000,
                  });
                }}
                id="backup-mode"
              />
              <Label htmlFor="backup-mode" className="text-sm font-medium">
                Enable Backup
              </Label>
            </div>
            <Select
              value={backupInterval.toString()}
              onValueChange={(value) => {
                setBackupInterval(parseInt(value));
                toast({
                  title: "Backup Interval Updated",
                  description: `Backup interval set to ${
                    parseInt(value) / 60000
                  } minutes`,
                });
              }}
              disabled={!backupEnabled}
            >
              <SelectTrigger className="w-[180px] text-sm">
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="60000">Every 1 minute</SelectItem>
                <SelectItem value="300000">Every 5 minutes</SelectItem>
                <SelectItem value="600000">Every 10 minutes</SelectItem>
                <SelectItem value="1800000">Every 30 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

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
