import pandas as pd
import re
import io
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass

@dataclass
class FieldMapping:
    """Represents a mapping between CSV headers and internal field names"""
    csv_headers: List[str]  # Possible CSV header variations
    internal_field: str     # Standardized internal field name
    required: bool = False  # Whether this field is required
    data_type: str = "string"  # Expected data type

class FlexibleCSVMapper:
    """Handles dynamic CSV header mapping for any CSV format"""
    
    def __init__(self):
        # Define field mappings with multiple possible header variations
        self.field_mappings = [
            FieldMapping(
                csv_headers=["Customer ID", "customer_id", "customerid", "CustomerID", "customer", "id"],
                internal_field="customer_id",
                required=True
            ),
            FieldMapping(
                csv_headers=["Order ID", "order_id", "orderid", "OrderID", "order", "transaction_id", "Transaction ID"],
                internal_field="order_id",
                required=True
            ),
            FieldMapping(
                csv_headers=["Date", "date", "created_date", "Created Date", "order_date", "Order Date", "timestamp"],
                internal_field="date",
                required=True,
                data_type="datetime"
            ),
            FieldMapping(
                csv_headers=["Time", "time", "created_time", "Created Time", "order_time", "Order Time"],
                internal_field="time",
                data_type="time"
            ),
            FieldMapping(
                csv_headers=["Product Name", "product_name", "productname", "ProductName", "item", "Item Name", "product", "Product"],
                internal_field="product_name",
                required=True
            ),
            FieldMapping(
                csv_headers=["Product Type", "product_type", "category", "Category", "type", "Type"],
                internal_field="product_type",
                data_type="str",
                required=False
            ),
            FieldMapping(
                csv_headers=["Product Price", "product_price", "productprice", "ProductPrice", "price", "unit_price", "Unit Price"],
                internal_field="product_price",
                data_type="float"
            ),
            FieldMapping(
                csv_headers=["Quantity", "quantity", "qty", "Qty"],
                internal_field="quantity",
                data_type="int"
            ),
            FieldMapping(
                csv_headers=["Subtotal", "subtotal", "Sub Total", "sub_total"],
                internal_field="subtotal",
                data_type="float"
            ),
            FieldMapping(
                csv_headers=["Discount Amount", "discount_amount", "discountamount", "DiscountAmount", "discount", "Discount"],
                internal_field="discount_amount",
                data_type="float"
            ),
            FieldMapping(
                csv_headers=["Total Amount", "total_amount", "totalamount", "TotalAmount", "total", "Total"],
                internal_field="total_amount",
                required=True,
                data_type="float"
            ),
            FieldMapping(
                csv_headers=["Tax Amount", "tax_amount", "taxamount", "TaxAmount", "tax", "Tax"],
                internal_field="tax_amount",
                data_type="float"
            ),
            FieldMapping(
                csv_headers=["amount", "Amount"],
                internal_field="total_amount",
                data_type="float"
            ),

            FieldMapping(
                csv_headers=["Customer Name", "customer_name", "customername", "CustomerName", "name", "Name", "Full Name", "full_name", "fullname"],
                internal_field="customer_name"
            ),
            FieldMapping(
                csv_headers=["Customer Email", "customer_email", "customeremail", "CustomerEmail", "email", "Email"],
                internal_field="customer_email"
            ),
            FieldMapping(
                csv_headers=["Payment Status", "payment_status", "paymentstatus", "PaymentStatus", "status", "Status"],
                internal_field="payment_status"
            ),
            FieldMapping(
                csv_headers=["Payment Method", "payment_method", "paymentmethod", "PaymentMethod", "method", "Method"],
                internal_field="payment_method"
            ),
            FieldMapping(
                csv_headers=["Referral Source", "referral_source", "referralsource", "ReferralSource", "source", "Source"],
                internal_field="referral_source"
            ),
            # Stripe-specific fields
            FieldMapping(
                csv_headers=["Amount (in cents)", "amount_cents"],
                internal_field="amount",
                data_type="float"
            ),
            FieldMapping(
                csv_headers=["Net Revenue", "net_revenue", "net_amount", "Net Amount"],
                internal_field="net_amount",
                data_type="float"
            ),
            FieldMapping(
                csv_headers=["Amount Refunded", "amount_refunded", "amountrefunded", "AmountRefunded", "refunded"],
                internal_field="amount_refunded",
                data_type="float"
            ),
            FieldMapping(
                csv_headers=["Fee", "fee", "Fee Amount", "fee_amount"],
                internal_field="fee",
                data_type="float"
            ),
            FieldMapping(
                csv_headers=["Net", "net", "Net Amount", "net_amount"],
                internal_field="net",
                data_type="float"
            ),
            FieldMapping(
                csv_headers=["Created (UTC)", "created_utc", "created", "Created", "created_at"],
                internal_field="created_utc",
                data_type="datetime"
            )
        ]
    
    def normalize_header(self, header: str) -> str:
        """Normalize header for better matching"""
        return re.sub(r'[^a-zA-Z0-9]', '', header.lower())
    
    def find_best_match(self, csv_header: str, possible_headers: List[str]) -> bool:
        """Find if CSV header matches any of the possible headers"""
        # First try exact match (case-insensitive)
        for possible in possible_headers:
            if csv_header.lower() == possible.lower():
                return True
        
        # Then try normalized match
        normalized_csv = self.normalize_header(csv_header)
        for possible in possible_headers:
            if self.normalize_header(possible) == normalized_csv:
                return True
        return False
    
    def map_headers(self, csv_headers: List[str]) -> Dict[str, str]:
        """Map CSV headers to internal field names"""
        mapping = {}
        unmapped_headers = []
        
        for csv_header in csv_headers:
            mapped = False
            for field_mapping in self.field_mappings:
                if self.find_best_match(csv_header, field_mapping.csv_headers):
                    mapping[csv_header] = field_mapping.internal_field
                    mapped = True
                    break
            
            if not mapped:
                unmapped_headers.append(csv_header)
        
        return mapping, unmapped_headers
    
    def validate_required_fields(self, mapping: Dict[str, str], df_final: pd.DataFrame = None) -> List[str]:
        """Check if all required fields are mapped or generated"""
        if df_final is not None:
            # Check the final dataframe for required fields
            available_fields = set(df_final.columns)
            missing_fields = []
            
            # Check if we have the old format with exact field names
            old_format_fields = ['Total Amount', 'Date', 'Product Name', 'Customer ID', 'Order ID']
            if all(field in available_fields for field in old_format_fields):
                # Old format detected - all required fields are present
                return []
            
            for field_mapping in self.field_mappings:
                if field_mapping.required and field_mapping.internal_field not in available_fields:
                    missing_fields.append(field_mapping.internal_field)
            
            return missing_fields
        else:
            # Check only mapped fields
            mapped_fields = set(mapping.values())
            missing_fields = []
            
            for field_mapping in self.field_mappings:
                if field_mapping.required and field_mapping.internal_field not in mapped_fields:
                    missing_fields.append(field_mapping.internal_field)
            
            return missing_fields
    
    def transform_dataframe(self, df: pd.DataFrame, mapping: Dict[str, str]) -> pd.DataFrame:
        """Transform dataframe with mapped headers and proper data types"""
        # Rename columns
        df_mapped = df.rename(columns=mapping)
        
        # Apply data type conversions
        for field_mapping in self.field_mappings:
            if field_mapping.internal_field in df_mapped.columns:
                try:
                    if field_mapping.data_type == "float":
                        df_mapped[field_mapping.internal_field] = pd.to_numeric(
                            df_mapped[field_mapping.internal_field], errors='coerce'
                        )
                    elif field_mapping.data_type == "int":
                        df_mapped[field_mapping.internal_field] = pd.to_numeric(
                            df_mapped[field_mapping.internal_field], errors='coerce'
                        ).astype('Int64')
                    elif field_mapping.data_type == "datetime":
                        try:
                            df_mapped[field_mapping.internal_field] = pd.to_datetime(
                                df_mapped[field_mapping.internal_field], errors='coerce'
                            )
                        except Exception as e:
                            print(f"Warning: Could not parse datetime for {field_mapping.internal_field}: {e}")
                            # Keep as string if datetime parsing fails
                            pass
                except Exception as e:
                    # If conversion fails, keep the original data type
                    print(f"Warning: Could not convert {field_mapping.internal_field} to {field_mapping.data_type}: {e}")
        
        # Add backward compatibility aliases for legacy code
        compatibility_aliases = {
            'total_amount': 'Total Amount',
            'date': 'Date', 
            'product_name': 'Product Name',
            'customer_name': 'Customer Name',
            'customer_email': 'Customer Email',
            'order_id': 'Order ID',
            'customer_id': 'Customer ID',
            'quantity': 'Quantity',
            'product_price': 'Product Price',
            'tax_amount': 'Tax Amount',
            'payment_status': 'Payment Status',
            'payment_method': 'Payment Method',
            'referral_source': 'Referral Source'
        }
        
        # Create aliases for backward compatibility
        for new_name, old_name in compatibility_aliases.items():
            if new_name in df_mapped.columns and old_name not in df_mapped.columns:
                df_mapped[old_name] = df_mapped[new_name]
        
        # Handle malformed CSV where date and time are combined
        if 'date' in df_mapped.columns and df_mapped['date'].dtype == 'object':
            # Try to extract date from combined field
            try:
                # Check if the date field contains combined date-time-name
                sample_date = str(df_mapped['date'].iloc[0])
                if ' ' in sample_date and len(sample_date.split()) >= 2:
                    # Extract just the date part (first part before space)
                    df_mapped['date'] = df_mapped['date'].astype(str).str.split().str[0]
                    # Try to parse the extracted date
                    df_mapped['date'] = pd.to_datetime(df_mapped['date'], errors='coerce')
                    print("Extracted date from combined field")
            except Exception as e:
                print(f"Could not extract date from combined field: {e}")
        
        return df_mapped
    
    def detect_csv_type(self, mapping: Dict[str, str]) -> str:
        """Detect if this is Stan or Stripe CSV based on mapped fields"""
        mapped_fields = set(mapping.values())
        
        if "amount_refunded" in mapped_fields and "fee" in mapped_fields:
            return "stripe"
        elif "product_name" in mapped_fields and "total_amount" in mapped_fields:
            return "stan"
        else:
            return "unknown"
    
    def fix_malformed_csv(self, file_content: str) -> str:
        """Fix malformed CSV where addresses contain unquoted commas"""
        lines = file_content.strip().split('\n')
        if len(lines) < 2:
            return file_content
            
        # Get header to determine expected number of columns
        header_line = lines[0]
        expected_cols = len(header_line.split(','))
        
        fixed_lines = [header_line]  # Keep header as-is
        
        for line in lines[1:]:
            columns = line.split(',')
            
            # If we have more columns than expected, we need to merge some
            if len(columns) > expected_cols:
                # Find likely address field (usually contains state/country patterns)
                # Look for patterns like "NY", "CA", "USA", "Australia", etc.
                address_indicators = ['NY', 'CA', 'FL', 'TX', 'USA', 'Australia', 'Germany', 'UK', 'Canada']
                
                # Start from the end and work backwards to find address fields
                fixed_columns = columns[:expected_cols-1]  # Take first part
                remaining = columns[expected_cols-1:]  # Everything else becomes address
                
                # Join remaining parts as the address field (and quote it)
                address_field = ','.join(remaining).strip()
                if address_field and not (address_field.startswith('"') and address_field.endswith('"')):
                    address_field = f'"{address_field}"'
                
                fixed_columns.append(address_field)
                fixed_line = ','.join(fixed_columns)
                fixed_lines.append(fixed_line)
            else:
                fixed_lines.append(line)
        
        return '\n'.join(fixed_lines)

    def process_csv(self, file_content: str) -> Tuple[pd.DataFrame, Dict[str, any]]:
        """Process any CSV file with automatic header mapping"""
        try:
            # First, try to fix malformed CSV
            fixed_content = self.fix_malformed_csv(file_content)
            
            # Read CSV with proper handling of quoted fields
            df = pd.read_csv(io.StringIO(fixed_content), quotechar='"', escapechar='\\')
            
            # Clean column names
            df.columns = df.columns.str.strip().str.replace('"', '')
            
            # Check if this is the old format with exact field names
            old_format_fields = ['Total Amount', 'Date', 'Product Name', 'Customer ID', 'Order ID']
            if all(field in df.columns for field in old_format_fields):
                # This is the old format - use it as-is with backward compatibility
                print("Detected old CSV format - using direct mapping")
                df_mapped = df.copy()
                
                # Add backward compatibility aliases
                compatibility_aliases = {
                    'Total Amount': 'total_amount',
                    'Date': 'date', 
                    'Product Name': 'product_name',
                    'Customer Name': 'customer_name',
                    'Customer Email': 'customer_email',
                    'Order ID': 'order_id',
                    'Customer ID': 'customer_id',
                    'Quantity': 'quantity',
                    'Product Price': 'product_price',
                    'Tax Amount': 'tax_amount',
                    'Payment Status': 'payment_status',
                    'Payment Method': 'payment_method',
                    'Referral Source': 'referral_source'
                }
                
                # Create aliases for new field names
                for old_name, new_name in compatibility_aliases.items():
                    if old_name in df_mapped.columns and new_name not in df_mapped.columns:
                        df_mapped[new_name] = df_mapped[old_name]
                
                metadata = {
                    "csv_type": "stan",
                    "original_headers": df.columns.tolist(),
                    "mapped_headers": {col: col for col in df.columns},
                    "unmapped_headers": [],
                    "missing_required_fields": [],
                    "mapping_success": True,
                    "total_columns": len(df.columns),
                    "mapped_columns": len(df.columns)
                }
                
                return df_mapped, metadata
            
            # New format - use flexible mapping
            mapping, unmapped_headers = self.map_headers(df.columns.tolist())
            

            
            # Transform dataframe
            df_mapped = self.transform_dataframe(df, mapping)
            
            # Generate missing required fields if possible
            df_mapped = self.generate_missing_fields(df_mapped, mapping, df)
            
            # Validate required fields after generation
            missing_fields = self.validate_required_fields(mapping, df_mapped)
            
            # Detect CSV type
            csv_type = self.detect_csv_type(mapping)
            
            # Prepare metadata
            metadata = {
                "csv_type": csv_type,
                "original_headers": df.columns.tolist(),
                "mapped_headers": mapping,
                "unmapped_headers": unmapped_headers,
                "missing_required_fields": missing_fields,
                "mapping_success": len(missing_fields) == 0,
                "total_columns": len(df.columns),
                "mapped_columns": len(mapping)
            }
            
            return df_mapped, metadata
            
        except Exception as e:
            raise ValueError(f"Error processing CSV: {str(e)}")
    
    def generate_missing_fields(self, df_mapped: pd.DataFrame, mapping: Dict[str, str], df_original: pd.DataFrame) -> pd.DataFrame:
        """Generate missing required fields when possible"""
        
        # Generate customer_id from email if it's missing and email is available
        if 'customer_id' not in df_mapped.columns and 'customer_email' in df_mapped.columns:
            df_mapped['customer_id'] = df_mapped['customer_email'].astype(str)
        
        # Generate order_id from date + index if no order_id exists
        if 'order_id' not in df_mapped.columns and 'date' in df_mapped.columns:
            # Use the original date string if datetime parsing failed
            if df_mapped['date'].isna().any():
                # If date parsing failed, use the original date column
                original_date_col = [col for col, mapped in mapping.items() if mapped == 'date'][0]
                df_mapped['order_id'] = df_original[original_date_col].astype(str) + '_' + df_mapped.index.to_series().astype(str)
            else:
                df_mapped['order_id'] = df_mapped['date'].astype(str) + '_' + df_mapped.index.to_series().astype(str)
        
        # Also generate order_id if it's still missing (fallback)
        if 'order_id' not in df_mapped.columns:
            df_mapped['order_id'] = 'ORDER_' + df_mapped.index.to_series().astype(str)
        
        return df_mapped
