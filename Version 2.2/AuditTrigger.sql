-- Create audit log folder if it doesn't exist
DECLARE @FolderExists INT;
EXEC xp_fileexist 'C:\SQLAudit\', @FolderExists OUTPUT;

IF @FolderExists = 0
BEGIN
    EXEC xp_create_subdir 'C:\SQLAudit';
    PRINT 'Created folder: C:\SQLAudit\';
END
ELSE
BEGIN
    PRINT 'Folder already exists: C:\SQLAudit\';
END
GO

USE master;
GO

-- Create Server Audit object (writes tampering events to file)
IF EXISTS (SELECT 1 FROM sys.server_audits WHERE name = 'DonationTamperingAudit')
BEGIN
    ALTER SERVER AUDIT DonationTamperingAudit WITH (STATE = OFF);
    DROP SERVER AUDIT DonationTamperingAudit;
    PRINT 'Existing Server Audit dropped.';
END
GO

CREATE SERVER AUDIT DonationTamperingAudit
TO FILE (FILEPATH = 'C:\SQLAudit\', MAXSIZE = 10MB)
WITH (ON_FAILURE = CONTINUE);
PRINT 'Server Audit created.';
GO

-- Enable the Server Audit
ALTER SERVER AUDIT DonationTamperingAudit WITH (STATE = ON);
PRINT 'Server Audit enabled.';
GO

-- Create Database Audit Specification in MASTER
IF EXISTS (SELECT 1 FROM sys.database_audit_specifications WHERE name = 'DonationAuditSpec')
BEGIN
    ALTER DATABASE AUDIT SPECIFICATION DonationAuditSpec WITH (STATE = OFF);
    DROP DATABASE AUDIT SPECIFICATION DonationAuditSpec;
    PRINT 'Existing Database Audit Specification dropped.';
END
GO

CREATE DATABASE AUDIT SPECIFICATION DonationAuditSpec
FOR SERVER AUDIT DonationTamperingAudit
ADD (EXECUTE ON OBJECT::sys.sp_audit_write BY [public]);
PRINT 'Database Audit Specification created in master.';
GO

-- Enable the Database Audit Specification
ALTER DATABASE AUDIT SPECIFICATION DonationAuditSpec WITH (STATE = ON);
PRINT 'Database Audit Specification enabled.';
GO

USE AlumniDB;
GO

-- Create DML Trigger on Donations table
IF EXISTS (SELECT 1 FROM sys.triggers WHERE name = 'trg_AuditDonationTampering')
BEGIN
    DROP TRIGGER trg_AuditDonationTampering;
    PRINT 'Existing trigger dropped.';
END
GO

CREATE TRIGGER trg_AuditDonationTampering
ON Donations
AFTER UPDATE, DELETE
AS
BEGIN
    DECLARE @msg NVARCHAR(4000) = N'CRITICAL: Direct modification or deletion attempted on Donations table!';
    EXEC sys.sp_audit_write 
        @user_defined_event_id = 1, 
        @succeeded = 1, 
        @user_defined_information = @msg;
END;
GO
PRINT 'Trigger trg_AuditDonationTampering created on Donations table.';
GO
