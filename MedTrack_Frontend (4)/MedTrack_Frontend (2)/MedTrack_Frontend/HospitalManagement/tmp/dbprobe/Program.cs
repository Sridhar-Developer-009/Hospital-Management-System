using System.Data;
using System.Globalization;
using System.Text;
using Microsoft.Data.SqlClient;

var databaseName = args.Length > 0 ? args[0] : "HMS_DB";
var outputPath = args.Length > 1
    ? args[1]
    : Path.Combine(Directory.GetCurrentDirectory(), $"{databaseName}_full_script_{DateTime.Now:yyyyMMdd_HHmmss}.sql");

var connectionString = $"Server=.\\SQLEXPRESS;Database={databaseName};Trusted_Connection=True;TrustServerCertificate=True;Encrypt=False;";
await using var connection = new SqlConnection(connectionString);
await connection.OpenAsync();

var script = new StringBuilder();
Line($"-- Full script generated from database [{databaseName}] on {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
Line("SET NOCOUNT ON;");
Go();
Line("IF DB_ID(N'" + EscapeSql(databaseName) + "') IS NULL");
Line("BEGIN");
Line("    CREATE DATABASE " + Q(databaseName) + ";");
Line("END");
Go();
Line("USE " + Q(databaseName) + ";");
Go();

var tables = await QueryAsync<TableInfo>(connection, """
SELECT s.name AS SchemaName, t.name AS TableName, t.object_id AS ObjectId
FROM sys.tables t
INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
WHERE t.is_ms_shipped = 0
ORDER BY s.name, t.name;
""");

foreach (var table in tables)
{
    Line($"IF OBJECT_ID(N'{EscapeSql(table.SchemaName)}.{EscapeSql(table.TableName)}', N'U') IS NOT NULL DROP TABLE {Q(table.SchemaName)}.{Q(table.TableName)};");
}
Go();

await ScriptUserDefinedTableTypesAsync();
await ScriptTablesAsync();
await ScriptForeignKeysAsync();
await ScriptIndexesAsync();
await ScriptDataAsync();
await ScriptProgrammableObjectsAsync("V", "Views");
await ScriptProgrammableObjectsAsync("P", "Stored Procedures");
await ScriptProgrammableObjectsAsync("FN", "Scalar Functions");
await ScriptProgrammableObjectsAsync("IF", "Inline Table Functions");
await ScriptProgrammableObjectsAsync("TF", "Table Functions");
await ScriptProgrammableObjectsAsync("TR", "Triggers");

Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(outputPath))!);
await File.WriteAllTextAsync(outputPath, script.ToString(), Encoding.UTF8);
Console.WriteLine(outputPath);

async Task ScriptUserDefinedTableTypesAsync()
{
    var types = await QueryAsync<TableTypeInfo>(connection, """
SELECT s.name AS SchemaName, tt.name AS TypeName, tt.type_table_object_id AS ObjectId
FROM sys.table_types tt
INNER JOIN sys.schemas s ON tt.schema_id = s.schema_id
ORDER BY s.name, tt.name;
""");

    if (types.Count == 0) return;

    Header("User Defined Table Types");
    foreach (var type in types)
    {
        Line($"IF TYPE_ID(N'{EscapeSql(type.SchemaName)}.{EscapeSql(type.TypeName)}') IS NOT NULL DROP TYPE {Q(type.SchemaName)}.{Q(type.TypeName)};");
    }
    Go();

    foreach (var type in types)
    {
        var columns = await GetColumnsAsync(type.ObjectId);
        Line($"CREATE TYPE {Q(type.SchemaName)}.{Q(type.TypeName)} AS TABLE");
        Line("(");
        Line(string.Join("," + Environment.NewLine, columns.Select(c => "    " + ScriptColumn(c, includeIdentity: false))));
        Line(");");
        Go();
    }
}

