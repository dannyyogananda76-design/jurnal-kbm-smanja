/*
# Add email field to instansi table

Adds email column to store the school's official email address,
displayed on the print/cetak jurnal header as per reference design.
*/

ALTER TABLE instansi ADD COLUMN IF NOT EXISTS email text DEFAULT '';

UPDATE instansi SET email = 'smanjatibarang@gmail.com' WHERE email = '' OR email IS NULL;
