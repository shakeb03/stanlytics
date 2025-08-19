from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import io
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import uvicorn
from pydantic import BaseModel
from smart_ml_engine import SmartCachingMLEngine
import time
from csv_mapper import FlexibleCSVMapper

app = FastAPI(title="Stanlytics API", version="1.0.0")

# Initialize Smart Caching ML Engine (loads instantly, no synthetic data!)
ml_engine = SmartCachingMLEngine()

# Initialize the flexible CSV mapper
csv_mapper = FlexibleCSVMapper()

# CORS setup for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://stanlytics.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyticsResponse(BaseModel):
    total_revenue: float
    net_profit: float
    stan_fees: float
    stripe_fees: float
    refund_count: int
    refund_amount: float
    total_orders: int
    product_breakdown: List[Dict[str, Any]]
    monthly_revenue: List[Dict[str, Any]]
    monthly_product_revenue: List[Dict[str, Any]]
    product_heatmap_data: List[Dict[str, Any]]
    referral_sources: List[Dict[str, Any]]
    ml_insights: Dict[str, Any]
    revenue_forecast: List[Dict[str, Any]]
    anomalies: List[Dict[str, Any]]
    customer_segments: List[Dict[str, Any]]
    model_metrics: Dict[str, Any]
    order_breakdown: List[Dict[str, Any]]
    csv_metadata: Optional[Dict[str, Any]] = None

def parse_stan_csv(file_content: str) -> pd.DataFrame:
    """Parse Stan Store CSV data"""
    try:
        # Read CSV content
        df = pd.read_csv(io.StringIO(file_content))
        
        # Clean column names (remove quotes and whitespace)
        df.columns = df.columns.str.strip().str.replace('"', '')
        
        # Convert numeric columns
        numeric_columns = ['Product Price', 'Quantity', 'Subtotal', 'Discount Amount', 'Tax Amount', 'Total Amount']
        for col in numeric_columns:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
        
        # Parse dates
        if 'Date' in df.columns:
            df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
            
        return df
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing Stan CSV: {str(e)}")

def parse_csv_flexible(file_content: str) -> Tuple[pd.DataFrame, Dict[str, any]]:
    """Parse any CSV file with automatic header mapping"""
    return csv_mapper.process_csv(file_content)

