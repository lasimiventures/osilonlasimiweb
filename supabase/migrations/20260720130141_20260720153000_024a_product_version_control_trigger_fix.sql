/*
# Product Version Control — fix trigger row access

The archive_product_revision() trigger used `OLD -> col`, which fails because
OLD/NEW are composite records, not jsonb. Switch to `to_jsonb(OLD) -> col` /
`to_jsonb(NEW) -> col` so dynamic column extraction works. Also re-test.
*/

CREATE OR REPLACE FUNCTION archive_product_revision() RETURNS trigger AS $$
DECLARE
  tracked text[] := ARRAY[
    'name','slug','brand','brand_slug','category','category_slug',
    'description','short_description','specifications','datasheet_url',
    'warranty_expiry_date','images','tags',
    'price','cost_price','selling_price','distributor_price','dealer_price',
    'promotional_price','promo_start_date','promo_end_date','pricing_currency',
    'availability','buy_now_enabled','call_for_price','display_price',
    'price_visible','minimum_order_quantity','maximum_order_quantity',
    'is_featured','is_new','is_best_seller'
  ];
  changed text[] := '{}';
  oldv jsonb := '{}'::jsonb;
  newv jsonb := '{}'::jsonb;
  old_row jsonb := to_jsonb(OLD);
  new_row jsonb := to_jsonb(NEW);
  col text;
  old_val jsonb;
  new_val jsonb;
BEGIN
  FOREACH col IN ARRAY tracked LOOP
    old_val := old_row -> col;
    new_val := new_row -> col;
    IF old_val IS DISTINCT FROM new_val THEN
      changed := array_append(changed, col);
      oldv := oldv || jsonb_build_object(col, old_val);
      newv := newv || jsonb_build_object(col, new_val);
    END IF;
  END LOOP;

  IF array_length(changed, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO product_revisions
    (product_id, revision_number, change_type, changed_fields, old_values, new_values, change_source)
  VALUES
    (NEW.id, next_product_revision(NEW.id), classify_product_change(changed),
     changed, oldv, newv, 'manual_edit');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
