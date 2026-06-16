ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS survey_source text,
  ADD COLUMN IF NOT EXISTS survey_frequency text,
  ADD COLUMN IF NOT EXISTS survey_courier_type text,
  ADD COLUMN IF NOT EXISTS survey_completed_at timestamptz;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_survey_frequency_check,
  ADD CONSTRAINT profiles_survey_frequency_check
    CHECK (survey_frequency IS NULL OR survey_frequency IN ('1-5','5-10','10+'));

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_survey_courier_type_check,
  ADD CONSTRAINT profiles_survey_courier_type_check
    CHECK (survey_courier_type IS NULL OR survey_courier_type IN ('Documents','Box Items'));