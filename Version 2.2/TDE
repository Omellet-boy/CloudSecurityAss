USE master;
GO

-- Create Master Key (only if it doesn't exist)
IF NOT EXISTS (SELECT * FROM sys.symmetric_keys WHERE name = '##MS_DatabaseMasterKey##')
BEGIN
    CREATE MASTER KEY ENCRYPTION BY PASSWORD = 'AlumniDbAdmin123!';
    PRINT 'Master Key created.';
END
ELSE
BEGIN
    PRINT 'Master Key already exists. Skipping.';
END
GO

-- Create Server Certificate (only if it doesn't exist)
IF NOT EXISTS (SELECT * FROM sys.certificates WHERE name = 'TDECert')
BEGIN
    CREATE CERTIFICATE TDECert WITH SUBJECT = 'AlumniDB TDE Certificate';
    PRINT 'TDE Certificate created.';
END
ELSE
BEGIN
    PRINT 'TDE Certificate already exists. Skipping.';
END
GO

USE AlumniDB;
GO

-- Create Database Encryption Key (DEK) using AES-256
IF NOT EXISTS (SELECT * FROM sys.dm_database_encryption_keys WHERE DB_NAME(database_id) = 'AlumniDB')
BEGIN
    CREATE DATABASE ENCRYPTION KEY 
    WITH ALGORITHM = AES_256 
    ENCRYPTION BY SERVER CERTIFICATE TDECert;
    PRINT 'Database Encryption Key created.';
END
ELSE
BEGIN
    PRINT 'Database Encryption Key already exists. Skipping.';
END
GO

-- 6. Turn ON TDE for AlumniDB
ALTER DATABASE AlumniDB SET ENCRYPTION ON;
PRINT 'TDE enabled on AlumniDB.';
GO

-- Verify Encryption Status
-- Expected: encryption_state = 3 (Encrypted)
SELECT 
    DB_NAME(database_id) AS DatabaseName, 
    encryption_state,
    CASE encryption_state
        WHEN 0 THEN 'No encryption'
        WHEN 1 THEN 'Unencrypted'
        WHEN 2 THEN 'Encryption in progress'
        WHEN 3 THEN 'Encrypted'
        WHEN 4 THEN 'Key change in progress'
        WHEN 5 THEN 'Decryption in progress'
    END AS EncryptionStatus
FROM sys.dm_database_encryption_keys
WHERE DB_NAME(database_id) = 'AlumniDB';
GO

-- Backup the Certificate
EXEC xp_create_subdir 'C:\Backup';
GO

BACKUP CERTIFICATE TDECert TO FILE = 'C:\Backup\TDECert.cer'
WITH PRIVATE KEY (
    FILE = 'C:\Backup\TDECert_PrivateKey.pvk',
    ENCRYPTION BY PASSWORD = 'BackupPassword123!'
);
PRINT 'TDE Certificate backed up to C:\Backup\. Store these files securely.';
GO
