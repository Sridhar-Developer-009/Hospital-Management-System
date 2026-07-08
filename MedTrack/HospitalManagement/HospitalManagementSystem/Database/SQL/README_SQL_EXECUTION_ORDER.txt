HMS SQL PACKAGE - EXECUTION ORDER

Database Name: HMS_DB
Technology: SQL Server

Run scripts in this exact order:

1. Database/01_CreateDatabase.sql
2. Database/02_CreateTables.sql
3. Database/03_Constraints.sql
4. Database/04_Indexes.sql
5. Database/05_Views.sql
6. Database/06_StoredProcedures.sql
7. Database/07_Triggers.sql
8. Database/08_SeedData.sql
9. Database/09_TestQueries.sql
10. Database/10_NotificationModule_Upgrade.sql  (run only if upgrading from old schema)

Notes:
- Demo PasswordHash values in seed data are placeholders.
- The C# console application must generate and verify BCrypt/Argon2 hashes.
- Stored procedures are designed to be called by ADO.NET repositories.
- Services should enforce business rules such as 2-hour cancellation cutoff before calling cancellation SP.
- Script 10 is only needed if you already created the database with the old CHECK constraints.
  Fresh installs using scripts 1-9 already have the updated constraints.
