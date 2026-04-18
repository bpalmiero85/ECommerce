CREATE TABLE IF NOT EXISTS discounts (
  discount_id BIGSERIAL PRIMARY KEY,
  discount_code VARCHAR(50) NOT NULL UNIQUE,
  discount_type VARCHAR(30) NOT NULL,
  percent_off NUMERIC(5,2) NULL,
  dollar_off NUMERIC(10,2) NULL,
  starts_at TIMESTAMPTZ NULL,
  ends_at TIMESTAMPTZ NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  returning_customer_only BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE discounts
  ADD CONSTRAINT chk_discount_type_rules
  CHECK (
    (discount_type = 'PERCENT_OFF' AND percent_off IS NOT NULL AND dollar_off IS NULL)
    OR
    (discount_type = 'DOLLAR_OFF' AND dollar_off IS NOT NULL AND percent_off IS NULL)
    OR
    (discount_type = 'FREE_SHIPPING' AND percent_off IS NULL AND dollar_off IS NULL)
  );