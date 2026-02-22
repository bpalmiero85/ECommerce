ALTER TABLE orders
  ADD COLUMN first_name VARCHAR(255),
  ADD COLUMN last_name  VARCHAR(255);

-- Backfill from existing order_name if it exists
UPDATE orders
SET first_name = NULLIF(split_part(order_name, ' ', 1), ''),
    last_name  = NULLIF(trim(substr(order_name, length(split_part(order_name, ' ', 1)) + 2)), '');