def calculate_analytics(stan_df: pd.DataFrame, stripe_df: Optional[pd.DataFrame] = None) -> Dict[str, Any]:
    """Calculate comprehensive analytics from the data using real ML models"""
    
    # Basic revenue calculations from Stan data using standardized field names
    total_revenue = stan_df['total_amount'].sum()
    total_orders = len(stan_df)

    order_level_breakdown = []

    for _, row in stan_df.iterrows():
        order_level_breakdown.append({
            'product_name': row['product_name'],
            'revenue': float(row['total_amount']),
            'quantity_sold': int(row['quantity']) if 'quantity' in row and pd.notna(row['quantity']) else 1,
            'order_id': row['order_id'],
            'customer_id': row['customer_id']
        })
    
    # Product breakdown
    product_breakdown = []
    agg_dict = {
        'total_amount': 'sum',
        'order_id': 'count'
    }
    if 'quantity' in stan_df.columns:
        agg_dict['quantity'] = 'sum'
    
    product_stats = stan_df.groupby('product_name').agg(agg_dict).reset_index()
    
    for _, row in product_stats.iterrows():
        product_breakdown.append({
            'product_name': row['product_name'],
            'revenue': float(row['total_amount']),
            'quantity_sold': int(row['quantity']) if 'quantity' in row and pd.notna(row['quantity']) else 0,
            'order_count': int(row['order_id'])
        })
    
    # Monthly revenue breakdown
    monthly_revenue = []
    if 'date' in stan_df.columns and stan_df['date'].dtype == 'datetime64[ns]':
        monthly_stats = stan_df.groupby(stan_df['date'].dt.to_period('M')).agg({
            'total_amount': 'sum',
            'order_id': 'count'
        }).reset_index()
        
        for _, row in monthly_stats.iterrows():
            monthly_revenue.append({
                'month': str(row['date']),
                'revenue': float(row['total_amount']),
                'orders': int(row['order_id'])
            })
    
    # Monthly product-wise revenue breakdown
    monthly_product_revenue = []
    if 'date' in stan_df.columns and stan_df['date'].dtype == 'datetime64[ns]':
        agg_dict = {
            'total_amount': 'sum',
            'order_id': 'count'
        }
        if 'quantity' in stan_df.columns:
            agg_dict['quantity'] = 'sum'
        
        monthly_product_stats = stan_df.groupby([
            stan_df['date'].dt.to_period('M'), 
            'product_name'
        ]).agg(agg_dict).reset_index()
        
        for _, row in monthly_product_stats.iterrows():
            monthly_product_revenue.append({
                'month': str(row['date']),
                'product_name': row['product_name'],
                'revenue': float(row['total_amount']),
                'quantity': int(row['quantity']) if 'quantity' in row and pd.notna(row['quantity']) else 0,
                'orders': int(row['order_id'])
            })
    
    # Product heatmap data (hour of day vs day of week)
    product_heatmap_data = []
    if 'date' in stan_df.columns and 'time' in stan_df.columns:
        # Only create DateTime if date parsing was successful and no NaT values
        if stan_df['date'].dtype == 'datetime64[ns]' and not stan_df['date'].isna().all():
            stan_df['DateTime'] = pd.to_datetime(stan_df['date'].astype(str) + ' ' + stan_df['time'].astype(str))
            stan_df['Hour'] = stan_df['DateTime'].dt.hour
            stan_df['DayOfWeek'] = stan_df['DateTime'].dt.day_name()
            
            heatmap_stats = stan_df.groupby(['product_name', 'Hour', 'DayOfWeek']).agg({
                'total_amount': 'sum',
                'order_id': 'count'
            }).reset_index()
        else:
            # Skip heatmap if date parsing failed
            heatmap_stats = pd.DataFrame()
        
        for _, row in heatmap_stats.iterrows():
            product_heatmap_data.append({
                'product_name': row['product_name'],
                'hour': int(row['Hour']),
                'day_of_week': row['DayOfWeek'],
                'revenue': float(row['total_amount']),
                'order_count': int(row['order_id']),
                'intensity': float(row['order_id'])
            })
    
    # Referral source breakdown
    referral_sources = []
    if 'referral_source' in stan_df.columns:
        referral_stats = stan_df.groupby('referral_source').agg({
            'total_amount': 'sum',
            'order_id': 'count'
        }).reset_index()
        
        for _, row in referral_stats.iterrows():
            referral_sources.append({
                'source': row['referral_source'],
                'revenue': float(row['total_amount']),
                'orders': int(row['order_id'])
            })
    
    # Initialize default values
    stripe_fees = 0.0
    net_profit = total_revenue
    refund_count = 0
    refund_amount = 0.0
    
    # Enhanced calculations if Stripe data is available
    if stripe_df is not None and not stripe_df.empty:
        stripe_fees = stripe_df['fee'].sum()
        refund_count = len(stripe_df[stripe_df['amount_refunded'] > 0])
        refund_amount = stripe_df['amount_refunded'].sum()
        net_from_stripe = stripe_df['net'].sum()
        net_profit = net_from_stripe - refund_amount
    
    # Estimate Stan Store fees
    stan_fees = 0.0
    net_profit = net_profit - stan_fees
    
    # ===================
    # FAST PRE-TRAINED ML MODELS
    # ===================
    
    ml_start_time = time.time()
    
    # 1. Quick Revenue Forecasting (< 1 second)
    revenue_forecast, forecast_metrics = ml_engine.quick_revenue_forecast(stan_df, periods=7)
    
    # 2. Fast Anomaly Detection (< 0.5 seconds)
    anomalies, anomaly_metrics = ml_engine.quick_anomaly_detection(stan_df)
    
    # 3. Rapid Customer Segmentation (< 1 second)
    customer_segments, segmentation_metrics = ml_engine.quick_customer_segmentation(stan_df)
    
    ml_processing_time = time.time() - ml_start_time
    
    # 4. Generate ML-powered insights
    ml_insights = generate_smart_ml_insights(stan_df, anomalies, customer_segments, revenue_forecast)
    
    # 5. Model performance metrics
    model_metrics = ml_engine.get_performance_metrics()
    model_metrics.update({
        "total_ml_processing_time": round(ml_processing_time, 3),
        "forecast_performance": forecast_metrics,
        "anomaly_detection_performance": anomaly_metrics,
        "customer_segmentation_performance": segmentation_metrics
    })
    
    return {
        'total_revenue': round(total_revenue, 2),
        'net_profit': round(net_profit, 2),
        'stan_fees': round(stan_fees, 2),
        'stripe_fees': round(stripe_fees, 2),
        'refund_count': refund_count,
        'refund_amount': round(refund_amount, 2),
        'total_orders': total_orders,
        'product_breakdown': sorted(product_breakdown, key=lambda x: x['revenue'], reverse=True),
        'monthly_revenue': sorted(monthly_revenue, key=lambda x: x['month']),
        'monthly_product_revenue': sorted(monthly_product_revenue, key=lambda x: (x['month'], x['revenue']), reverse=True),
        'product_heatmap_data': product_heatmap_data,
        'referral_sources': sorted(referral_sources, key=lambda x: x['revenue'], reverse=True),
        'ml_insights': ml_insights,
        'revenue_forecast': revenue_forecast,
        'anomalies': anomalies,
        'customer_segments': customer_segments,
        'model_metrics': model_metrics,
        'order_breakdown': order_level_breakdown
    }

def generate_smart_ml_insights(stan_df, anomalies, customer_segments, revenue_forecast):
    """Generate intelligent insights based on real user data only (no synthetic data)"""
    insights = []
    
    # Revenue forecast insights (based on actual user patterns)
    if revenue_forecast and len(revenue_forecast) > 0:
        # Calculate trend from user's actual data
        daily_revenue = stan_df.groupby('date')['total_amount'].sum()
        recent_avg = daily_revenue.tail(7).mean() if len(daily_revenue) >= 7 else daily_revenue.mean()
        forecast_avg = sum(f['predicted_revenue'] for f in revenue_forecast) / len(revenue_forecast)
        
        if forecast_avg > recent_avg * 1.1:
            growth_rate = ((forecast_avg / recent_avg) - 1) * 100
            insights.append({
                'type': 'success',
                'icon': '📈',
                'title': 'Forecasting Indicates Growth',
                'message': f'Based on your actual sales patterns, we predict {growth_rate:.1f}% revenue increase next week.',
                'action': 'Consider increasing inventory or marketing spend to capitalize on this trend.',
                'confidence': 85,
                'source': 'Lightweight RandomForest trained on your data'
            })
        elif forecast_avg < recent_avg * 0.9:
            decline_rate = (1 - (forecast_avg / recent_avg)) * 100
            insights.append({
                'type': 'warning',
                'icon': '📉',
                'title': 'Potential Revenue Decline Detected',
                'message': f'Your sales patterns suggest {decline_rate:.1f}% revenue decrease next week.',
                'action': 'Review recent marketing campaigns and consider promotional strategies.',
                'confidence': 82,
                'source': 'Lightweight RandomForest trained on your data'
            })
    
    # Anomaly insights (from actual user data patterns)
    if anomalies:
        high_severity = [a for a in anomalies if a['severity'] == 'high']
        if high_severity:
            insights.append({
                'type': 'info',
                'icon': '🔍',
                'title': 'Unusual Patterns in Your Sales Data',
                'message': f'Found {len(high_severity)} unusual sales days in your data that deviate from your normal patterns.',
                'action': 'Review these dates for special events, promotions, or external factors.',
                'confidence': 90,
                'source': 'Isolation Forest trained on your sales patterns'
            })
    
    # Customer segmentation insights (from actual customer behavior)
    if customer_segments:
        total_customers = sum(s['customer_count'] for s in customer_segments)
        top_segment = max(customer_segments, key=lambda x: x['total_revenue_contribution'])
        
        insights.append({
            'type': 'info',
            'icon': '👥',
            'title': 'Customer Segmentation Complete',
            'message': f'Analyzed {total_customers} of your customers into {len(customer_segments)} behavioral segments. Your "{top_segment["segment_name"]}" segment contributes ${top_segment["total_revenue_contribution"]:.0f} in revenue.',
            'action': f'Focus retention efforts on your {top_segment["segment_name"]} segment for maximum impact.',
            'confidence': 88,
            'source': 'K-Means clustering on your customer data'
        })
        
        # Find engagement opportunities
        low_engagement_customers = sum(s['customer_count'] for s in customer_segments if s['avg_recency'] > 60)
        if low_engagement_customers > total_customers * 0.2:
            insights.append({
                'type': 'opportunity',
                'icon': '💡',
                'title': 'Re-engagement Opportunity Identified',
                'message': f'{low_engagement_customers} of your customers haven\'t purchased recently based on your typical patterns.',
                'action': 'Create targeted re-engagement campaigns for inactive customers.',
                'confidence': 86,
                'source': 'Customer behavior analysis on your data'
            })
    
    # Data quality insights
    data_quality_score = min(100, (len(stan_df) / 30) * 100)  # Assume 30+ orders is good
    if data_quality_score < 70:
        insights.append({
            'type': 'info',
            'icon': '📊',
            'title': 'More Data for Better Insights',
            'message': f'Current data quality score: {data_quality_score:.0f}%. More sales data will improve prediction accuracy.',
            'action': 'Continue using the system as you get more sales to see increasingly accurate insights.',
            'confidence': 95,
            'source': 'Data quality assessment'
        })
    
    return {
        'insights': insights,
        'total_insights': len(insights),
        'ml_confidence_avg': sum(i['confidence'] for i in insights) / len(insights) if insights else 0,
        'processing_method': 'smart_caching_real_data_only',
        'data_quality_score': data_quality_score
    }

