#!/usr/bin/env python3
"""
Test script to verify field mappings are correct for both CSV formats
"""

import pandas as pd
from csv_mapper import FlexibleCSVMapper

def test_field_mapping():
    """Test field mapping for both CSV formats"""
    
    mapper = FlexibleCSVMapper()
    
    print("=" * 80)
    print("TESTING FIELD MAPPING FOR BOTH CSV FORMATS")
    print("=" * 80)
    
    # Test new CSV format
    print("\n1. TESTING NEW CSV FORMAT")
    print("-" * 40)
    
    new_csv_sample = """Date,Time,Full Name,email,product,type,receiving currency,amount,tax amount,converted currency,net revenue,refunded,paid,paymnent method,credit card issue country,tax reason,tax type,tax rate,billing address,affiliate username,payment plan details
2025-02-18,00:03:01,Frank Smith,frank@example.com,Hoodie,Apparel,USD,72.63,3.63,USD,69.00,0.0,True,Apple Pay,,Sales Tax,Standard,0.05,933 Oak Ave,affiliate_alpha,Monthly Subscription"""
    
    df_new, meta_new = mapper.process_csv(new_csv_sample)
    
    print(f"Original headers: {meta_new['original_headers']}")
    print(f"Mapped headers: {meta_new['mapped_headers']}")
    print(f"Final columns: {list(df_new.columns)}")
    
    # Check key mappings
    expected_mappings_new = {
        'product': 'product_name',
        'type': 'product_type', 
        'amount': 'total_amount',
        'net revenue': 'net_amount',
        'Full Name': 'customer_name',
        'email': 'customer_email',
        'tax amount': 'tax_amount'
    }
    
    print("\nExpected vs Actual mappings:")
    for original, expected in expected_mappings_new.items():
        actual = meta_new['mapped_headers'].get(original, 'NOT MAPPED')
        status = "✅" if actual == expected else "❌"
        print(f"  {status} {original} → {expected} (got: {actual})")
    
    # Test old CSV format
    print("\n2. TESTING OLD CSV FORMAT")
    print("-" * 40)
    
    old_csv_sample = """Customer ID,Order ID,Transaction ID,Date,Time,Product Name,Product Price,Quantity,Subtotal,Discount Amount,Tax Amount,Total Amount,Customer Name,Customer Email,Payment Status,Payment Method,Referral Source,Customer IP Address,Billing Address 1,Billing Address 2,Billing City,Billing State,Billing Zip Code,Billing Country
CUS-001,STAN-20250117-2121,TRX-20250117-735956,2025-01-17,17:28:43,Phone Case,23,1,23,0,2.99,25.99,Alice Thomas,alice.thomas69@example.com,Succeeded,Credit Card,Instagram,169.199.186.136,778 Maple Blvd,Toronto,ON,P3K 9R2,Canada"""
    
    df_old, meta_old = mapper.process_csv(old_csv_sample)
    
    print(f"Original headers: {meta_old['original_headers']}")
    print(f"Mapped headers: {meta_old['mapped_headers']}")
    print(f"Final columns: {list(df_old.columns)}")
    
    # Check key mappings for old format
    expected_mappings_old = {
        'Product Name': 'Product Name',  # Should be preserved
        'Total Amount': 'Total Amount',  # Should be preserved
        'Customer Name': 'Customer Name',  # Should be preserved
        'Customer Email': 'Customer Email'  # Should be preserved
    }
    
    print("\nExpected vs Actual mappings (old format):")
    for original, expected in expected_mappings_old.items():
        actual = meta_old['mapped_headers'].get(original, 'NOT MAPPED')
        status = "✅" if actual == expected else "❌"
        print(f"  {status} {original} → {expected} (got: {actual})")
    
    # Check if both formats have the required fields
    print("\n3. REQUIRED FIELD CHECK")
    print("-" * 40)
    
    required_fields = ['product_name', 'total_amount', 'customer_name', 'customer_email']
    
    print("New CSV format:")
    for field in required_fields:
        has_field = field in df_new.columns or any(field in col for col in df_new.columns)
        status = "✅" if has_field else "❌"
        print(f"  {status} {field}: {has_field}")
    
    print("\nOld CSV format:")
    for field in required_fields:
        has_field = field in df_old.columns or any(field in col for col in df_old.columns)
        status = "✅" if has_field else "❌"
        print(f"  {status} {field}: {has_field}")
    
    print("\n" + "=" * 80)
    print("FIELD MAPPING TEST COMPLETE")
    print("=" * 80)

if __name__ == "__main__":
    test_field_mapping()


