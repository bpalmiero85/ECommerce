CREATE TABLE IF NOT EXISTS free_shipping_rules (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  min_subtotal NUMERIC(10,2) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at TIMESTAMPTZ NULL,
  ends_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_free_shipping_one_enabled
ON free_shipping_rules (enabled)
WHERE enabled = true;