async Task ScriptTablesAsync()
{
    Header("Tables");
    foreach (var table in tables)
    {
        var columns = await GetColumnsAsync(table.ObjectId);
        var defaults = await QueryAsync<DefaultConstraintInfo>(connection, """
SELECT c.name AS ColumnName, dc.name AS ConstraintName, dc.definition AS Definition
FROM sys.default_constraints dc
INNER JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
WHERE dc.parent_object_id = @ObjectId;
""", new SqlParameter("@ObjectId", table.ObjectId));

        var checks = await QueryAsync<NamedDefinitionInfo>(connection, """
SELECT name AS Name, definition AS Definition
FROM sys.check_constraints
WHERE parent_object_id = @ObjectId;
""", new SqlParameter("@ObjectId", table.ObjectId));

        var keys = await QueryAsync<KeyConstraintInfo>(connection, """
SELECT kc.name AS Name, kc.type AS Type, i.is_unique AS IsUnique,
       STRING_AGG(QUOTENAME(c.name) + CASE WHEN ic.is_descending_key = 1 THEN ' DESC' ELSE ' ASC' END, ', ')
           WITHIN GROUP (ORDER BY ic.key_ordinal) AS Columns
FROM sys.key_constraints kc
INNER JOIN sys.indexes i ON kc.parent_object_id = i.object_id AND kc.unique_index_id = i.index_id
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id AND ic.key_ordinal > 0
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE kc.parent_object_id = @ObjectId
GROUP BY kc.name, kc.type, i.is_unique;
""", new SqlParameter("@ObjectId", table.ObjectId));

        Line($"CREATE TABLE {Q(table.SchemaName)}.{Q(table.TableName)}");
        Line("(");
        var parts = new List<string>();
        foreach (var column in columns)
        {
            var defaultConstraint = defaults.FirstOrDefault(d => d.ColumnName == column.ColumnName);
            var columnScript = ScriptColumn(column, includeIdentity: true);
            if (defaultConstraint is not null)
            {
                columnScript += $" CONSTRAINT {Q(defaultConstraint.ConstraintName)} DEFAULT {defaultConstraint.Definition}";
            }
            parts.Add("    " + columnScript);
        }
        parts.AddRange(checks.Select(c => $"    CONSTRAINT {Q(c.Name)} CHECK {c.Definition}"));
        parts.AddRange(keys.Select(k => $"    CONSTRAINT {Q(k.Name)} {(k.Type == "PK" ? "PRIMARY KEY" : "UNIQUE")} ({k.Columns})"));
        Line(string.Join("," + Environment.NewLine, parts));
        Line(");");
        Go();
    }
}

async Task ScriptForeignKeysAsync()
{
    var fks = await QueryAsync<ForeignKeyInfo>(connection, """
SELECT fk.name AS Name,
       SCHEMA_NAME(parent.schema_id) AS ParentSchema,
       parent.name AS ParentTable,
       SCHEMA_NAME(refd.schema_id) AS ReferencedSchema,
       refd.name AS ReferencedTable,
       fk.delete_referential_action_desc AS DeleteAction,
       fk.update_referential_action_desc AS UpdateAction,
       STRING_AGG(QUOTENAME(pc.name), ', ') WITHIN GROUP (ORDER BY fkc.constraint_column_id) AS ParentColumns,
       STRING_AGG(QUOTENAME(rc.name), ', ') WITHIN GROUP (ORDER BY fkc.constraint_column_id) AS ReferencedColumns
FROM sys.foreign_keys fk
INNER JOIN sys.tables parent ON fk.parent_object_id = parent.object_id
INNER JOIN sys.tables refd ON fk.referenced_object_id = refd.object_id
INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
INNER JOIN sys.columns pc ON fkc.parent_object_id = pc.object_id AND fkc.parent_column_id = pc.column_id
INNER JOIN sys.columns rc ON fkc.referenced_object_id = rc.object_id AND fkc.referenced_column_id = rc.column_id
GROUP BY fk.name, parent.schema_id, parent.name, refd.schema_id, refd.name, fk.delete_referential_action_desc, fk.update_referential_action_desc
ORDER BY parent.name, fk.name;
""");

    if (fks.Count == 0) return;

    Header("Foreign Keys");
    foreach (var fk in fks)
    {
        Line($"ALTER TABLE {Q(fk.ParentSchema)}.{Q(fk.ParentTable)} ADD CONSTRAINT {Q(fk.Name)} FOREIGN KEY ({fk.ParentColumns}) REFERENCES {Q(fk.ReferencedSchema)}.{Q(fk.ReferencedTable)} ({fk.ReferencedColumns})" +
             (fk.DeleteAction != "NO_ACTION" ? $" ON DELETE {fk.DeleteAction.Replace("_", " ")}" : string.Empty) +
             (fk.UpdateAction != "NO_ACTION" ? $" ON UPDATE {fk.UpdateAction.Replace("_", " ")}" : string.Empty) + ";");
    }
    Go();
}

