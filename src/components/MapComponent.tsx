import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";

interface MapComponentProps {
  latitude: number;
  longitude: number;
}

const MapComponent = ({ latitude, longitude }: MapComponentProps) => {
  const [geofenceRadius, setGeofenceRadius] = useState(100);

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="relative w-full h-[300px] bg-gray-100 rounded-lg overflow-hidden">
          {/* Simplified map representation */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Center marker */}
            <div className="relative">
              <div className="w-4 h-4 bg-red-500 rounded-full" />
              {/* Geofence circle */}
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-blue-500 rounded-full opacity-50"
                style={{
                  width: `${geofenceRadius}px`,
                  height: `${geofenceRadius}px`,
                }}
              />
            </div>
          </div>
          <div className="absolute bottom-2 left-2 bg-white p-2 rounded shadow text-sm">
            Lat: {latitude.toFixed(6)}<br />
            Long: {longitude.toFixed(6)}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Geofence Radius: {geofenceRadius}m
          </label>
          <Slider
            value={[geofenceRadius]}
            onValueChange={([value]) => setGeofenceRadius(value)}
            min={50}
            max={500}
            step={10}
          />
        </div>
      </div>
    </Card>
  );
};

export default MapComponent;
