
import React, { useState } from "react";
import { MockDataProvider } from "@/components/MockDataProvider";
import StreamingChart from "@/components/StreamingChart";
import ChartControls from "@/components/ChartControls";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const [showGrid, setShowGrid] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [chartHeight, setChartHeight] = useState(300);
  const [gradient, setGradient] = useState(true);
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-primary-foreground p-4 shadow-md">
        <h1 className="text-xl font-bold">Streaming Data Visualizer</h1>
        <p className="text-sm opacity-80">Real-time data monitoring dashboard</p>
      </header>

      <main className="flex-1 p-4 max-w-7xl mx-auto w-full space-y-6">
        <MockDataProvider>
          <div className={`space-y-6 ${isMobile ? 'px-0' : 'px-4'}`}>
            <div className="bg-card rounded-lg shadow-lg border overflow-hidden">
              <StreamingChart 
                showGrid={showGrid} 
                showLegend={showLegend} 
                chartHeight={chartHeight}
                gradient={gradient}
              />
            </div>

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
          </div>
        </MockDataProvider>
      </main>

      <footer className="bg-card p-4 text-center text-sm text-muted-foreground border-t">
        <p>Streaming Data Visualizer • Mobile-Optimized Dashboard</p>
      </footer>
    </div>
  );
};

export default Index;
