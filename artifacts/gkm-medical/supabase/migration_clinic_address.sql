-- =====================================================================
-- Migration: add per-doctor clinic address fields
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- Safe to run multiple times.
-- =====================================================================

alter table doctors add column if not exists clinic_name_ar text;
alter table doctors add column if not exists clinic_address_ar text;
alter table doctors add column if not exists clinic_phone text;
alter table doctors add column if not exists clinic_maps_url text;

update doctors set
  clinic_name_ar = 'مركز القلب التخصصي',
  clinic_address_ar = 'برج العليا الطبي، الدور 5، شارع الملك فهد، حي العليا، الرياض',
  clinic_phone = '+966112345671',
  clinic_maps_url = 'https://www.google.com/maps/search/?api=1&query=Olaya+Medical+Tower+Riyadh'
where name_ar = 'د. محمد السعيد' and clinic_address_ar is null;

update doctors set
  clinic_name_ar = 'عيادات الأطفال السعيدة',
  clinic_address_ar = 'مجمع الياسمين الطبي، طريق الأمير محمد بن عبدالعزيز، حي الياسمين، الرياض',
  clinic_phone = '+966112345672',
  clinic_maps_url = 'https://www.google.com/maps/search/?api=1&query=Yasmin+Medical+Complex+Riyadh'
where name_ar = 'د. سارة أحمد' and clinic_address_ar is null;

update doctors set
  clinic_name_ar = 'مركز المناظير المتقدم',
  clinic_address_ar = 'مجمع التخصصي الطبي، شارع التحلية، حي السليمانية، الرياض',
  clinic_phone = '+966112345673',
  clinic_maps_url = 'https://www.google.com/maps/search/?api=1&query=Tahlia+Street+Riyadh'
where name_ar = 'د. علي إبراهيم' and clinic_address_ar is null;

update doctors set
  clinic_name_ar = 'عيادة ندى للجلدية والتجميل',
  clinic_address_ar = 'برج المملكة، الدور 12، طريق العروبة، حي العليا، الرياض',
  clinic_phone = '+966112345674',
  clinic_maps_url = 'https://www.google.com/maps/search/?api=1&query=Kingdom+Tower+Riyadh'
where name_ar = 'د. ندى حسن' and clinic_address_ar is null;

update doctors set
  clinic_name_ar = 'عيادات الابتسامة الذهبية للأسنان',
  clinic_address_ar = 'مجمع النخيل الطبي، شارع الأمير سلطان، حي النخيل، الرياض',
  clinic_phone = '+966112345675',
  clinic_maps_url = 'https://www.google.com/maps/search/?api=1&query=Al+Nakheel+Riyadh'
where name_ar = 'د. خالد المطيري' and clinic_address_ar is null;

update doctors set
  clinic_name_ar = 'مركز الرشيد للنساء والولادة',
  clinic_address_ar = 'مجمع الورود الطبي، طريق الملك عبدالله، حي الورود، الرياض',
  clinic_phone = '+966112345676',
  clinic_maps_url = 'https://www.google.com/maps/search/?api=1&query=Al+Wurud+Riyadh'
where name_ar = 'د. منى الرشيد' and clinic_address_ar is null;
