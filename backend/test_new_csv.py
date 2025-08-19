#!/usr/bin/env python3
"""
Test script to verify the new CSV processing works completely
"""

import traceback
import sys
from main import parse_csv_flexible, calculate_analytics

def test_new_csv():
    """Test the new CSV with complete error tracing"""
    
    print("=" * 60)
    print("TESTING NEW CSV PROCESSING")
    print("=" * 60)
    
    try:
        # Read the new CSV file
        print("1. Reading new_headers.csv...")
        with open('../new_headers.csv', 'r') as f:
            csv_content = f.read()
        print(f"   ✓ File read successfully ({len(csv_content)} characters)")
        
        # Parse CSV
        print("\n2. Parsing CSV with flexible mapper...")
        df, metadata = parse_csv_flexible(csv_content)
        print(f"   ✓ CSV parsed successfully")
        print(f"   ✓ Mapping success: {metadata['mapping_success']}")
        print(f"   ✓ Rows: {len(df)}")
        print(f"   ✓ Columns: {len(df.columns)}")
        print(f"   ✓ Has 'Total Amount': {'Total Amount' in df.columns}")
        
        if not metadata['mapping_success']:
            print(f"   ✗ Missing fields: {metadata['missing_required_fields']}")
            return False
        
        # Calculate analytics
        print("\n3. Calculating analytics...")
        analytics = calculate_analytics(df, stripe_df=None)
        print(f"   ✓ Analytics calculated successfully")
        print(f"   ✓ Total revenue: ${analytics['total_revenue']:,.2f}")
        print(f"   ✓ Total orders: {analytics['total_orders']}")
        print(f"   ✓ Products: {len(analytics['product_breakdown'])}")
        
        print("\n" + "=" * 60)
        print("✅ ALL TESTS PASSED - NEW CSV WORKS PERFECTLY!")
        print("=" * 60)
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR OCCURRED: {e}")
        print("\nFull traceback:")
        traceback.print_exc()
        print("\n" + "=" * 60)
        print("❌ TEST FAILED")
        print("=" * 60)
        return False

if __name__ == "__main__":
    success = test_new_csv()
    sys.exit(0 if success else 1)


