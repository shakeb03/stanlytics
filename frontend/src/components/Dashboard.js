import React, { useState } from 'react';
import {
Chart as ChartJS,
CategoryScale,
LinearScale,
BarElement,
Title,
Tooltip,
Legend,
ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import MonthlyAnalytics from './MonthlyAnalytics';
import ProductHeatmap from './ProductHeatmap';
import AIInsights from './AIInsights';
import RealtimeDashboard from './RealtimeDashboard';
import CustomerAnalytics from './CustomerAnalytics';

ChartJS.register(
CategoryScale,
LinearScale,
BarElement,
Title,
Tooltip,
Legend,
ArcElement
);

const Dashboard = ({ data, onReset }) => {
const [activeTab, setActiveTab] = useState('overview');


const TabButton = ({ id, label, icon, isActive, onClick, badge = null }) => (
<button
onClick={() => onClick(id)}
className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 relative ${
isActive
  ? 'bg-blue-100 text-blue-700 border border-blue-200'
  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
}`}
>
{icon}
<span className="ml-2">{label}</span>
{badge && (
<span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
  {badge}
</span>
)}
</button>
);
const formatCurrency = (amount) => {
return new Intl.NumberFormat('en-CA', {
style: 'currency',
currency: 'CAD',
}).format(amount);
};

const MetricCard = ({ title, value, icon, color = 'blue', subtitle = null }) => {
return (
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
<div className="flex items-center">
  <div className={`flex-shrink-0 p-3 rounded-lg bg-${color}-100`}>
    {icon}
  </div>
  <div className="ml-4 flex-1">
    <p className="text-sm font-medium text-gray-600">{title}</p>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    {subtitle && (
      <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
    )}
  </div>
</div>
</div>
);
};

// Prepare chart data
const productChartData = {
labels: data.product_breakdown.map(p => p.product_name),
datasets: [
{
label: 'Revenue',
data: data.product_breakdown.map(p => p.revenue),
backgroundColor: [
  'rgba(34, 197, 94, 0.8)',
  'rgba(59, 130, 246, 0.8)',
  'rgba(168, 85, 247, 0.8)',
  'rgba(245, 158, 11, 0.8)',
  'rgba(239, 68, 68, 0.8)',
],
borderColor: [
  'rgba(34, 197, 94, 1)',
  'rgba(59, 130, 246, 1)',
  'rgba(168, 85, 247, 1)',
  'rgba(245, 158, 11, 1)',
  'rgba(239, 68, 68, 1)',
],
borderWidth: 1,
},
],
};

const referralChartData = {
labels: data.referral_sources.map(r => r.source),
datasets: [
{
data: data.referral_sources.map(r => r.revenue),
backgroundColor: [
  'rgba(34, 197, 94, 0.8)',
  'rgba(59, 130, 246, 0.8)',
  'rgba(168, 85, 247, 0.8)',
  'rgba(245, 158, 11, 0.8)',
  'rgba(239, 68, 68, 0.8)',
],
borderColor: [
  'rgba(34, 197, 94, 1)',
  'rgba(59, 130, 246, 1)',
  'rgba(168, 85, 247, 1)',
  'rgba(245, 158, 11, 1)',
  'rgba(239, 68, 68, 1)',
],
borderWidth: 2,
},
],
};

const chartOptions = {
responsive: true,
plugins: {
legend: {
position: 'top',
},
title: {
display: false,
},
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

const doughnutOptions = {
responsive: true,
plugins: {
legend: {
position: 'bottom',
},
tooltip: {
callbacks: {
  label: function(context) {
    return `${context.label}: ${formatCurrency(context.raw)}`;
  }
}
}
},
};

return (
<div className="space-y-8">
{/* Header */}
<div className="flex items-center justify-between">
<div>
  <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
  <p className="text-gray-600 mt-1">Your Stan Store performance insights</p>
</div>

<button
  onClick={onReset}
  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
>
  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
  Upload New Files
</button>
</div>

{/* Navigation Tabs */}
<div className="border-b border-gray-200">
<div className="flex space-x-1 overflow-x-auto pb-2">
<TabButton
    id="overview"
    label="Overview"
    isActive={activeTab === 'overview'}
    onClick={setActiveTab}
    icon={
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    }
  />

<TabButton
    id="customers"
    label="Customer Intelligence"
    isActive={activeTab === 'customers'}
    onClick={setActiveTab}
    icon={
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    }
  />

<TabButton
    id="ai-insights"
    label="AI Insights"
    isActive={activeTab === 'ai-insights'}
    onClick={setActiveTab}
    icon={
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.636 6.364l-.707-.707M12 21v-1m6.364-1.636l-.707-.707M21 12h-1" />
      </svg>
    }
  />

  <TabButton
    id="realtime"
    label="Live Dashboard"
    isActive={activeTab === 'realtime'}
    onClick={setActiveTab}
    badge="LIVE"
    icon={
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    }
  />

  <TabButton
    id="monthly"
    label="Monthly Trends"
    isActive={activeTab === 'monthly'}
    onClick={setActiveTab}
    icon={
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    }
  />
  <TabButton
    id="heatmap"
    label="Sales Heatmap"
    isActive={activeTab === 'heatmap'}
    onClick={setActiveTab}
    icon={
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    }
  />
</div>
</div>

{/* Tab Content */}
{activeTab === 'realtime' && (
<RealtimeDashboard data={data} />
)}

{activeTab === 'ai-insights' && (
<AIInsights data={data} />
)}

{activeTab === 'customers' && (
<CustomerAnalytics data={data} />
)}

{activeTab === 'overview' && (
<div className="space-y-8">
  {/* Key Metrics */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <MetricCard
      title="Total Revenue"
      value={formatCurrency(data.total_revenue)}
      color="green"
      subtitle={`${data.total_orders} orders`}
      icon={
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      }
    />
    
    <MetricCard
      title="Net Profit"
      value={formatCurrency(data.net_profit)}
      color="blue"
      subtitle={`After all fees`}
      icon={
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      }
    />
    
    <MetricCard
      title="Total Fees"
      value={formatCurrency(data.stan_fees + data.stripe_fees)}
      color="yellow"
      subtitle={`Stan: ${formatCurrency(data.stan_fees)} | Stripe: ${formatCurrency(data.stripe_fees)}`}
      icon={
        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      }
    />
    
    <MetricCard
      title="Refunds"
      value={data.refund_count}
      color="red"
      subtitle={data.refund_amount > 0 ? formatCurrency(data.refund_amount) : 'No refunds'}
      icon={
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m5 14-5-2c-.9-.3-1.6-1-1.8-1.9L8 19H5l3-7 8-1 1.6 8c.1.8-.1 1.6-.8 2.1z" />
        </svg>
      }
    />
  </div>

  {/* Charts Section */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    {/* Product Revenue Chart */}
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Product</h3>
      <div className="h-80">
        <Bar data={productChartData} options={chartOptions} />
      </div>
    </div>

    {/* Referral Sources Chart */}
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Source</h3>
      <div className="h-80">
        <Doughnut data={referralChartData} options={doughnutOptions} />
      </div>
    </div>
  </div>

  {/* Product Details Table */}
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900">Product Performance</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Product
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Revenue
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Orders
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Quantity Sold
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Avg Order Value
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.product_breakdown.map((product, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {product.product_name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatCurrency(product.revenue)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {product.order_count}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {product.quantity_sold}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatCurrency(product.revenue / product.order_count)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>

  {/* Referral Sources Table */}
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900">Traffic Sources</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Source
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Revenue
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Orders
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Conversion Rate
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.referral_sources.map((source, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {source.source}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatCurrency(source.revenue)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {source.orders}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {((source.revenue / data.total_revenue) * 100).toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
</div>
)}

{activeTab === 'monthly' && (
<MonthlyAnalytics 
  monthlyRevenue={data.monthly_revenue}
  monthlyProductRevenue={data.monthly_product_revenue}
/>
)}

{activeTab === 'heatmap' && (
<ProductHeatmap 
  heatmapData={data.product_heatmap_data}
/>
)}
</div>
);

};

export default Dashboard;