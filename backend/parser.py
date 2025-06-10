import csv
from collections import defaultdict
from utils import calculate_fees


def detect_csv_type(header_line):
    if "Product Name" in header_line:
        return "stan"
    elif "Amount Refunded" in header_line and "Fee" in header_line:
        return "stripe"
    return "unknown"


def parse_stan_csv(lines):
    reader = csv.DictReader(lines)
    total_revenue = 0
    product_sales = defaultdict(lambda: {"revenue": 0, "units": 0})
    refund_count = 0

    for row in reader:
        try:
            status = row.get("Payment Status", "").lower()
            if status != "paid":
                refund_count += 1
                continue

            amount = float(row.get("Total Amount", 0))
            product = row.get("Product Name", "Unknown")
            quantity = int(row.get("Quantity", 1))

            total_revenue += amount
            product_sales[product]["revenue"] += amount
            product_sales[product]["units"] += quantity

        except Exception as e:
            print("Error processing Stan row:", e)

    stan_fee = total_revenue * 0.10  # 10%
    stripe_fee = (total_revenue * 0.029) + (0.30 * sum([v["units"] for v in product_sales.values()]))

    return {
        "source": "Stan Store",
        "total_revenue": round(total_revenue, 2),
        "total_fees": round(stan_fee + stripe_fee, 2),
        "net_profit": round(total_revenue - stan_fee - stripe_fee, 2),
        "refund_count": refund_count,
        "products": product_sales
    }


def parse_stripe_csv(lines):
    reader = csv.DictReader(lines)
    total_revenue = 0
    total_refunded = 0
    total_fee = 0
    net_revenue = 0
    refund_count = 0

    for row in reader:
        try:
            amount = float(row.get("Amount", 0)) / 100
            refunded = float(row.get("Amount Refunded", 0)) / 100
            fee = float(row.get("Fee", 0)) / 100
            net = float(row.get("Net", 0)) / 100

            total_revenue += amount
            total_refunded += refunded
            total_fee += fee
            net_revenue += net

            if refunded > 0:
                refund_count += 1

        except Exception as e:
            print("Error processing Stripe row:", e)

    return {
        "source": "Stripe",
        "total_revenue": round(total_revenue, 2),
        "total_fees": round(total_fee, 2),
        "net_profit": round(net_revenue, 2),
        "refund_count": refund_count,
        "products": {}  # Stripe doesn't contain product-level breakdown
    }
