
import React, { useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from "recharts";
import { useMockData, HealthData } from "./MockDataProvider";
import { useIsMobile } from "@/hooks/use-mobile";

interface StreamingChartProps {
  showGrid?: boolean;
  showLegend?: boolean;
  chartHeight?: number;
  gradient?: boolean;
}

// Define colors and thresholds for the different metrics
const metricConfig = {
  BPM: {
    color: "#8B5CF6",
    unit: "bpm",
    label: "Heart Rate",
    min: 40,
    max: 180,
    warning: { low: 50, high: 120 },
    danger: { low: 40, high: 150 }
  },
  SPO2: {
    color: "#2DD4BF",
    unit: "%",
    label: "Blood Oxygen",
    min: 85,
    max: 100,
    warning: { low: 92, high: 100 },
    danger: { low: 88, high: 100 }
  },
  Temp: {
    color: "#F97316",
    unit: "°C",
    label: "Temperature",
    min: 35,
    max: 40,
    warning: { low: 35.5, high: 37.8 },
    danger: { low: 35, high: 38.5 }
  },
  Pressure: {
    color: "#6366F1",
    unit: "hPa",
    label: "Pressure",
    min: 980,
    max: 1020,
    warning: { low: 990, high: 1010 },
    danger: { low: 985, high: 1015 }
  }
};

const StreamingChart: React.FC<StreamingChartProps> = ({ 
  showGrid = true, 
  showLegend = true, 
  chartHeight = 300,
  gradient = true
}) => {
  const { data, selectedMetric } = useMockData();
  const isMobile = useIsMobile();
  
  const metricDetails = metricConfig[selectedMetric];
  
  // Format the data for the chart
  const chartData = useMemo(() => {
    return data.map((point: HealthData) => ({
      ...point,
      formattedTime: new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }));
  }, [data]);

  // Define gradient colors for the chart
  const renderGradient = () => {
    if (!gradient) return null;
    
    return (
      <defs>
        <linearGradient id={`color${selectedMetric}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={metricDetails.color} stopOpacity={0.8}/>
          <stop offset="95%" stopColor={metricDetails.color} stopOpacity={0}/>
        </linearGradient>
      </defs>
    );
  };

  return (
    <div className="chart-container" style={{ height: `${chartHeight}px` }}>
      <div className="p-2 text-center">
        <h3 className="text-lg font-semibold">{metricDetails.label}</h3>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 10,
            right: isMobile ? 10 : 30,
            left: isMobile ? 0 : 10,
            bottom: 20,
          }}
        >
          {renderGradient()}
          {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.2} />}
          <XAxis 
            dataKey="formattedTime"
            tick={{ fontSize: isMobile ? 10 : 12 }}
            interval="preserveEnd"
            tickCount={isMobile ? 3 : 5}
          />
          <YAxis 
            domain={[metricDetails.min, metricDetails.max]}
            tick={{ fontSize: isMobile ? 10 : 12 }}
            width={isMobile ? 30 : 40}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
              fontSize: isMobile ? '12px' : '14px'
            }}
            formatter={(value) => {
              // Check if value is a number before calling toFixed
              const formattedValue = typeof value === 'number' 
                ? `${value.toFixed(1)} ${metricDetails.unit}` 
                : `${value} ${metricDetails.unit}`;
              return [formattedValue, metricDetails.label];
            }}
            labelFormatter={(time) => `Time: ${time}`}
          />
          {showLegend && <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12, paddingTop: 10 }} />}
          
          {/* Add warning and danger reference lines */}
          <ReferenceLine y={metricDetails.warning.low} stroke="#FCD34D" strokeDasharray="3 3" />
          <ReferenceLine y={metricDetails.warning.high} stroke="#FCD34D" strokeDasharray="3 3" />
          <ReferenceLine y={metricDetails.danger.low} stroke="#F87171" strokeDasharray="3 3" />
          <ReferenceLine y={metricDetails.danger.high} stroke="#F87171" strokeDasharray="3 3" />
          
          <Line
            type="monotone"
            dataKey={selectedMetric}
            name={metricDetails.label}
            stroke={metricDetails.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, fill: metricDetails.color }}
            isAnimationActive={true}
            animationDuration={300}
            connectNulls={true}
            fill={gradient ? `url(#color${selectedMetric})` : "none"}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StreamingChart;