async Task ScriptIndexesAsync()
{
    var indexes = await QueryAsync<IndexInfo>(connection, """
SELECT s.name AS SchemaName, t.name AS TableName, i.name AS IndexName, i.is_unique AS IsUnique, i.filter_definition AS FilterDefinition,
       STRING_AGG(QUOTENAME(c.name) + CASE WHEN ic.is_descending_key = 1 THEN ' DESC' ELSE ' ASC' END, ', ')
           WITHIN GROUP (ORDER BY ic.key_ordinal) AS Columns
FROM sys.indexes i
INNER JOIN sys.tables t ON i.object_id = t.object_id
INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id AND ic.key_ordinal > 0
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
LEFT JOIN sys.key_constraints kc ON i.object_id = kc.parent_object_id AND i.index_id = kc.unique_index_id
WHERE i.name IS NOT NULL AND i.is_primary_key = 0 AND kc.object_id IS NULL AND i.type_desc <> 'HEAP'
GROUP BY s.name, t.name, i.name, i.is_unique, i.filter_definition
ORDER BY s.name, t.name, i.name;
""");

    if (indexes.Count == 0) return;

    Header("Indexes");
    foreach (var index in indexes)
    {
        Line($"CREATE {(index.IsUnique ? "UNIQUE " : string.Empty)}INDEX {Q(index.IndexName)} ON {Q(index.SchemaName)}.{Q(index.TableName)} ({index.Columns})" +
             (string.IsNullOrWhiteSpace(index.FilterDefinition) ? string.Empty : $" WHERE {index.FilterDefinition}") + ";");
    }
    Go();
}

async Task ScriptDataAsync()
{
    Header("Data");
    foreach (var table in tables)
    {
        var columns = await GetColumnsAsync(table.ObjectId);
        var insertColumns = columns.Where(c => !c.IsComputed).ToList();
        var hasIdentity = insertColumns.Any(c => c.IsIdentity);
        await using var command = new SqlCommand($"SELECT {string.Join(", ", insertColumns.Select(c => Q(c.ColumnName)))} FROM {Q(table.SchemaName)}.{Q(table.TableName)};", connection);
        await using var reader = await command.ExecuteReaderAsync();
        var rows = new List<string>();
        while (await reader.ReadAsync())
        {
            var values = new List<string>();
            for (var i = 0; i < insertColumns.Count; i++)
            {
                values.Add(ToSqlLiteral(reader.GetValue(i)));
            }
            rows.Add("(" + string.Join(", ", values) + ")");
        }
        await reader.CloseAsync();

        if (rows.Count == 0) continue;

        if (hasIdentity) Line($"SET IDENTITY_INSERT {Q(table.SchemaName)}.{Q(table.TableName)} ON;");
        const int chunkSize = 500;
        for (var i = 0; i < rows.Count; i += chunkSize)
        {
            Line($"INSERT INTO {Q(table.SchemaName)}.{Q(table.TableName)} ({string.Join(", ", insertColumns.Select(c => Q(c.ColumnName)))}) VALUES");
            Line(string.Join("," + Environment.NewLine, rows.Skip(i).Take(chunkSize)) + ";");
        }
        if (hasIdentity) Line($"SET IDENTITY_INSERT {Q(table.SchemaName)}.{Q(table.TableName)} OFF;");
        Go();
    }
}

async Task ScriptProgrammableObjectsAsync(string type, string title)
{
    var objects = await QueryAsync<ProgrammableObjectInfo>(connection, """
SELECT s.name AS SchemaName, o.name AS ObjectName, OBJECT_DEFINITION(o.object_id) AS Definition
FROM sys.objects o
INNER JOIN sys.schemas s ON o.schema_id = s.schema_id
WHERE o.type = @Type AND o.is_ms_shipped = 0
ORDER BY s.name, o.name;
""", new SqlParameter("@Type", type));

    if (objects.Count == 0) return;

    Header(title);
    foreach (var obj in objects)
    {
        Line(obj.Definition);
        Go();
    }
}

async Task<List<ColumnInfo>> GetColumnsAsync(int objectId)
{
    return await QueryAsync<ColumnInfo>(connection, """
SELECT c.name AS ColumnName, ty.name AS TypeName, c.max_length AS MaxLength, c.precision AS Precision,
       c.scale AS Scale, c.is_nullable AS IsNullable, c.is_identity AS IsIdentity, c.is_computed AS IsComputed,
       cc.definition AS ComputedDefinition
FROM sys.columns c
INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
LEFT JOIN sys.computed_columns cc ON c.object_id = cc.object_id AND c.column_id = cc.column_id
WHERE c.object_id = @ObjectId
ORDER BY c.column_id;
""", new SqlParameter("@ObjectId", objectId));
}

static string ScriptColumn(ColumnInfo column, bool includeIdentity)
{
    if (column.IsComputed)
    {
        return $"{Q(column.ColumnName)} AS {column.ComputedDefinition}";
    }

    var text = $"{Q(column.ColumnName)} {FormatType(column)}";
    if (includeIdentity && column.IsIdentity)
    {
        text += " IDENTITY(1,1)";
    }

    text += column.IsNullable ? " NULL" : " NOT NULL";
    return text;
}

