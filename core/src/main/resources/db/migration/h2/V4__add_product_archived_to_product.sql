ALTER TABLE product
ADD COLUMN IF NOT EXISTS product_archived boolean NOT NULL DEFAULT false;