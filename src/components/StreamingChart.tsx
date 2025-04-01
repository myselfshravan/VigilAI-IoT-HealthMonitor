
import React, { useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useMockData, DataPoint } from "./MockDataProvider";
import { useIsMobile } from "@/hooks/use-mobile";

interface StreamingChartProps {
  showGrid?: boolean;
  showLegend?: boolean;
  chartHeight?: number;
  gradient?: boolean;
}

const StreamingChart: React.FC<StreamingChartProps> = ({ 
  showGrid = true, 
  showLegend = true, 
  chartHeight = 300,
  gradient = true
}) => {
  const { data } = useMockData();
  const isMobile = useIsMobile();
  
  // Format the data for the chart
  const chartData = useMemo(() => {
    return data.map((point: DataPoint) => ({
      ...point,
      formattedTime: new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }));
  }, [data]);

  // Define gradient colors for the chart
  const renderGradient = () => {
    if (!gradient) return null;
    
    return (
      <defs>
        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
        </linearGradient>
      </defs>
    );
  };

  return (
    <div className="chart-container" style={{ height: `${chartHeight}px` }}>
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
            domain={[0, 100]}
            tick={{ fontSize: isMobile ? 10 : 12 }}
            width={isMobile ? 30 : 40} 
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
                ? `${value.toFixed(2)}%` 
                : `${value}%`;
              return [formattedValue, 'Value'];
            }}
            labelFormatter={(time) => `Time: ${time}`}
          />
          {showLegend && <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12, paddingTop: 10 }} />}
          <Line
            type="monotone"
            dataKey="value"
            name="Signal Value"
            stroke="#8B5CF6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, fill: "#8B5CF6" }}
            isAnimationActive={true}
            animationDuration={300}
            connectNulls={true}
            fill={gradient ? "url(#colorValue)" : "none"}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StreamingChart;
