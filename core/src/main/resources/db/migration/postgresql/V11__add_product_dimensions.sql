alter table product
  add column if not exists weight_ounces double precision;

alter table product
  add column if not exists length_inches double precision;

alter table product
  add column if not exists width_inches double precision;

alter table product
  add column if not exists height_inches double precision;