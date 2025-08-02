-- Enable RLS on documents table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Enable RLS on segments table
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;

-- Documents table policies
-- Users can only see their own documents
CREATE POLICY "Users can view own documents" ON documents
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own documents
CREATE POLICY "Users can insert own documents" ON documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own documents
CREATE POLICY "Users can update own documents" ON documents
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own documents
CREATE POLICY "Users can delete own documents" ON documents
    FOR DELETE USING (auth.uid() = user_id);

-- Segments table policies
-- Users can only see segments from their own documents
CREATE POLICY "Users can view own segments" ON segments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE documents.id = segments.document_id 
            AND documents.user_id = auth.uid()
        )
    );

-- Users can insert segments for their own documents
CREATE POLICY "Users can insert own segments" ON segments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE documents.id = segments.document_id 
            AND documents.user_id = auth.uid()
        )
    );

-- Users can update segments from their own documents
CREATE POLICY "Users can update own segments" ON segments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE documents.id = segments.document_id 
            AND documents.user_id = auth.uid()
        )
    );

-- Users can delete segments from their own documents
CREATE POLICY "Users can delete own segments" ON segments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE documents.id = segments.document_id 
            AND documents.user_id = auth.uid()
        )
    );

-- Service role can access all documents and segments (for Edge Functions)
CREATE POLICY "Service role can access all documents" ON documents
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all segments" ON segments
    FOR ALL USING (auth.role() = 'service_role'); 