#!/usr/bin/env python3
"""
Step-by-step debug script to trace field mapping and generation
"""

import pandas as pd
from csv_mapper import FlexibleCSVMapper

def debug_step_by_step():
    """Debug the CSV processing step by step"""
    
    print("STEP-BY-STEP DEBUG OF CSV PROCESSING")
    print("=" * 60)
    
    # Step 1: Read CSV
    print("STEP 1: Reading CSV")
    print("-" * 30)
    df = pd.read_csv('../new_headers.csv')
    test_content = df.head(2).to_csv(index=False)
    print(f"Original headers: {list(df.columns)}")
    print(f"Sample data:")
    print(df.head(1).to_string())
    
    # Step 2: Initialize mapper
    print("\nSTEP 2: Initialize mapper")
    print("-" * 30)
    mapper = FlexibleCSVMapper()
    
    # Step 3: Check if old format detection
    print("\nSTEP 3: Check old format detection")
    print("-" * 30)
    old_format_fields = ['Total Amount', 'Date', 'Product Name', 'Customer ID', 'Order ID']
    is_old_format = all(field in df.columns for field in old_format_fields)
    print(f"Is old format: {is_old_format}")
    print(f"Has Total Amount: {'Total Amount' in df.columns}")
    print(f"Has Date: {'Date' in df.columns}")
    print(f"Has Product Name: {'Product Name' in df.columns}")
    
    # Step 4: Map headers
    print("\nSTEP 4: Map headers")
    print("-" * 30)
    mapping, unmapped_headers = mapper.map_headers(df.columns.tolist())
    print(f"Mapping: {mapping}")
    print(f"Unmapped headers: {unmapped_headers}")
    
    # Step 5: Check amount field handling
    print("\nSTEP 5: Check amount field handling")
    print("-" * 30)
    print(f"Has 'amount' in columns: {'amount' in df.columns}")
    print(f"Has 'amount' in mapping: {'amount' in mapping}")
    print(f"Has 'net revenue' in columns: {'net revenue' in df.columns}")
    
    # Step 6: Transform dataframe
    print("\nSTEP 6: Transform dataframe")
    print("-" * 30)
    df_mapped = mapper.transform_dataframe(df, mapping)
    print(f"Columns after transform: {list(df_mapped.columns)}")
    print(f"Has total_amount: {'total_amount' in df_mapped.columns}")
    print(f"Has customer_email: {'customer_email' in df_mapped.columns}")
    print(f"Has date: {'date' in df_mapped.columns}")
    
    # Step 7: Generate missing fields
    print("\nSTEP 7: Generate missing fields")
    print("-" * 30)
    df_mapped = mapper.generate_missing_fields(df_mapped, mapping, df)
    print(f"Columns after generation: {list(df_mapped.columns)}")
    print(f"Has customer_id: {'customer_id' in df_mapped.columns}")
    print(f"Has order_id: {'order_id' in df_mapped.columns}")
    
    # Step 8: Validate required fields
    print("\nSTEP 8: Validate required fields")
    print("-" * 30)
    missing_fields = mapper.validate_required_fields(mapping, df_mapped)
    print(f"Missing fields: {missing_fields}")
    
    # Step 9: Final check
    print("\nSTEP 9: Final check")
    print("-" * 30)
    required_fields = ['customer_id', 'order_id', 'date', 'product_name', 'total_amount']
    for field in required_fields:
        has_field = field in df_mapped.columns
        status = "✅" if has_field else "❌"
        print(f"  {status} {field}: {has_field}")

if __name__ == "__main__":
    debug_step_by_step()


