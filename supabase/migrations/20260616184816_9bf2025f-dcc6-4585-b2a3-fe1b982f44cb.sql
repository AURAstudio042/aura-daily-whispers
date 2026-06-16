CREATE POLICY "Users read own coffee photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'coffee-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own coffee photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'coffee-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own coffee photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'coffee-photos' AND auth.uid()::text = (storage.foldername(name))[1]);