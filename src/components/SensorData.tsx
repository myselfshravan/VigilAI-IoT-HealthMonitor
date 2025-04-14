import React from "react";
import { useMockData } from "./MockDataProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Compass, MapPin } from "lucide-react";

const SensorCard = ({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) => {
  return (
    <Card className="col-span-2 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {children}
        </div>
      </CardContent>
    </Card>
  );
};

const SensorData = () => {
  const { data } = useMockData();
  const latestData = data.length > 0 ? data[data.length - 1] : null;

  if (!latestData) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <SensorCard title="Location" icon={MapPin}>
        <div className="text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Latitude:</span>
            <span className="font-medium">{latestData.Lat.toFixed(6)}°</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Longitude:</span>
            <span className="font-medium">{latestData.Long.toFixed(6)}°</span>
          </div>
        </div>
      </SensorCard>
      <SensorCard title="Compass" icon={Compass}>
        <div className="text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">X-axis:</span>
            <span className="font-medium">{latestData.Compass.X.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Y-axis:</span>
            <span className="font-medium">{latestData.Compass.Y.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Z-axis:</span>
            <span className="font-medium">{latestData.Compass.Z.toFixed(2)}</span>
          </div>
        </div>
      </SensorCard>
    </div>
  );
};

export default SensorData;