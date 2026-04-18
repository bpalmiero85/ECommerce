ALTER TABLE discounts
DROP CONSTRAINT IF EXISTS chk_discount_type_rules;

ALTER TABLE discounts
ADD CONSTRAINT chk_discount_type_rules
CHECK (
    (discount_type = 'PERCENT_OFF' AND percent_off IS NOT NULL AND dollar_off IS NULL)
    OR
    (discount_type = 'DOLLAR_OFF' AND dollar_off IS NOT NULL AND percent_off IS NULL)
    OR
    (discount_type = 'FREE_SHIPPING' AND percent_off IS NULL AND dollar_off IS NULL)
);