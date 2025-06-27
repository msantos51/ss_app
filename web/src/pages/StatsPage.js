// Página que exibe um gráfico simples das distâncias percorridas
import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { fetchVendorRoutes } from '../services/api';

function StatsPage() {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const routes = await fetchVendorRoutes();
        const daily = {};
        routes.forEach((r) => {
          const d = r.start_time.split('T')[0];
          daily[d] = (daily[d] || 0) + r.distance_m;
        });
        const labels = Object.keys(daily);
        const data = labels.map((d) => Number((daily[d] / 1000).toFixed(2)));
        setChartData({ labels, datasets: [{ label: 'Km', data }] });
      } catch {
        setChartData(null);
      }
    };
    load();
  }, []);

  if (!chartData) return <p>Nenhum dado</p>;

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <h1>Estatísticas</h1>
      <Bar data={chartData} />
    </div>
  );
}

export default StatsPage;
