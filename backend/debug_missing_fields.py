#!/usr/bin/env python3
"""
Debug script to identify missing fields in new CSV format
"""

import pandas as pd
from csv_mapper import FlexibleCSVMapper

def debug_missing_fields():
    """Debug missing fields in new CSV format"""
    
    print("DEBUGGING MISSING FIELDS IN NEW CSV FORMAT")
    print("=" * 60)
    
    # Test new CSV format
    mapper = FlexibleCSVMapper()
    
    # Read new CSV
    df = pd.read_csv('../new_headers.csv')
    test_content = df.head(2).to_csv(index=False)
    
    print(f"Original headers: {list(df.columns)}")
    print(f"Sample data:")
    print(df.head(1).to_string())
    
    # Process CSV
    df_mapped, meta = mapper.process_csv(test_content)
    
    print(f"\nMapping success: {meta['mapping_success']}")
    print(f"Missing fields: {meta['missing_required_fields']}")
    print(f"Mapped headers: {meta['mapped_headers']}")
    print(f"Final columns: {list(df_mapped.columns)}")
    
    # Check required fields
    required_fields = ['customer_id', 'order_id', 'date', 'product_name', 'total_amount']
    
    print(f"\nRequired field check:")
    for field in required_fields:
        has_field = field in df_mapped.columns
        status = "✅" if has_field else "❌"
        print(f"  {status} {field}: {has_field}")
    
    # Check what fields we have
    print(f"\nAvailable fields:")
    for col in df_mapped.columns:
        print(f"  - {col}")

if __name__ == "__main__":
    debug_missing_fields()


