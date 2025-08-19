# Flexible CSV Header Mapping System

## Overview

The Flexible CSV Header Mapping System automatically maps CSV headers from any format to standardized internal field names, making your analytics system robust and future-proof for any CSV format changes from Stan exports.

## Features

### 🔄 **Automatic Header Mapping**
- Handles variations like "Customer ID", "customer_id", "customerid", "CustomerID", etc.
- Maps any CSV format to standardized internal field names
- Supports both Stan Store and Stripe CSV formats

### 🛡️ **Data Type Conversion**
- Automatically converts strings to appropriate types (float, int, datetime)
- Handles conversion errors gracefully
- Maintains data integrity

### ✅ **Required Field Validation**
- Ensures essential fields are present before processing
- Clear error messages for missing required fields
- Configurable required field definitions

### 🔍 **CSV Type Detection**
- Automatically identifies Stan vs Stripe CSVs
- Provides detailed mapping metadata
- Handles unknown formats gracefully

## Supported Field Mappings

### Required Fields (Stan CSV)
- `customer_id` - Customer ID, customer_id, customerid, CustomerID, customer, id (auto-generated from email if missing)
- `order_id` - Order ID, order_id, orderid, OrderID, order, transaction_id, Transaction ID (auto-generated from date if missing)
- `date` - Date, date, created_date, Created Date, order_date, Order Date, timestamp
- `product_name` - Product Name, product_name, productname, ProductName, product, item, Item Name
- `total_amount` - Total Amount, total_amount, totalamount, TotalAmount, total, Total, amount

### Optional Fields (Stan CSV)
- `time` - Time, time, created_time, Created Time, order_time, Order Time
- `product_price` - Product Price, product_price, productprice, ProductPrice, price, unit_price, Unit Price
- `quantity` - Quantity, quantity, qty, Qty
- `subtotal` - Subtotal, subtotal, Sub Total, sub_total
- `discount_amount` - Discount Amount, discount_amount, discountamount, DiscountAmount, discount, Discount
- `tax_amount` - Tax Amount, tax_amount, taxamount, TaxAmount, tax, Tax
- `customer_name` - Customer Name, customer_name, customername, CustomerName, name, Name, Full Name, full_name, fullname
- `customer_email` - Customer Email, customer_email, customeremail, CustomerEmail, email, Email
- `payment_status` - Payment Status, payment_status, paymentstatus, PaymentStatus, status, Status
- `payment_method` - Payment Method, payment_method, paymentmethod, PaymentMethod, method, Method
- `referral_source` - Referral Source, referral_source, referralsource, ReferralSource, source, Source

### Stripe-Specific Fields
- `amount` - Amount, amount, Amount (in cents), amount_cents, net revenue, net_revenue
- `amount_refunded` - Amount Refunded, amount_refunded, amountrefunded, AmountRefunded, refunded
- `fee` - Fee, fee, Fee Amount, fee_amount
- `net` - Net, net, Net Amount, net_amount
- `created_utc` - Created (UTC), created_utc, created, Created, created_at

## Usage

### Basic Usage

```python
from csv_mapper import FlexibleCSVMapper

# Initialize the mapper
mapper = FlexibleCSVMapper()

# Process any CSV file
df, metadata = mapper.process_csv(csv_content)

# Check if mapping was successful
if metadata['mapping_success']:
    print("CSV processed successfully!")
    print(f"CSV Type: {metadata['csv_type']}")
    print(f"Mapped Headers: {metadata['mapped_headers']}")
else:
    print(f"Missing required fields: {metadata['missing_required_fields']}")
```

### Integration with FastAPI

The system is already integrated into your FastAPI backend:

```python
@app.post("/analyze")
async def analyze_data(stan_file: UploadFile = File(...)):
    # Read and process Stan Store file
    stan_content = await stan_file.read()
    stan_csv_content = stan_content.decode('utf-8')
    stan_df, stan_metadata = parse_csv_flexible(stan_csv_content)
    
    # Validate Stan data
    if not stan_metadata["mapping_success"]:
        missing_fields = ", ".join(stan_metadata["missing_required_fields"])
        raise HTTPException(
            status_code=400, 
            detail=f"Missing required fields: {missing_fields}"
        )
    
    # Process analytics with standardized field names
    analytics = calculate_analytics(stan_df)
    return analytics
```

## Benefits

### 🚀 **Future-Proof**
- No code changes needed when Stan exports change format
- Handles new fields automatically
- Gracefully ignores extra fields
- **Backward Compatibility**: Legacy code continues to work with old field names

### 🛡️ **Robust Error Handling**
- Clear error messages for missing required fields
- Graceful handling of data type conversion errors
- Detailed metadata for debugging

### 📊 **Standardized Data**
- All analytics use consistent field names
- No need to update analytics code for different CSV formats
- Maintains data quality and integrity

### 🔧 **Easy Maintenance**
- Centralized field mapping configuration
- Easy to add new field variations
- Clear separation of concerns
- **Backward Compatibility**: Automatically creates aliases for legacy field names

## Example Scenarios

### Scenario 1: Standard Stan Export
```
Customer ID,Order ID,Date,Product Name,Total Amount,Quantity
CUST001,ORD001,2024-01-01,Product A,100.00,2
```
✅ **Result**: All fields mapped successfully, analytics processed

### Scenario 2: Different Header Format
```
customer_id,order_id,created_date,product,amount,qty
CUST001,ORD001,2024-01-01,Product A,100.00,2
```
✅ **Result**: Headers automatically mapped to standard format

### Scenario 3: New Stan Export Format
```
Date,Time,Full Name,email,product,amount,tax amount,net revenue,refunded,paid
2025-02-18,00:03:01,Frank Smith,frank@example.com,Hoodie,72.63,3.63,69.00,0.0,True
```
✅ **Result**: Headers mapped, missing fields auto-generated (customer_id from email, order_id from date)

### Scenario 4: Extra Fields
```
Customer ID,Order ID,Date,Product Name,Total Amount,Quantity,Extra Field 1,Extra Field 2
CUST001,ORD001,2024-01-01,Product A,100.00,2,Extra1,Extra2
```
✅ **Result**: Required fields mapped, extra fields ignored

### Scenario 5: Missing Required Fields
```
Customer ID,Date,Product Name,Total Amount
CUST001,2024-01-01,Product A,100.00
```
❌ **Result**: Clear error message about missing `order_id` field

## Configuration

To add new field mappings or modify existing ones, edit the `field_mappings` list in `csv_mapper.py`:

```python
FieldMapping(
    csv_headers=["New Field", "new_field", "newfield"],
    internal_field="new_internal_field",
    required=False,  # Set to True if required
    data_type="string"  # string, float, int, datetime
)
```

## Error Handling

The system provides comprehensive error handling:

1. **Missing Required Fields**: Returns clear list of missing fields
2. **Data Type Conversion Errors**: Logs warnings and continues processing
3. **Unknown Headers**: Tracks unmapped headers for debugging
4. **CSV Parsing Errors**: Provides detailed error messages

## Performance

- **Fast Processing**: Header mapping is O(n*m) where n=headers, m=field mappings
- **Memory Efficient**: Processes CSV in chunks
- **Scalable**: Handles large CSV files efficiently

## Testing

The system has been tested with various CSV formats:
- Standard Stan exports
- Different header variations
- Stripe CSV formats
- CSVs with extra fields
- CSVs with missing fields

All scenarios work correctly and provide appropriate feedback.
