-- I2: backstop DB untuk commission_rate (0..100). Idempoten.
alter table resellers drop constraint if exists resellers_commission_range;
alter table resellers add constraint resellers_commission_range
  check (commission_rate >= 0 and commission_rate <= 100);
