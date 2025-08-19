#!/usr/bin/env python3
"""
Test script to verify both old and new CSV formats work
"""

import traceback
from csv_mapper import FlexibleCSVMapper
from main import calculate_analytics
import pandas as pd

def test_csv_format(csv_path, description):
    """Test a specific CSV format"""
    
    print(f"\n{'='*60}")
    print(f"TESTING: {description}")
    print(f"{'='*60}")
    
    try:
        # Read and test the CSV
        mapper = FlexibleCSVMapper()
        df = pd.read_csv(csv_path)
        test_content = df.head(5).to_csv(index=False)
        
        print(f"1. Reading {csv_path}...")
        print(f"   ✓ File read successfully ({len(df)} rows)")
        print(f"   ✓ Headers: {list(df.columns)}")
        
        print(f"\n2. Processing with flexible mapper...")
        df_mapped, meta = mapper.process_csv(test_content)
        print(f"   ✓ CSV processed successfully")
        print(f"   ✓ Mapping success: {meta['mapping_success']}")
        print(f"   ✓ Mapped columns: {len(meta['mapped_headers'])}")
        print(f"   ✓ Has 'Total Amount': {'Total Amount' in df_mapped.columns}")
        print(f"   ✓ Has 'total_amount': {'total_amount' in df_mapped.columns}")
        
        if not meta['mapping_success']:
            print(f"   ✗ Missing fields: {meta['missing_required_fields']}")
            return False
        
        print(f"\n3. Calculating analytics...")
        analytics = calculate_analytics(df_mapped)
        print(f"   ✓ Analytics calculated successfully")
        print(f"   ✓ Total revenue: ${analytics['total_revenue']:,.2f}")
        print(f"   ✓ Total orders: {analytics['total_orders']}")
        print(f"   ✓ Products: {len(analytics['product_breakdown'])}")
        
        print(f"\n✅ {description} - SUCCESS!")
        return True
        
    except Exception as e:
        print(f"\n❌ {description} - ERROR: {e}")
        traceback.print_exc()
        return False

def main():
    """Test both CSV formats"""
    
    print("TESTING BOTH CSV FORMATS")
    print("="*60)
    
    # Test old CSV format
    old_success = test_csv_format('../stan_payments.csv', 'OLD CSV FORMAT')
    
    # Test new CSV format  
    new_success = test_csv_format('../new_headers.csv', 'NEW CSV FORMAT')
    
    # Summary
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    print(f"Old CSV format: {'✅ PASS' if old_success else '❌ FAIL'}")
    print(f"New CSV format: {'✅ PASS' if new_success else '❌ FAIL'}")
    
    if old_success and new_success:
        print(f"\n🎉 BOTH FORMATS WORK PERFECTLY!")
    else:
        print(f"\n⚠️  Some formats need fixing")
    
    return old_success and new_success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)


