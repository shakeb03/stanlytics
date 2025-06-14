import React, { useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const MonthlyAnalytics = ({ monthlyRevenue, monthlyProductRevenue }) => {
  const [selectedProduct, setSelectedProduct] = useState('all');
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  // Get unique products for filter
  const products = [...new Set(monthlyProductRevenue.map(item => item.product_name))];

  // Monthly revenue trend chart
  const monthlyTrendData = {
    labels: monthlyRevenue.map(item => {
      const date = new Date(item.month + '-01');
      return date.toLocaleDateString('en-CA', { year: 'numeric', month: 'short' });
    }),
    datasets: [
      {
        label: 'Monthly Revenue',
        data: monthlyRevenue.map(item => item.revenue),
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Product-wise monthly revenue (filtered)
  const getProductMonthlyData = () => {
    if (selectedProduct === 'all') {
      // Aggregate all products by month
      const monthlyTotals = {};
      monthlyProductRevenue.forEach(item => {
        if (!monthlyTotals[item.month]) {
          monthlyTotals[item.month] = 0;
        }
        monthlyTotals[item.month] += item.revenue;
      });

      return {
        labels: Object.keys(monthlyTotals).map(month => {
          const date = new Date(month + '-01');
          return date.toLocaleDateString('en-CA', { year: 'numeric', month: 'short' });
        }),
        datasets: [
          {
            label: 'All Products',
            data: Object.values(monthlyTotals),
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
          },
        ],
      };
    } else {
      // Filter by selected product
      const filteredData = monthlyProductRevenue.filter(item => item.product_name === selectedProduct);
      
      return {
        labels: filteredData.map(item => {
          const date = new Date(item.month + '-01');
          return date.toLocaleDateString('en-CA', { year: 'numeric', month: 'short' });
        }),
        datasets: [
          {
            label: selectedProduct,
            data: filteredData.map(item => item.revenue),
            backgroundColor: 'rgba(168, 85, 247, 0.8)',
            borderColor: 'rgba(168, 85, 247, 1)',
            borderWidth: 1,
          },
        ],
      };
    }
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Monthly Revenue Trend */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue Trend</h3>
        <div className="h-80">
          <Line data={monthlyTrendData} options={chartOptions} />
        </div>
      </div>

      {/* Product-wise Monthly Revenue */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Monthly Revenue by Product</h3>
          
          {/* Product Filter */}
          <div className="flex items-center space-x-2">
            <label htmlFor="product-filter" className="text-sm font-medium text-gray-700">
              Filter by Product:
            </label>
            <select
              id="product-filter"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Products</option>
              {products.map(product => (
                <option key={product} value={product}>{product}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="h-80">
          <Bar data={getProductMonthlyData()} options={chartOptions} />
        </div>
      </div>

      {/* Monthly Performance Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Monthly Performance Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Order Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Growth
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthlyRevenue.map((month, index) => {
                const previousMonth = monthlyRevenue[index - 1];
                const growth = previousMonth 
                  ? ((month.revenue - previousMonth.revenue) / previousMonth.revenue * 100)
                  : 0;
                
                return (
                  <tr key={month.month} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(month.month + '-01').toLocaleDateString('en-CA', { 
                        year: 'numeric', 
                        month: 'long' 
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(month.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {month.orders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(month.revenue / month.orders)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {index === 0 ? (
                        <span className="text-gray-500">-</span>
                      ) : (
                        <span className={`font-medium ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MonthlyAnalytics;