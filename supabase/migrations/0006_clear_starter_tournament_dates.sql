update public.tournaments
set
  registration_open_at = null,
  registration_close_at = null,
  check_in_deadline = null,
  technical_meeting_at = null,
  kickoff_at = null,
  grand_final_at = null,
  venue_name = null,
  public_notes = null
where slug = 'satria-tournament'
  and registration_open_at = '2026-04-20T08:00:00+07:00'::timestamptz
  and registration_close_at = '2026-04-23T23:59:00+07:00'::timestamptz
  and check_in_deadline = '2026-04-23T18:00:00+07:00'::timestamptz
  and technical_meeting_at = '2026-04-23T19:00:00+07:00'::timestamptz
  and kickoff_at = '2026-04-24T13:00:00+07:00'::timestamptz
  and grand_final_at = '2026-04-27T19:00:00+07:00'::timestamptz;