static string FormatType(ColumnInfo column)
{
    var type = column.TypeName.ToLowerInvariant();
    return type switch
    {
        "varchar" or "char" or "varbinary" or "binary" => $"{type}({(column.MaxLength == -1 ? "MAX" : column.MaxLength.ToString(CultureInfo.InvariantCulture))})",
        "nvarchar" or "nchar" => $"{type}({(column.MaxLength == -1 ? "MAX" : (column.MaxLength / 2).ToString(CultureInfo.InvariantCulture))})",
        "decimal" or "numeric" => $"{type}({column.Precision},{column.Scale})",
        "datetime2" or "datetimeoffset" or "time" => $"{type}({column.Scale})",
        _ => type
    };
}

static string ToSqlLiteral(object value)
{
    if (value is DBNull) return "NULL";
    return value switch
    {
        string s => "N'" + EscapeSql(s) + "'",
        DateTime dt => "'" + dt.ToString("yyyy-MM-ddTHH:mm:ss.fff", CultureInfo.InvariantCulture) + "'",
        DateOnly d => "'" + d.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) + "'",
        TimeSpan t => "'" + t.ToString(@"hh\:mm\:ss", CultureInfo.InvariantCulture) + "'",
        bool b => b ? "1" : "0",
        byte[] bytes => "0x" + Convert.ToHexString(bytes),
        Guid g => "'" + g + "'",
        decimal d => d.ToString(CultureInfo.InvariantCulture),
        double d => d.ToString(CultureInfo.InvariantCulture),
        float f => f.ToString(CultureInfo.InvariantCulture),
        _ => Convert.ToString(value, CultureInfo.InvariantCulture) ?? "NULL"
    };
}

async Task<List<T>> QueryAsync<T>(SqlConnection conn, string sql, params SqlParameter[] parameters) where T : new()
{
    await using var command = new SqlCommand(sql, conn);
    command.Parameters.AddRange(parameters);
    await using var reader = await command.ExecuteReaderAsync();
    var rows = new List<T>();
    var props = typeof(T).GetProperties();
    while (await reader.ReadAsync())
    {
        var row = new T();
        foreach (var prop in props)
        {
            var ordinal = reader.GetOrdinal(prop.Name);
            if (reader.IsDBNull(ordinal)) continue;
            prop.SetValue(row, reader.GetValue(ordinal));
        }
        rows.Add(row);
    }
    return rows;
}

void Header(string title)
{
    Line();
    Line("-- ============================================================");
    Line("-- " + title);
    Line("-- ============================================================");
}

void Line(string value = "") => script.AppendLine(value);
void Go() { Line("GO"); Line(); }

static string Q(string name) => "[" + name.Replace("]", "]]") + "]";
static string EscapeSql(string value) => value.Replace("'", "''");

sealed class TableInfo { public string SchemaName { get; set; } = ""; public string TableName { get; set; } = ""; public int ObjectId { get; set; } }
sealed class TableTypeInfo { public string SchemaName { get; set; } = ""; public string TypeName { get; set; } = ""; public int ObjectId { get; set; } }
sealed class ColumnInfo { public string ColumnName { get; set; } = ""; public string TypeName { get; set; } = ""; public short MaxLength { get; set; } public byte Precision { get; set; } public byte Scale { get; set; } public bool IsNullable { get; set; } public bool IsIdentity { get; set; } public bool IsComputed { get; set; } public string ComputedDefinition { get; set; } = ""; }
sealed class DefaultConstraintInfo { public string ColumnName { get; set; } = ""; public string ConstraintName { get; set; } = ""; public string Definition { get; set; } = ""; }
sealed class NamedDefinitionInfo { public string Name { get; set; } = ""; public string Definition { get; set; } = ""; }
sealed class KeyConstraintInfo { public string Name { get; set; } = ""; public string Type { get; set; } = ""; public bool IsUnique { get; set; } public string Columns { get; set; } = ""; }
sealed class ForeignKeyInfo { public string Name { get; set; } = ""; public string ParentSchema { get; set; } = ""; public string ParentTable { get; set; } = ""; public string ReferencedSchema { get; set; } = ""; public string ReferencedTable { get; set; } = ""; public string DeleteAction { get; set; } = ""; public string UpdateAction { get; set; } = ""; public string ParentColumns { get; set; } = ""; public string ReferencedColumns { get; set; } = ""; }
sealed class IndexInfo { public string SchemaName { get; set; } = ""; public string TableName { get; set; } = ""; public string IndexName { get; set; } = ""; public bool IsUnique { get; set; } public string FilterDefinition { get; set; } = ""; public string Columns { get; set; } = ""; }
sealed class ProgrammableObjectInfo { public string SchemaName { get; set; } = ""; public string ObjectName { get; set; } = ""; public string Definition { get; set; } = ""; }
