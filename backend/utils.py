def calculate_fees(amount):
    stan_fee = amount * 0.10  # 10%
    stripe_fee = (amount * 0.029) + 0.30
    return stan_fee, stripe_fee
