create index if not exists idx_order_items_order_id 
on order_items(order_id);

create index if not exists idx_order_items_product_id 
on order_items(product_id);