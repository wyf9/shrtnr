-- Add channel column to clicks for tracking QR vs text link clicks.
-- Values: 'qr' for QR code scans, 'direct' for regular text-link clicks.
ALTER TABLE clicks ADD COLUMN channel TEXT DEFAULT 'direct';
