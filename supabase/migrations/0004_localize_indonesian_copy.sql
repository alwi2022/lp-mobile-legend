alter table public.site_settings
  alter column register_cta_label set default 'Form Internal',
  alter column register_cta_title set default 'Daftar lewat Form Internal',
  alter column register_cta_description set default 'Pendaftaran tim dipusatkan ke form internal supaya pengiriman data, persetujuan, slot, dan dashboard panitia tetap sinkron.',
  alter column live_eyebrow set default 'Siaran Langsung',
  alter column live_title set default 'Video utama dan daftar pertandingan live';

update public.site_settings
set
  meta_description = case
    when meta_description = 'Website turnamen Mobile Legends Satria Tournament dengan pendaftaran tim, jadwal pertandingan, status turnamen, bracket playoff, daftar tim, dan live stream.'
      then 'Website turnamen Mobile Legends Satria Tournament dengan pendaftaran tim, jadwal pertandingan, status turnamen, bracket playoff, daftar tim, dan siaran langsung.'
    else meta_description
  end,
  register_cta_label = case
    when register_cta_label = 'Internal Form' then 'Form Internal'
    else register_cta_label
  end,
  register_cta_title = case
    when register_cta_title = 'Daftar via Form Internal' then 'Daftar lewat Form Internal'
    else register_cta_title
  end,
  register_cta_description = case
    when register_cta_description = 'Pendaftaran tim dipusatkan ke form internal supaya submission, approval, slot, dan dashboard panitia tetap sinkron.'
      then 'Pendaftaran tim dipusatkan ke form internal supaya pengiriman data, persetujuan, slot, dan dashboard panitia tetap sinkron.'
    else register_cta_description
  end,
  live_eyebrow = case
    when live_eyebrow = 'Live Stream' then 'Siaran Langsung'
    else live_eyebrow
  end,
  live_title = case
    when live_title = 'Video utama dan daftar match live' then 'Video utama dan daftar pertandingan live'
    else live_title
  end,
  updated_at = now();
