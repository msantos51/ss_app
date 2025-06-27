// Página que exibe um gráfico simples das distâncias percorridas
import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { fetchVendorRoutes } from '../services/api';

// StatsPage
function StatsPage() {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    // load
    const load = async () => {
      try {
        // routes
        const routes = await fetchVendorRoutes();
        // daily
        const daily = {};
        routes.forEach((r) => {
          // d
          const d = r.start_time.split('T')[0];
          daily[d] = (daily[d] || 0) + r.distance_m;
        });
        // labels
        const labels = Object.keys(daily);
        // data
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
    <main style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <h1>Estatísticas</h1>
      <Bar data={chartData} />
    </main>
  );
}

export default StatsPage;
