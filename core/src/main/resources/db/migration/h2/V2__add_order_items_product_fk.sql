alter table order_items
add constraint FK_order_items_product
foreign key (product_id)
references product (id);