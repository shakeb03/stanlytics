import React, { useState, useMemo } from 'react';
import { Bar, Scatter, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const CustomerAnalytics = ({ data }) => {
  const [selectedSegment, setSelectedSegment] = useState('all');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  // Advanced customer segmentation analysis
  const customerAnalysis = useMemo(() => {
    console.log('Running customer analysis...');
    console.log('Data:', data);
    // Simulate customer-level data from order data
    const customers = {};

    // Extract unique customers and their behavior

    if (data?.order_breakdown?.forEach) {
      data.order_breakdown.forEach(order => {
        // product.orders.forEach(order => {
        const customerId = order.customer_id; // Use customer ID from the CSV file
        const orderValue = order.revenue / order.order_count; // Assuming total_value is in the order data
        const frequency = 1; // Each order represents one purchase

        if (!customers[customerId]) {
          customers[customerId] = {
            id: customerId,
            totalSpent: 0,
            orderCount: 0,
            firstPurchase: new Date(order.date),
            lastPurchase: new Date(order.date),
            // favoriteProduct: product.product_name,
            location: order.location || 'Unknown' // Use location if available
          };
        }

        customers[customerId].totalSpent += orderValue;
        customers[customerId].orderCount += frequency;
        customers[customerId].lastPurchase = new Date(order.date); // Update last purchase date
        // });
      });
    }

    const customerList = Object.values(customers);

    // RFM Analysis (Recency, Frequency, Monetary)
    const now = new Date();
    const rfmData = customerList.map(customer => {
      const recency = Math.floor((now - customer.lastPurchase) / (24 * 60 * 60 * 1000));
      const frequency = customer.orderCount;
      const monetary = customer.totalSpent;

      return {
        ...customer,
        recency,
        frequency,
        monetary,
        recencyScore: recency <= 30 ? 5 : recency <= 60 ? 4 : recency <= 90 ? 3 : recency <= 180 ? 2 : 1,
        frequencyScore: frequency >= 5 ? 5 : frequency >= 4 ? 4 : frequency >= 3 ? 3 : frequency >= 2 ? 2 : 1,
        monetaryScore: monetary >= 200 ? 5 : monetary >= 100 ? 4 : monetary >= 75 ? 3 : monetary >= 50 ? 2 : 1
      };
    });

    // Customer Lifetime Value calculation
    const avgOrderValue = data.total_revenue / data.total_orders;
    const avgOrderFrequency = 2.3; // Estimated annual frequency
    const avgCustomerLifespan = 2.5; // Estimated years

    // Segment customers
    const champions = rfmData.filter(c => c.recencyScore >= 4 && c.frequencyScore >= 4 && c.monetaryScore >= 4);
    const loyalCustomers = rfmData.filter(c => c.recencyScore >= 3 && c.frequencyScore >= 3 && c.monetaryScore >= 3 && !champions.includes(c));
    const potentialLoyalists = rfmData.filter(c => c.recencyScore >= 4 && c.frequencyScore <= 2 && c.monetaryScore >= 3);
    const atRisk = rfmData.filter(c => c.recencyScore <= 2 && c.frequencyScore >= 3 && c.monetaryScore >= 3);
    const cannotLoseThem = rfmData.filter(c => c.recencyScore <= 2 && c.frequencyScore >= 4 && c.monetaryScore >= 5);
    const hibernating = rfmData.filter(c => c.recencyScore <= 2 && c.frequencyScore <= 2 && c.monetaryScore <= 2);

    const segments = {
      champions,
      loyalCustomers,
      potentialLoyalists,
      atRisk,
      cannotLoseThem,
      hibernating
    };

    return {
      customers: customerList,
      rfmData,
      segments,
      avgOrderValue,
      avgCustomerLifespan,
      estimatedCLV: avgOrderValue * avgOrderFrequency * avgCustomerLifespan
    };
  }, [data]);

  // Customer segment distribution chart
  const segmentData = {
    labels: ['Champions', 'Loyal Customers', 'Potential Loyalists', 'At Risk', 'Cannot Lose', 'Hibernating'],
    datasets: [{
      data: [
        customerAnalysis.segments.champions?.length || 0,
        customerAnalysis.segments.loyalCustomers?.length || 0,
        customerAnalysis.segments.potentialLoyalists?.length || 0,
        customerAnalysis.segments.atRisk?.length || 0,
        customerAnalysis.segments.cannotLoseThem?.length || 0,
        customerAnalysis.segments.hibernating?.length || 0
      ],
      backgroundColor: [
        '#10B981', // Champions - Green
        '#3B82F6', // Loyal - Blue  
        '#8B5CF6', // Potential - Purple
        '#F59E0B', // At Risk - Yellow
        '#EF4444', // Cannot Lose - Red
        '#6B7280'  // Hibernating - Gray
      ],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };

  // Customer value distribution
  const valueDistributionData = {
    labels: ['$0-25', '$25-50', '$50-100', '$100-200', '$200+'],
    datasets: [{
      label: 'Number of Customers',
      data: [
        customerAnalysis.customers.filter(c => c.totalSpent < 25).length,
        customerAnalysis.customers.filter(c => c.totalSpent >= 25 && c.totalSpent < 50).length,
        customerAnalysis.customers.filter(c => c.totalSpent >= 50 && c.totalSpent < 100).length,
        customerAnalysis.customers.filter(c => c.totalSpent >= 100 && c.totalSpent < 200).length,
        customerAnalysis.customers.filter(c => c.totalSpent >= 200).length,
      ],
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1
    }]
  };

  // RFM Scatter plot data
  const rfmScatterData = {
    datasets: [{
      label: 'Customer RFM Analysis',
      data: customerAnalysis.rfmData.map(customer => ({
        x: customer.frequency,
        y: customer.monetary,
        r: Math.max(5, (6 - customer.recencyScore) * 3) // Size based on recency
      })),
      backgroundColor: 'rgba(168, 85, 247, 0.6)',
      borderColor: 'rgba(168, 85, 247, 1)',
      borderWidth: 1
    }]
  };

  const SegmentCard = ({ title, count, percentage, color, description, actionItems }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-4 h-4 rounded-full bg-${color}`}></div>
        <span className="text-sm text-gray-500">{percentage.toFixed(1)}%</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mb-2">{count} customers</p>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-900">Recommended Actions:</h4>
        {actionItems.map((action, index) => (
          <div key={index} className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-xs text-gray-600">{action}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      }
    }
  };

  const scatterOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Frequency: ${context.parsed.x}, Monetary: ${formatCurrency(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Purchase Frequency'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Total Spent'
        },
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
            const percentage = ((context.raw / customerAnalysis.customers.length) * 100).toFixed(1);
            return `${context.label}: ${context.raw} customers (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Customer Analytics Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">Customer Intelligence</h2>
            <p className="text-purple-100">Advanced behavioral analytics</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{customerAnalysis.customers.length}</div>
            <div className="text-purple-100">Total Customers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{formatCurrency(customerAnalysis.avgOrderValue)}</div>
            <div className="text-purple-100">Avg Order Value</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{formatCurrency(customerAnalysis.estimatedCLV)}</div>
            <div className="text-purple-100">Est. Customer LTV</div>
          </div>
        </div>
      </div>

      {/* Customer Segments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SegmentCard
          title="Champions"
          count={customerAnalysis.segments.champions?.length || 0}
          percentage={((customerAnalysis.segments.champions?.length || 0) / customerAnalysis.customers.length) * 100}
          color="green-500"
          description="Your best customers who buy often and recently."
          actionItems={[
            "Reward them with exclusive early access",
            "Ask for reviews and referrals", 
            "Upsell premium products"
          ]}
        />
        
        <SegmentCard
          title="Loyal Customers"
          count={customerAnalysis.segments.loyalCustomers?.length || 0}
          percentage={((customerAnalysis.segments.loyalCustomers?.length || 0) / customerAnalysis.customers.length) * 100}
          color="blue-500"
          description="Regular customers with good purchase history."
          actionItems={[
            "Create loyalty program benefits",
            "Recommend related products",
            "Send personalized offers"
          ]}
        />
        
        <SegmentCard
          title="At Risk"
          count={customerAnalysis.segments.atRisk?.length || 0}
          percentage={((customerAnalysis.segments.atRisk?.length || 0) / customerAnalysis.customers.length) * 100}
          color="yellow-500"
          description="High-value customers who haven't purchased recently."
          actionItems={[
            "Send win-back campaigns",
            "Offer special discounts",
            "Ask for feedback"
          ]}
        />
        
        <SegmentCard
          title="Cannot Lose Them"
          count={customerAnalysis.segments.cannotLoseThem?.length || 0}
          percentage={((customerAnalysis.segments.cannotLoseThem?.length || 0) / customerAnalysis.customers.length) * 100}
          color="red-500"
          description="High-value customers at risk of churning."
          actionItems={[
            "Urgent personal outreach",
            "Exclusive VIP treatment",
            "Address any issues immediately"
          ]}
        />
        
        <SegmentCard
          title="Potential Loyalists"
          count={customerAnalysis.segments.potentialLoyalists?.length || 0}
          percentage={((customerAnalysis.segments.potentialLoyalists?.length || 0) / customerAnalysis.customers.length) * 100}
          color="purple-500"
          description="Recent customers with high potential."
          actionItems={[
            "Nurture with engaging content",
            "Offer membership programs",
            "Encourage repeat purchases"
          ]}
        />
        
        <SegmentCard
          title="Hibernating"
          count={customerAnalysis.segments.hibernating?.length || 0}
          percentage={((customerAnalysis.segments.hibernating?.length || 0) / customerAnalysis.customers.length) * 100}
          color="gray-500"
          description="Inactive customers with low engagement."
          actionItems={[
            "Re-engagement campaigns",
            "Survey for preferences",
            "Offer comeback incentives"
          ]}
        />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Customer Segment Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Segment Distribution</h3>
          <div className="h-80">
            <Doughnut data={segmentData} options={doughnutOptions} />
          </div>
        </div>

        {/* Customer Value Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Value Distribution</h3>
          <div className="h-80">
            <Bar data={valueDistributionData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* RFM Analysis */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">RFM Analysis - Customer Behavior Map</h3>
        <p className="text-sm text-gray-600 mb-4">
          Each bubble represents customer frequency vs monetary value. Bubble size indicates recency of purchase.
        </p>
        <div className="h-96">
          <Scatter data={rfmScatterData} options={scatterOptions} />
        </div>
      </div>

      {/* Customer Insights Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Strategic Customer Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">🏆 Opportunities</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• {((customerAnalysis.segments.potentialLoyalists?.length || 0) / customerAnalysis.customers.length * 100).toFixed(1)}% of customers show loyalty potential</li>
                <li>• Average CLV of {formatCurrency(customerAnalysis.estimatedCLV)} indicates strong unit economics</li>
                <li>• Champions segment drives {(((customerAnalysis.segments.champions?.length || 0) * customerAnalysis.avgOrderValue * 3) / data.total_revenue * 100).toFixed(1)}% of revenue</li>
              </ul>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">⚠️ Risks to Address</h4>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• {((customerAnalysis.segments.atRisk?.length || 0) / customerAnalysis.customers.length * 100).toFixed(1)}% of customers are at risk of churning</li>
                <li>• {((customerAnalysis.segments.hibernating?.length || 0) / customerAnalysis.customers.length * 100).toFixed(1)}% of customers are inactive</li>
                <li>• High-value customers need immediate attention</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerAnalytics;