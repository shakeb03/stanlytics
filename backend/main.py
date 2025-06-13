from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import io
from typing import List, Dict, Any, Optional
from datetime import datetime
import uvicorn
from pydantic import BaseModel

app = FastAPI(title="Stanlytics API", version="1.0.0")

# CORS setup for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
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
    referral_sources: List[Dict[str, Any]]

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

def parse_stripe_csv(file_content: str) -> pd.DataFrame:
    """Parse Stripe CSV data"""
    try:
        # Read CSV content
        df = pd.read_csv(io.StringIO(file_content))
        
        # Clean column names
        df.columns = df.columns.str.strip().str.replace('"', '')
        
        # Convert numeric columns (amounts are in cents)
        numeric_columns = ['Amount', 'Amount Refunded', 'Fee', 'Net']
        for col in numeric_columns:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col].astype(str).str.replace(',', ''), errors='coerce')
                # Convert from cents to dollars
                df[col] = df[col] / 100
        
        # Parse dates
        if 'Created (UTC)' in df.columns:
            df['Created (UTC)'] = pd.to_datetime(df['Created (UTC)'], errors='coerce')
            
        return df
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing Stripe CSV: {str(e)}")

def calculate_analytics(stan_df: pd.DataFrame, stripe_df: Optional[pd.DataFrame] = None) -> Dict[str, Any]:
    """Calculate comprehensive analytics from the data"""
    
    # Basic revenue calculations from Stan data
    total_revenue = stan_df['Total Amount'].sum()
    total_orders = len(stan_df)
    
    # Product breakdown
    product_breakdown = []
    product_stats = stan_df.groupby('Product Name').agg({
        'Total Amount': 'sum',
        'Quantity': 'sum',
        'Order ID': 'count'
    }).reset_index()
    
    for _, row in product_stats.iterrows():
        product_breakdown.append({
            'product_name': row['Product Name'],
            'revenue': float(row['Total Amount']),
            'quantity_sold': int(row['Quantity']),
            'order_count': int(row['Order ID'])
        })
    
    # Monthly revenue breakdown
    monthly_revenue = []
    if 'Date' in stan_df.columns:
        monthly_stats = stan_df.groupby(stan_df['Date'].dt.to_period('M')).agg({
            'Total Amount': 'sum',
            'Order ID': 'count'
        }).reset_index()
        
        for _, row in monthly_stats.iterrows():
            monthly_revenue.append({
                'month': str(row['Date']),
                'revenue': float(row['Total Amount']),
                'orders': int(row['Order ID'])
            })
    
    # Referral source breakdown
    referral_sources = []
    if 'Referral Source' in stan_df.columns:
        referral_stats = stan_df.groupby('Referral Source').agg({
            'Total Amount': 'sum',
            'Order ID': 'count'
        }).reset_index()
        
        for _, row in referral_stats.iterrows():
            referral_sources.append({
                'source': row['Referral Source'],
                'revenue': float(row['Total Amount']),
                'orders': int(row['Order ID'])
            })
    
    # Initialize default values
    stripe_fees = 0.0
    net_profit = total_revenue
    refund_count = 0
    refund_amount = 0.0
    
    # Enhanced calculations if Stripe data is available
    if stripe_df is not None and not stripe_df.empty:
        # Calculate Stripe fees
        stripe_fees = stripe_df['Fee'].sum()
        
        # Calculate refunds
        refund_count = len(stripe_df[stripe_df['Amount Refunded'] > 0])
        refund_amount = stripe_df['Amount Refunded'].sum()
        
        # Net amount from Stripe (after fees)
        net_from_stripe = stripe_df['Net'].sum()
        net_profit = net_from_stripe - refund_amount
    
    # Estimate Stan Store fees (typically 5-10%, let's use 7.5%)
    stan_fees = total_revenue * 0.075
    
    # Adjust net profit to account for Stan fees
    net_profit = net_profit - stan_fees
    
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
        'referral_sources': sorted(referral_sources, key=lambda x: x['revenue'], reverse=True)
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
    Analyze uploaded CSV files and return comprehensive analytics
    """
    try:
        # Read Stan Store file
        stan_content = await stan_file.read()
        stan_csv_content = stan_content.decode('utf-8')
        stan_df = parse_stan_csv(stan_csv_content)
        
        # Read Stripe file if provided
        stripe_df = None
        if stripe_file:
            stripe_content = await stripe_file.read()
            stripe_csv_content = stripe_content.decode('utf-8')
            stripe_df = parse_stripe_csv(stripe_csv_content)
        
        # Calculate analytics
        analytics = calculate_analytics(stan_df, stripe_df)
        
        return AnalyticsResponse(**analytics)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing files: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)