@app.get("/")
async def root():
    return {"message": "Stanlytics API - Analytics for Stan Store Creators"}

@app.post("/analyze", response_model=AnalyticsResponse)
async def analyze_data(
    stan_file: UploadFile = File(...),
    stripe_file: Optional[UploadFile] = File(None)
):
    """
    Analyze uploaded CSV files with flexible header mapping
    """
    try:
        # Read and process Stan Store file
        stan_content = await stan_file.read()
        stan_csv_content = stan_content.decode('utf-8')
        stan_df, stan_metadata = parse_csv_flexible(stan_csv_content)
        
        # Validate Stan data
        if not stan_metadata["mapping_success"]:
            missing_fields = ", ".join(stan_metadata["missing_required_fields"])
            raise HTTPException(
                status_code=400, 
                detail=f"Missing required fields: {missing_fields}. Please ensure your CSV contains fields for customer_id, order_id, date, product_name, and total_amount."
            )
        
        # Read and process Stripe file if provided
        stripe_df = None
        stripe_metadata = None
        if stripe_file:
            stripe_content = await stripe_file.read()
            stripe_csv_content = stripe_content.decode('utf-8')
            stripe_df, stripe_metadata = parse_csv_flexible(stripe_csv_content)
        
        # Calculate analytics
        analytics = calculate_analytics(stan_df, stripe_df)
        
        # Add mapping metadata to response
        analytics['csv_metadata'] = {
            'stan_mapping': stan_metadata,
            'stripe_mapping': stripe_metadata
        }
        
        return AnalyticsResponse(**analytics)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing files: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)