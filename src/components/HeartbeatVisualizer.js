import React, { useEffect, useRef } from 'react';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale } from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale);

const HeartbeatVisualizer = ({ isActive }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null); // Store chart instance

  useEffect(() => {
    if (!chartRef.current) return;

    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    
    // Create new chart instance and store it
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: Array(20).fill(''),
        datasets: [{
          data: Array(20).fill(0),
          borderColor: '#ff7b00',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 0,
        }],
      },
      options: {
        responsive: true,
        scales: {
          y: { display: false, min: -1, max: 1 },
          x: { display: false },
        },
        animation: { duration: 0 },
      },
    });

    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []); // Empty dependency array for initial setup

  useEffect(() => {
    if (!chartInstance.current || !isActive) return;

    const interval = setInterval(() => {
      const newData = Array(20)
        .fill(0)
        .map((_, i) => Math.sin(Date.now() / 200 + i * 0.5) * 0.8);
      
      if (chartInstance.current) {
        chartInstance.current.data.datasets[0].data = newData;
        chartInstance.current.update();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isActive]); // Only re-run when isActive changes

  return <canvas ref={chartRef} width="300" height="100" />;
};

export default HeartbeatVisualizer;