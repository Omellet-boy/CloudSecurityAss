CREATE SCHEMA Security;
GO

-- 2. Create the "Judge" function (This decides who sees what)
CREATE FUNCTION Security.fn_securityPredicate(@AlumniId AS bigint)
    RETURNS TABLE
WITH SCHEMABINDING
AS
    RETURN SELECT 1 AS fn_securityPredicate_result
    WHERE 
        -- Rule A: If the user is an 'admin', they see EVERYTHING
        CAST(SESSION_CONTEXT(N'user_role') AS varchar(50)) = 'admin'
        OR 
        -- Rule B: If they are an 'alumni', they ONLY see rows matching their ID
        @AlumniId = CAST(SESSION_CONTEXT(N'alumni_id') AS bigint);
GO

-- 3. Apply the "Force Field" to the Alumni table
CREATE SECURITY POLICY AlumniFilter
ADD FILTER PREDICATE Security.fn_securityPredicate(alumni_id)
ON dbo.Alumni
WITH (STATE = ON);
GO

-- 4. Apply the same "Force Field" to the Donations table
CREATE SECURITY POLICY DonationFilter
ADD FILTER PREDICATE Security.fn_securityPredicate(alumni_id)
ON dbo.Donations
WITH (STATE = ON);
GO
