import React, { useState, useEffect } from 'react';
import { Line, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const AIInsights = ({ data }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const InsightCard = ({ insight }) => {
    const bgColor = {
      success: 'bg-green-50 border-green-200',
      warning: 'bg-yellow-50 border-yellow-200', 
      info: 'bg-blue-50 border-blue-200',
      opportunity: 'bg-purple-50 border-purple-200'
    }[insight.type];

    const textColor = {
      success: 'text-green-800',
      warning: 'text-yellow-800',
      info: 'text-blue-800', 
      opportunity: 'text-purple-800'
    }[insight.type];

    return (
      <div className={`rounded-lg border-2 p-6 ${bgColor}`}>
        <div className="flex items-start space-x-3">
          <div className="text-2xl">{insight.icon}</div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className={`font-semibold ${textColor}`}>{insight.title}</h4>
              <div className="flex flex-col items-end">
                <span className="text-xs bg-white px-2 py-1 rounded-full text-gray-600 mb-1">
                  {insight.confidence}% confidence
                </span>
                <span className="text-xs text-gray-500 italic">
                  {insight.source}
                </span>
              </div>
            </div>
            <p className="text-gray-700 mb-3">{insight.message}</p>
            <div className={`text-sm font-medium ${textColor}`}>
              💡 ML Recommendation: {insight.action}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Prepare forecast chart data
  const forecastChartData = data.revenue_forecast && data.revenue_forecast.length > 0 ? {
    labels: [
      ...data.monthly_revenue.slice(-5).map(item => {
        const date = new Date(item.month + '-01');
        return date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
      }),
      ...data.revenue_forecast.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
      })
    ],
    datasets: [
      {
        label: 'Historical Revenue',
        data: [
          ...data.monthly_revenue.slice(-5).map(item => item.revenue / 30), // Convert to daily avg
          ...Array(data.revenue_forecast.length).fill(null)
        ],
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'ML Forecast',
        data: [
          ...Array(data.monthly_revenue.slice(-5).length - 1).fill(null),
          data.monthly_revenue.slice(-1)[0] ? data.monthly_revenue.slice(-1)[0].revenue / 30 : 0,
          ...data.revenue_forecast.map(item => item.predicted_revenue)
        ],
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderDash: [5, 5],
        tension: 0.4,
        fill: false,
      },
      {
        label: 'Confidence Interval',
        data: [
          ...Array(data.monthly_revenue.slice(-5).length - 1).fill(null),
          data.monthly_revenue.slice(-1)[0] ? data.monthly_revenue.slice(-1)[0].revenue / 30 : 0,
          ...data.revenue_forecast.map(item => item.confidence_upper)
        ],
        borderColor: 'rgba(156, 163, 175, 0.5)',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        borderDash: [2, 2],
        tension: 0.4,
        fill: false,
        pointRadius: 0,
      }
    ]
  } : null;

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
      {/* AI Header with Model Performance */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">⚡</div>
            <div>
              <h2 className="text-2xl font-bold">Smart Caching ML Analytics</h2>
              <p className="text-blue-100">
                processed in {data.model_metrics?.total_ml_processing_time || 'N/A'}s
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-100 mb-1">Processing Speed</div>
            <div className="text-2xl font-bold">
              {(data.model_metrics?.total_ml_processing_time || 0) < 2 ? '⚡ Ultra Fast' : '🚀 Fast'}
            </div>
            <div className="text-sm text-blue-100">
              {((data.model_metrics?.total_ml_processing_time || 0) * 1000).toFixed(0)}ms total
            </div>
          </div>
        </div>
        
        {/* Performance Indicators */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white bg-opacity-20 rounded-lg p-3">
            <div className="text-sm text-blue-100">Forecasting</div>
            <div className="font-bold">
              {data.model_metrics?.forecast_performance?.processing_time_seconds 
                ? `${(data.model_metrics.forecast_performance.processing_time_seconds * 1000).toFixed(0)}ms`
                : 'N/A'}
            </div>
            <div className="text-xs text-blue-200">
              {data.model_metrics?.forecast_performance?.method === 'cached_model' ? '✅ Cached' : '🔄 Trained'}
            </div>
          </div>
          
          <div className="bg-white bg-opacity-20 rounded-lg p-3">
            <div className="text-sm text-blue-100">Anomaly Detection</div>
            <div className="font-bold">
              {data.model_metrics?.anomaly_detection_performance?.processing_time_seconds 
                ? `${(data.model_metrics.anomaly_detection_performance.processing_time_seconds * 1000).toFixed(0)}ms`
                : 'N/A'}
            </div>
            <div className="text-xs text-blue-200">
              {data.model_metrics?.anomaly_detection_performance?.cache_hit ? '✅ Cached' : '🔄 Trained'}
            </div>
          </div>
          
          <div className="bg-white bg-opacity-20 rounded-lg p-3">
            <div className="text-sm text-blue-100">Customer Segmentation</div>
            <div className="font-bold">
              {data.model_metrics?.customer_segmentation_performance?.processing_time_seconds 
                ? `${(data.model_metrics.customer_segmentation_performance.processing_time_seconds * 1000).toFixed(0)}ms`
                : 'N/A'}
            </div>
            <div className="text-xs text-blue-200">
              {data.model_metrics?.customer_segmentation_performance?.cache_hit ? '✅ Cached' : '🔄 Trained'}
            </div>
          </div>
        </div>
      </div>

      {/* Smart Caching Advantages */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Smart Caching Architecture</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Traditional ML Training</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Processing Time:</span>
                <span className="text-red-600 font-medium">15-30 seconds</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Memory Usage:</span>
                <span className="text-red-600 font-medium">High (600MB+)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Data Required:</span>
                <span className="text-red-600 font-medium">50+ samples</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Scalability:</span>
                <span className="text-red-600 font-medium">Poor</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Smart Caching ML</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Processing Time:</span>
                <span className="text-green-600 font-medium">&lt; 1s (cached) | &lt; 3s (new)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Memory Usage:</span>
                <span className="text-green-600 font-medium">Low (30-50MB)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Data Required:</span>
                <span className="text-green-600 font-medium">5+ samples</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Scalability:</span>
                <span className="text-green-600 font-medium">Excellent</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm font-medium text-blue-800">
            ⚡ 15x faster processing • 🎯 100% real data • 🧠 No synthetic data risk • 📱 Mobile-ready
          </div>
        </div> */}
      </div>

      {/* ML Model Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.model_metrics?.forecast_performance && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">🎯 Revenue Forecasting</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Method:</span>
                <span className="font-medium text-sm">
                  {data.model_metrics.forecast_performance.method === 'cached_model' ? 'Cached Model' : 'Lightweight RF'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Cache Hit:</span>
                <span className="font-medium text-sm">
                  {data.model_metrics.forecast_performance.cache_hit ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Training Samples:</span>
                <span className="font-medium text-sm">
                  {data.model_metrics.forecast_performance.training_samples || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}

        {data.model_metrics?.anomaly_detection_performance && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">🚨 Anomaly Detection</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Method:</span>
                <span className="font-medium text-sm">
                  {data.model_metrics.anomaly_detection_performance.cache_hit ? 'Cached Model' : 'Isolation Forest'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Anomalies Found:</span>
                <span className="font-medium text-sm">
                  {data.model_metrics.anomaly_detection_performance.anomalies_detected || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Data Points:</span>
                <span className="font-medium text-sm">
                  {data.model_metrics.anomaly_detection_performance.data_points_analyzed || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}

        {data.model_metrics?.customer_segmentation_performance && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">👥 Customer Segmentation</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Method:</span>
                <span className="font-medium text-sm">
                  {data.model_metrics.customer_segmentation_performance.cache_hit ? 'Cached K-Means' : 'MiniBatch K-Means'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Segments:</span>
                <span className="font-medium text-sm">
                  {data.model_metrics.customer_segmentation_performance.segments_created || 
                   data.model_metrics.customer_segmentation_performance.segments_found || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Customers:</span>
                <span className="font-medium text-sm">
                  {data.model_metrics.customer_segmentation_performance.customers_analyzed || 
                   data.model_metrics.customer_segmentation_performance.customers_segmented || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Revenue Forecast Chart */}
      {forecastChartData && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">🔮 Revenue Forecast</h3>
            <p className="text-sm text-gray-600">
              {data.model_metrics?.forecast_performance?.cache_hit 
                ? 'Using cached model trained on your data patterns' 
                : `Lightweight RandomForest trained on ${data.model_metrics?.forecast_performance?.training_samples || 'your'} data points`}
            </p>
          </div>
          
          <div className="h-80 mb-4">
            <Line data={forecastChartData} options={chartOptions} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.revenue_forecast.slice(0, 4).map((forecast, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">
                  {new Date(forecast.date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {formatCurrency(forecast.predicted_revenue)}
                </div>
                <div className="text-xs text-gray-500">
                  ±{formatCurrency(forecast.confidence_interval)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real ML Insights */}
      {data.ml_insights?.insights && data.ml_insights.insights.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data.ml_insights.insights.map((insight, index) => (
            <InsightCard key={index} insight={insight} />
          ))}
        </div>
      )}

      {/* Anomalies Detected */}
      {data.anomalies && data.anomalies.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Anomalies Detected</h3>
          <div className="space-y-3">
            {data.anomalies.slice(0, 5).map((anomaly, index) => (
              <div key={index} className={`p-4 rounded-lg border-l-4 ${
                anomaly.severity === 'high' ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">
                    {anomaly.anomaly_type.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    anomaly.severity === 'high' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                  }`}>
                    {anomaly.severity} severity
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Date: {anomaly.date} | Revenue: {formatCurrency(anomaly.revenue)} | Orders: {anomaly.orders}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Anomaly Score: {anomaly.anomaly_score.toFixed(3)} (Isolation Forest on your data)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Quality & Processing Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Processing Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Data Processing</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Processing Method:</span>
                <span className="font-medium text-green-600">
                  {data.ml_insights?.processing_method === 'smart_caching_real_data_only' ? 'Smart Caching' : 'Real-time'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Data Quality Score:</span>
                <span className="font-medium">
                  {data.ml_insights?.data_quality_score ? `${data.ml_insights.data_quality_score.toFixed(0)}%` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ML Confidence:</span>
                <span className="font-medium">
                  {data.ml_insights?.ml_confidence_avg ? `${data.ml_insights.ml_confidence_avg.toFixed(0)}%` : 'N/A'}
                </span>
              </div>
            </div>
          </div>
          
          {/* <div>
            <h4 className="font-medium text-gray-900 mb-3">Architecture Benefits</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                <span>100% real data training</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                <span>No synthetic data risk</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                <span>Smart model caching</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                <span>Production-ready scalability</span>
              </div>
            </div>
          </div> */}
        </div>
      </div>

      {/* AI Action Plan */}
      {data.ml_insights?.insights && data.ml_insights.insights.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 ML-Generated Action Plan</h3>
          <div className="space-y-3">
            {data.ml_insights.insights.slice(0, 3).map((insight, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 mb-1">{insight.title}</div>
                  <div className="text-sm text-gray-700">{insight.action}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Confidence: {insight.confidence}% | Source: {insight.source}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {data.ml_insights.insights.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🤖</div>
              <p>ML models are analyzing your data...</p>
              <p className="text-sm">Upload more sales data to get deeper insights.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIInsights;