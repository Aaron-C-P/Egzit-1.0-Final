-- Create storage policies for item-photos bucket to allow authenticated users to upload

-- Policy for users to upload their own item photos
CREATE POLICY "Users can upload item photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'item-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy for users to update their own item photos
CREATE POLICY "Users can update own item photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'item-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy for users to delete their own item photos
CREATE POLICY "Users can delete own item photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'item-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy for public read access (bucket is already public)
CREATE POLICY "Anyone can view item photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'item-photos');