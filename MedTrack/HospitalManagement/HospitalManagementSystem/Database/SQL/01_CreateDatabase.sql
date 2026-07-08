/*
    Hospital Management System (HMS)
    File: 01_CreateDatabase.sql
    Purpose: Create HMS_DB database
*/

IF DB_ID('HMS_DB') IS NULL
BEGIN
    CREATE DATABASE HMS_DB;
END
GO

USE HMS_DB;
GO
