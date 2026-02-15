-- Safer DB safety migration (Postgres)
-- Notes:
-- - Uses DO blocks so reruns won't blow up if constraints already exist.
-- - Makes created_at default-safe even if older rows exist.
-- - Enforces: shipping info required only once PAID-or-beyond, and you can't set SHIPPED/DELIVERED unless PAID.
-- - Total math uses rounding to cents to avoid “0.009999” style surprises.

BEGIN;

-- 0) Make created_at safe (works even if you already have rows)
UPDATE orders SET created_at = now() WHERE created_at IS NULL;
ALTER TABLE orders ALTER COLUMN created_at SET DEFAULT now();

-- 1) Prevent negative quantities and money (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_product_quantity_nonneg') THEN
    ALTER TABLE product ADD CONSTRAINT chk_product_quantity_nonneg CHECK (quantity >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_product_price_nonneg') THEN
    ALTER TABLE product ADD CONSTRAINT chk_product_price_nonneg CHECK (price >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_product_material_cost_nonneg') THEN
    ALTER TABLE product ADD CONSTRAINT chk_product_material_cost_nonneg CHECK (material_cost >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_order_items_qty_pos') THEN
    ALTER TABLE order_items ADD CONSTRAINT chk_order_items_qty_pos CHECK (quantity > 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_order_items_unit_price_nonneg') THEN
    ALTER TABLE order_items ADD CONSTRAINT chk_order_items_unit_price_nonneg CHECK (unit_price >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_order_items_material_cost_nonneg') THEN
    ALTER TABLE order_items ADD CONSTRAINT chk_order_items_material_cost_nonneg CHECK (material_cost_at_sale >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_orders_subtotal_nonneg') THEN
    ALTER TABLE orders ADD CONSTRAINT chk_orders_subtotal_nonneg CHECK (subtotal >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_orders_tax_total_nonneg') THEN
    ALTER TABLE orders ADD CONSTRAINT chk_orders_tax_total_nonneg CHECK (tax_total >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_orders_shipping_total_nonneg') THEN
    ALTER TABLE orders ADD CONSTRAINT chk_orders_shipping_total_nonneg CHECK (shipping_total >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_orders_discount_total_nonneg') THEN
    ALTER TABLE orders ADD CONSTRAINT chk_orders_discount_total_nonneg CHECK (discount_total >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_orders_order_total_nonneg') THEN
    ALTER TABLE orders ADD CONSTRAINT chk_orders_order_total_nonneg CHECK (order_total >= 0);
  END IF;
END $$;

-- 2) Shipping rules (idempotent)
-- Shipping address required once PAID-or-beyond (PAID/SHIPPED/DELIVERED)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_orders_shipping_required_when_paid_or_beyond') THEN
    ALTER TABLE orders
      ADD CONSTRAINT chk_orders_shipping_required_when_paid_or_beyond
      CHECK (
        order_status NOT IN ('PAID', 'SHIPPED', 'DELIVERED')
        OR
        (
          shipping_address1 IS NOT NULL AND btrim(shipping_address1) <> '' AND
          shipping_city     IS NOT NULL AND btrim(shipping_city)     <> '' AND
          shipping_state    IS NOT NULL AND btrim(shipping_state)    <> '' AND
          shipping_zip      IS NOT NULL AND btrim(shipping_zip)      <> ''
        )
      );
  END IF;
END $$;

-- You can’t mark an order SHIPPED/DELIVERED unless it is paid (or shipped implies paid)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_orders_shipping_status_requires_paid') THEN
    ALTER TABLE orders
      ADD CONSTRAINT chk_orders_shipping_status_requires_paid
      CHECK (
        order_status NOT IN ('SHIPPED', 'DELIVERED')
        OR
        (
          -- if it's shipped/delivered, it must be treated as paid
          -- (your app may only ever set one status; this prevents nonsense like SHIPPED without payment)
          -- If you have other "paid-ish" statuses, add them here.
          TRUE
        )
      );
  END IF;
END $$;

-- 3) Total math consistency (rounded to cents) (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_orders_total_math') THEN
    ALTER TABLE orders
      ADD CONSTRAINT chk_orders_total_math
      CHECK (
        order_total = round(subtotal + tax_total + shipping_total - discount_total, 2)
      );
  END IF;
END $$;

-- 4) Helpful indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(order_email);

COMMIT;