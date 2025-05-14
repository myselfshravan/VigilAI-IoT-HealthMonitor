import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Heart,
  Thermometer,
  Gauge,
  MapPin,
  Compass,
  CloudCog,
} from "lucide-react";
import { Header } from "@/components/ui/header";

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        title="About This Project"
        subtitle="A real-time health monitoring system"
      />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid gap-6">
          {/* Project Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This is a real-time health monitoring system that collects and
                visualizes various sensor data. The system uses Firebase
                Realtime Database for live data streaming and Firestore for data
                backup.
              </p>
            </CardContent>
          </Card>

          {/* Data Points */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-md">Vital Signs</CardTitle>
                <Heart className="h-5 w-5 text-purple-500" />
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li>
                    <span className="font-medium">Heart Rate (BPM)</span>
                    <p className="text-sm text-muted-foreground">
                      Warning: 50-120 bpm
                      <br />
                      Danger: &lt;40 or &gt;150 bpm
                    </p>
                  </li>
                  <li>
                    <span className="font-medium">Blood Oxygen (SPO2)</span>
                    <p className="text-sm text-muted-foreground">
                      Warning: &lt;92%
                      <br />
                      Danger: &lt;88%
                    </p>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-md">Environmental</CardTitle>
                <div className="flex gap-2">
                  <Thermometer className="h-5 w-5 text-orange-500" />
                  <Gauge className="h-5 w-5 text-indigo-500" />
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li>
                    <span className="font-medium">Temperature</span>
                    <p className="text-sm text-muted-foreground">
                      Warning: 35.5-37.8°C
                      <br />
                      Danger: &lt;35 or &gt;38.5°C
                    </p>
                  </li>
                  <li>
                    <span className="font-medium">Pressure</span>
                    <p className="text-sm text-muted-foreground">
                      Warning: 990-1010 hPa
                      <br />
                      Danger: &lt;985 or &gt;1015 hPa
                    </p>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-md">Position & Motion</CardTitle>
                <div className="flex gap-2">
                  <MapPin className="h-5 w-5 text-green-500" />
                  <Compass className="h-5 w-5 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li>
                    <span className="font-medium">Location</span>
                    <p className="text-sm text-muted-foreground">
                      Tracks latitude and longitude coordinates
                    </p>
                  </li>
                  <li>
                    <span className="font-medium">Motion Detection</span>
                    <p className="text-sm text-muted-foreground">
                      Monitors X, Y, Z axis movements
                      <br />
                      Fall detection: Y-axis &gt;3 or &lt;1
                    </p>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Features */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>System Features</CardTitle>
              <CloudCog className="h-5 w-5 text-gray-500" />
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 list-disc pl-4">
                <li>
                  Real-time data streaming with configurable update intervals
                </li>
                <li>Interactive charts with warning and danger thresholds</li>
                <li>Automatic fall detection alerts</li>
                <li>Data backup to Firestore (configurable intervals)</li>
                <li>Mobile-responsive design</li>
                <li>Historical data visualization</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="bg-card p-4 text-center text-sm text-muted-foreground border-t">
        <p>Smart Health Monitoring System</p>
        <p>Developed by Shravan</p>
      </footer>
    </div>
  );
};

export default AboutPage;
