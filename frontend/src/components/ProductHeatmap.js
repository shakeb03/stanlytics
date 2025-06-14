import React, { useState, useMemo } from 'react';

const ProductHeatmap = ({ heatmapData }) => {
  const [selectedProduct, setSelectedProduct] = useState('all');
  
  // Days of the week in order
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Hours of the day (0-23)
  const hoursOfDay = Array.from({ length: 24 }, (_, i) => i);
  
  // Get unique products
  const products = [...new Set(heatmapData.map(item => item.product_name))];
  
  // Process heatmap data
  const processedData = useMemo(() => {
    let filteredData = heatmapData;
    
    if (selectedProduct !== 'all') {
      filteredData = heatmapData.filter(item => item.product_name === selectedProduct);
    }
    
    // Create a matrix for the heatmap
    const matrix = {};
    let maxIntensity = 0;
    
    // Initialize matrix
    daysOfWeek.forEach(day => {
      matrix[day] = {};
      hoursOfDay.forEach(hour => {
        matrix[day][hour] = 0;
      });
    });
    
    // Fill matrix with data
    filteredData.forEach(item => {
      if (matrix[item.day_of_week] && matrix[item.day_of_week][item.hour] !== undefined) {
        matrix[item.day_of_week][item.hour] += item.intensity;
        maxIntensity = Math.max(maxIntensity, matrix[item.day_of_week][item.hour]);
      }
    });
    
    return { matrix, maxIntensity };
  }, [heatmapData, selectedProduct]);
  
  // Get color intensity based on value
  const getHeatmapColor = (value, maxValue) => {
    if (value === 0) return 'bg-gray-50';
    
    const intensity = value / maxValue;
    
    if (intensity >= 0.8) return 'bg-red-500 text-white';
    if (intensity >= 0.6) return 'bg-red-400 text-white';
    if (intensity >= 0.4) return 'bg-yellow-400 text-gray-900';
    if (intensity >= 0.2) return 'bg-yellow-200 text-gray-900';
    return 'bg-green-100 text-gray-700';
  };
  
  // Format hour for display
  const formatHour = (hour) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };
  
  // Get insights from the data
  const getInsights = () => {
    let filteredData = heatmapData;
    if (selectedProduct !== 'all') {
      filteredData = heatmapData.filter(item => item.product_name === selectedProduct);
    }
    
    // Find peak hours and days
    const hourTotals = {};
    const dayTotals = {};
    
    filteredData.forEach(item => {
      hourTotals[item.hour] = (hourTotals[item.hour] || 0) + item.intensity;
      dayTotals[item.day_of_week] = (dayTotals[item.day_of_week] || 0) + item.intensity;
    });
    
    const peakHour = Object.keys(hourTotals).reduce((a, b) => 
      hourTotals[a] > hourTotals[b] ? a : b
    );
    
    const peakDay = Object.keys(dayTotals).reduce((a, b) => 
      dayTotals[a] > dayTotals[b] ? a : b
    );
    
    return { peakHour: formatHour(parseInt(peakHour)), peakDay };
  };
  
  const insights = getInsights();

  return (
    <div className="space-y-6">
      {/* Header with Product Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Sales Heatmap</h3>
            <p className="text-sm text-gray-600">Hottest selling times by hour and day of week</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <label htmlFor="heatmap-product-filter" className="text-sm font-medium text-gray-700">
              Product:
            </label>
            <select
              id="heatmap-product-filter"
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
        
        {/* Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900">Peak Hour</p>
                <p className="text-lg font-bold text-blue-700">{insights.peakHour}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-green-900">Peak Day</p>
                <p className="text-lg font-bold text-green-700">{insights.peakDay}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Heatmap Grid */}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="grid gap-1 text-xs" style={{ gridTemplateColumns: 'auto repeat(24, 1fr)' }}>
              {/* Header - Hours */}
              <div className=""></div>
              {hoursOfDay.map(hour => (
                <div key={hour} className="text-center font-medium text-gray-600 p-1">
                  {hour % 4 === 0 ? formatHour(hour).split(' ')[0] : ''}
                </div>
              ))}
              
              {/* Heatmap Cells */}
              {daysOfWeek.map(day => (
                <React.Fragment key={day}>
                  {/* Day Label */}
                  <div className="text-right font-medium text-gray-600 p-2 pr-3">
                    {day.substring(0, 3)}
                  </div>
                  
                  {/* Hour Cells */}
                  {hoursOfDay.map(hour => {
                    const value = processedData.matrix[day][hour];
                    const colorClass = getHeatmapColor(value, processedData.maxIntensity);
                    
                    return (
                      <div
                        key={`${day}-${hour}`}
                        className={`aspect-square flex items-center justify-center rounded text-xs font-medium border border-gray-200 ${colorClass} hover:scale-110 transition-transform duration-200 cursor-pointer`}
                        title={`${day} ${formatHour(hour)}: ${value} orders`}
                      >
                        {value > 0 ? value : ''}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
            
            {/* Legend */}
            <div className="mt-4 flex items-center justify-center space-x-4">
              <span className="text-xs text-gray-600">Less</span>
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-gray-50 border border-gray-200 rounded"></div>
                <div className="w-3 h-3 bg-green-100 border border-gray-200 rounded"></div>
                <div className="w-3 h-3 bg-yellow-200 border border-gray-200 rounded"></div>
                <div className="w-3 h-3 bg-yellow-400 border border-gray-200 rounded"></div>
                <div className="w-3 h-3 bg-red-400 border border-gray-200 rounded"></div>
                <div className="w-3 h-3 bg-red-500 border border-gray-200 rounded"></div>
              </div>
              <span className="text-xs text-gray-600">More</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Time-based Performance Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Peak Performance Times</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <td className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Period
                </td>
                <td className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Orders
                </td>
                <td className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Peak Day
                </td>
                <td className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </td>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[
                { period: 'Morning (6 AM - 12 PM)', start: 6, end: 11 },
                { period: 'Afternoon (12 PM - 6 PM)', start: 12, end: 17 },
                { period: 'Evening (6 PM - 12 AM)', start: 18, end: 23 },
                { period: 'Night (12 AM - 6 AM)', start: 0, end: 5 },
              ].map(timeSlot => {
                let filteredData = heatmapData;
                if (selectedProduct !== 'all') {
                  filteredData = heatmapData.filter(item => item.product_name === selectedProduct);
                }
                
                const periodData = filteredData.filter(item => 
                  item.hour >= timeSlot.start && item.hour <= timeSlot.end
                );
                
                const totalOrders = periodData.reduce((sum, item) => sum + item.intensity, 0);
                
                // Find peak day for this time period
                const dayTotals = {};
                periodData.forEach(item => {
                  dayTotals[item.day_of_week] = (dayTotals[item.day_of_week] || 0) + item.intensity;
                });
                
                const peakDayForPeriod = Object.keys(dayTotals).length > 0 
                  ? Object.keys(dayTotals).reduce((a, b) => dayTotals[a] > dayTotals[b] ? a : b)
                  : 'N/A';
                
                const performance = totalOrders > 0 ? (totalOrders / Math.max(...Object.values(processedData.matrix).map(day => Object.values(day).reduce((a, b) => a + b, 0))) * 100) : 0;
                
                return (
                  <tr key={timeSlot.period} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {timeSlot.period}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {totalOrders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {peakDayForPeriod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(performance, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{performance.toFixed(1)}%</span>
                      </div>
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

export default ProductHeatmap;