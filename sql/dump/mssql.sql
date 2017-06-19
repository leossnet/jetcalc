USE [DBNAME]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[GetCellsHistoryXML]
	@result nvarchar(max) = '',
	@data nvarchar(max) = ''
AS
BEGIN
	
	SET NOCOUNT ON;

	DECLARE @query nvarchar(max) = ' select';
	print convert(nvarchar(255), getdate(), 114) + ' BEGIN';
	
	BEGIN
			select @query = @query + ' cell.' + LTRIM(RTRIM(Data)) + ',' from dbo.Split(@result, ',');
			set @query = SUBSTRING(@query, 1, LEN(@query) - 1);
			set @query = @query + '
				from (select Tbl.Col.value(''./@CodeCell'', ''nvarchar(255)'') as CodeCell from @xml.nodes(''/Cells/Cell'') Tbl(Col)) as tc
					left join dbo.cells_h as cell on cell.CodeCell = tc.CodeCell
				where cell.CodeCell is not null';
	END
	print convert(nvarchar(255), getdate(), 114) + ' Query start';
	exec sp_executesql @query, N'@xml xml', @xml = @data;
	print convert(nvarchar(255), getdate(), 114) + ' Query finish';
	--print @query;
END



GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[GetCellsXML]
	@result nvarchar(max) = '',
	@data nvarchar(max) = ''
AS
BEGIN
	
	SET NOCOUNT ON;

	DECLARE @query nvarchar(max) = ' select';
	print convert(nvarchar(255), getdate(), 114) + ' BEGIN';
	
	BEGIN
			select @query = @query + ' cell.' + LTRIM(RTRIM(Data)) + ',' from dbo.Split(@result, ',');
			set @query = SUBSTRING(@query, 1, LEN(@query) - 1);
			set @query = @query + '
				from (select Tbl.Col.value(''./@CodeCell'', ''nvarchar(255)'') as CodeCell from @xml.nodes(''/Cells/Cell'') Tbl(Col)) as tc
					left join dbo.cells as cell on cell.CodeCell = tc.CodeCell
				where cell.CodeCell is not null';
	END
	print convert(nvarchar(255), getdate(), 114) + ' Query start';
	exec sp_executesql @query, N'@xml xml', @xml = @data;
	print convert(nvarchar(255), getdate(), 114) + ' Query finish';
	--print @query;
END



GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[SetCellsXML]
	@data nvarchar(max) = '',
	@emulate bit = 0
AS
BEGIN
	
	SET NOCOUNT Off;

	DECLARE @xml xml = @data;

	create table #TempCell (
							[IdCell] int,
							[CodeCell] nvarchar(900),
							[CodePeriod] nvarchar(900),
							[Year] int,
							[CodeUser] nvarchar(900),
							[CodeValuta] nvarchar(900),
							[Value] decimal(30,9),
							[CalcValue] nvarchar(900) collate database_default,
							[ReportValue] decimal(30,9) null,
							[ReportValue1] decimal(30,9) null,
							[ReportValue2] decimal(30,9) null,
							[Comment] nvarchar(500) collate database_default,
							[DateEdit] datetime
							);
	insert into #TempCell (CodeCell, CodeUser, CodePeriod, Year,  CodeValuta, Value, CalcValue, Comment)
	SELECT
		Tbl.Col.value('./@CodeCell', 'nvarchar(900)') as CodeCell,
		Tbl.Col.value('./@CodeUser', 'nvarchar(900)') as CodeUser,
		Tbl.Col.value('./@CodePeriod', 'nvarchar(900)') as CodePeriod,
		Tbl.Col.value('./@Year', 'int') as Year,		
		Tbl.Col.value('./@CodeValuta', 'nvarchar(900)') as CodeValuta,
		Tbl.Col.value('./@Value', 'decimal(30,9)') as Value,
		Tbl.Col.value('./@CalcValue', 'nvarchar(900)') as CalcValue,
		Tbl.Col.value('./@Comment', 'nvarchar(900)') as Comment
	FROM
		@xml.nodes('/Rows/Row') Tbl(Col)
	
	if (@emulate = 0)
		BEGIN
					UPDATE tc SET IdCell = coalesce(c.IdCell, 0) from #TempCell tc left join dbo.cells c on c.CodeCell = tc.CodeCell;
					UPDATE tc SET [DateEdit]=(GETDATE()) from #TempCell tc ;


					UPDATE tc
					SET
						tc.Reportvalue = COALESCE((tc.Value * vr.Value), 0 ),
						tc.ReportValue1 = COALESCE((tc.Value * vr.Value1), 0),
						tc.ReportValue2 = COALESCE((tc.Value * vr.Value2), 0)
					FROM #TempCell as tc
					LEFT JOIN 
						dbo.valuta_rates as vr
					ON
						vr.Year = tc.Year and vr.CodePeriod = tc.CodePeriod and vr.CodeValuta = tc.CodeValuta;

					UPDATE
			    		cell
					SET
    					cell.Value = tc.Value, 
						cell.CodePeriod = tc.CodePeriod, 
						cell.Year = tc.Year, 
						cell.CalcValue = tc.CalcValue, 
						cell.CodeValuta = tc.CodeValuta, 
						cell.CodeUser = tc.CodeUser, 
						cell.DateEdit=(GETDATE()),
						cell.ReportValue = tc.ReportValue,
						cell.ReportValue1 = tc.ReportValue1,
						cell.ReportValue2 = tc.ReportValue2
					FROM
    					dbo.cells as cell
					INNER JOIN
				    	#TempCell as tc
					ON
    					tc.CodeCell = cell.CodeCell;

					INSERT into dbo.cells
					(CodeCell, CodePeriod, Year, CodeUser, CodeValuta, Value, CalcValue, ReportValue, ReportValue1, ReportValue2, Comment, DateEdit)
					SELECT CodeCell, CodePeriod, Year, CodeUser, CodeValuta, Value, CalcValue, ReportValue, ReportValue1, ReportValue2, Comment, DateEdit
					FROM #TempCell 
					WHERE IdCell=0;
		END
	else
		BEGIN
			select * from #TempCell;
		END

	drop table #TempCell;
END


GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[SetValutaRatesXML]
	@data nvarchar(max) = '',
	@emulate bit = 0
AS
BEGIN
	
	SET NOCOUNT Off;

	DECLARE @xml xml = @data;

	create table #TempVR (
		[IdValutaRate] int,
		[CodeValutaRate] nvarchar(900),
		[CodeValuta] nvarchar(900),
		[CodeReportValuta] nvarchar(900),
		[CodeReportValuta1] nvarchar(900),
		[CodeReportValuta2] nvarchar(900),
		[Year] int,
		[CodePeriod] nvarchar(900),
		[Value] decimal(19,5),
		[Value1] decimal(19,5),
		[Value2] decimal(19,5),
		[CodeUser] nvarchar(900),
		[DateEdit] datetime
	);
--Заполнение таблицы
	insert into #TempVR (CodeValutaRate, CodeValuta, CodeReportValuta, CodeReportValuta1, CodeReportValuta2, Year,  CodePeriod,
	 Value, Value1, Value2, CodeUser)
	SELECT
		Tbl.Col.value('./@CodeValutaRate', 'nvarchar(900)') as CodeValutaRate,
		Tbl.Col.value('./@CodeValuta', 'nvarchar(900)') as CodeValuta,
		Tbl.Col.value('./@CodeReportValuta', 'nvarchar(900)') as CodeReportValuta,
		Tbl.Col.value('./@CodeReportValuta1', 'nvarchar(900)') as CodeReportValuta1,
		Tbl.Col.value('./@CodeReportValuta2', 'nvarchar(900)') as CodeReportValuta2,
		Tbl.Col.value('./@Year', 'int') as Year,	
		Tbl.Col.value('./@CodePeriod', 'nvarchar(900)') as CodePeriod,
		Tbl.Col.value('./@Value', 'decimal(19,5)') as Value,
		Tbl.Col.value('./@Value1', 'decimal(19,5)') as Value1,
		Tbl.Col.value('./@Value2', 'decimal(19,5)') as Value2,
		Tbl.Col.value('./@CodeUser', 'nvarchar(900)') as CodeUser
	FROM
		@xml.nodes('/Rates/Rate') Tbl(Col)
	
	if (@emulate = 0)
		BEGIN
		UPDATE tc SET IdValutaRate = coalesce(c.IdValutaRate, 0)
		from #TempVR tc 
		left join dbo.valuta_rates c on c.CodeValutaRate = tc.CodeValutaRate;

		UPDATE
			rate
		SET
    		rate.Value = tc.Value, 
			rate.Value1 = tc.Value1, 
			rate.Value2 = tc.Value2, 
			rate.CodeUser = tc.CodeUser, 
			rate.DateEdit=(GETDATE())
		FROM
    		dbo.valuta_rates as rate
		INNER JOIN
			#TempVR as tc
		ON  tc.CodeValutaRate = rate.CodeValutaRate  and 
		(tc.Value != rate.Value or tc.Value1 != rate.Value1 or tc.Value2 != rate.Value2);

		UPDATE
			cell
		SET
			cell.Reportvalue = COALESCE((cell.Value * vr.Value), 0 ),
			cell.ReportValue1 = COALESCE((cell.Value * vr.Value1), 0),
			cell.ReportValue2 = COALESCE((cell.Value * vr.Value2), 0)
		FROM
    		dbo.cells as cell
		INNER JOIN
			#TempVR as vr
		ON
    		vr.Year = cell.Year and vr.CodePeriod = cell.CodePeriod and vr.CodeValuta = cell.CodeValuta;


		SELECT * FROM #TempVR ;

		INSERT into dbo.valuta_rates(CodeValutaRate,CodeValuta,CodeReportValuta,CodeReportValuta1,CodeReportValuta2,Year,CodePeriod,Value,Value1,Value2,CodeUser,DateEdit)
		SELECT CodeValutaRate,CodeValuta,CodeReportValuta,CodeReportValuta1,CodeReportValuta2,Year,CodePeriod,Value,Value1,Value2,CodeUser,DateEdit
		FROM #TempVR 
		WHERE IdValutaRate=0;

		END
	else
		BEGIN
			select * from #TempVR;
		END

	drop table #TempVR;
END

GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [dbo].[Split]
(
    @Line nvarchar(MAX),
    @SplitOn nvarchar(5) = ','
)
RETURNS @RtnValue table
(
    Id INT NOT NULL IDENTITY(1,1) PRIMARY KEY CLUSTERED,
    Data nvarchar(255) NOT NULL
)
AS
BEGIN
    IF @Line IS NULL RETURN

    DECLARE @split_on_len INT = LEN(@SplitOn)
    DECLARE @start_at INT = 1
    DECLARE @end_at INT
    DECLARE @data_len INT

    WHILE 1=1
    BEGIN
        SET @end_at = CHARINDEX(@SplitOn,@Line,@start_at)
        SET @data_len = CASE @end_at WHEN 0 THEN LEN(@Line) ELSE @end_at-@start_at END
        INSERT INTO @RtnValue (data) VALUES( SUBSTRING(@Line,@start_at,@data_len) );
        IF @end_at = 0 BREAK;
        SET @start_at = @end_at + @split_on_len
    END

    RETURN
END



GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[cells](
	[IdCell] [int] IDENTITY(0,1) NOT NULL,
	[CodeCell] [nvarchar](500) NULL,
	[CodePeriod] [nvarchar](500) NULL,
	[Year] [int] NULL,
	[CodeUser] [nvarchar](500) NULL,
	[CodeValuta] [nvarchar](500) NULL,
	[Value] [decimal](19, 5) NOT NULL,
	[CalcValue] [nvarchar](255) NULL,
	[ReportValue] [decimal](19, 5) NOT NULL,
	[ReportValue1] [decimal](19, 5) NULL,
	[ReportValue2] [decimal](19, 5) NULL,
	[Comment] [nvarchar](500) NULL,
	[DateEdit] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[IdCell] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 95) ON [PRIMARY]
) ON [PRIMARY]

GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[cells_h](
	[IdCellH] [int] IDENTITY(0,1) NOT NULL,
	[CodeCell] [nvarchar](500) NULL,
	[CodePeriod] [nvarchar](500) NULL,
	[Year] [int] NULL,
	[CodeUser] [nvarchar](500) NULL,
	[CodeValuta] [nvarchar](500) NULL,
	[Value] [decimal](19, 5) NOT NULL,
	[CalcValue] [nvarchar](255) NULL,
	[ReportValue] [decimal](19, 5) NOT NULL,
	[ReportValue1] [decimal](19, 5) NULL,
	[ReportValue2] [decimal](19, 5) NULL,
	[Comment] [nvarchar](500) NULL,
	[DateEdit] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[IdCellH] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 95) ON [PRIMARY]
) ON [PRIMARY]

GO


SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[valuta_rates](
	[IdValutaRate] [int] IDENTITY(0,1) NOT NULL,
	[CodeValutaRate] [nvarchar](255) NULL,
	[CodeValuta] [nvarchar](255) NULL,
	[CodeReportValuta] [nvarchar](255) NULL,
	[CodeReportValuta1] [nvarchar](255) NULL,
	[CodeReportValuta2] [nvarchar](255) NULL,
	[Year] [int] NULL,
	[CodePeriod] [nvarchar](255) NULL,
	[Value] [decimal](19, 5) NULL,
	[Value1] [decimal](19, 5) NULL,
	[Value2] [decimal](19, 5) NULL,
	[CodeUser] [nvarchar](255) NULL,
	[DateEdit] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[IdValutaRate] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 95) ON [PRIMARY],
 CONSTRAINT [Index_CodeValutaRate_in_ValutaRates] UNIQUE NONCLUSTERED 
(
	[CodeValutaRate] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 95) ON [PRIMARY]
) ON [PRIMARY]

GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[valuta_rates_h](
	[IdValutaRateH] [int] IDENTITY(0,1) NOT NULL,
	[CodeValutaRate] [nvarchar](255) NULL,
	[CodeValuta] [nvarchar](255) NULL,
	[CodeReportValuta] [nvarchar](255) NULL,
	[CodeReportValuta1] [nvarchar](255) NULL,
	[CodeReportValuta2] [nvarchar](255) NULL,
	[Year] [int] NULL,
	[CodePeriod] [nvarchar](255) NULL,
	[Value] [decimal](19, 5) NULL,
	[Value1] [decimal](19, 5) NULL,
	[Value2] [decimal](19, 5) NULL,
	[CodeUser] [nvarchar](255) NULL,
	[DateEdit] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[IdValutaRateH] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 95) ON [PRIMARY]
) ON [PRIMARY]

GO
ALTER TABLE [dbo].[cells] ADD  DEFAULT ((0.0)) FOR [Value]
GO
ALTER TABLE [dbo].[cells] ADD  DEFAULT ((0.0)) FOR [ReportValue]
GO
ALTER TABLE [dbo].[cells] ADD  DEFAULT ((0)) FOR [ReportValue1]
GO
ALTER TABLE [dbo].[cells] ADD  DEFAULT ((0)) FOR [ReportValue2]
GO
ALTER TABLE [dbo].[cells] ADD  CONSTRAINT [DF_Cells_Comment]  DEFAULT ('') FOR [Comment]
GO
ALTER TABLE [dbo].[cells] ADD  DEFAULT (getdate()) FOR [DateEdit]
GO
ALTER TABLE [dbo].[cells_h] ADD  DEFAULT ((0.0)) FOR [Value]
GO
ALTER TABLE [dbo].[cells_h] ADD  DEFAULT ((0.0)) FOR [ReportValue]
GO
ALTER TABLE [dbo].[cells_h] ADD  DEFAULT ((0)) FOR [ReportValue1]
GO
ALTER TABLE [dbo].[cells_h] ADD  DEFAULT ((0)) FOR [ReportValue2]
GO
ALTER TABLE [dbo].[cells_h] ADD  CONSTRAINT [DF_Cells_h_Comment]  DEFAULT ('') FOR [Comment]
GO
ALTER TABLE [dbo].[cells_h] ADD  DEFAULT (getdate()) FOR [DateEdit]
GO
ALTER TABLE [dbo].[valuta_rates] ADD  DEFAULT (getdate()) FOR [DateEdit]
GO
ALTER TABLE [dbo].[valuta_rates_h] ADD  DEFAULT (getdate()) FOR [DateEdit]
GO


CREATE TRIGGER [dbo].[th_cells]
   ON  [dbo].[cells]
   AFTER INSERT,UPDATE
AS 
BEGIN
   SET NOCOUNT ON
   
   insert dbo.cells_h (CodeCell, CodePeriod, Year, CodeUser, CodeValuta, Value, CalcValue, ReportValue, ReportValue1, ReportValue2, Comment, DateEdit )
   select
	   [CodeCell]
      ,[CodePeriod]
      ,[Year]
      ,[CodeUser]
      ,[CodeValuta]
      ,[Value]
      ,[CalcValue]
      ,[ReportValue]
      ,[ReportValue1]
      ,[ReportValue2]
      ,[Comment]
      ,getdate()
   FROM inserted   
END
GO

CREATE TRIGGER [dbo].[th_valuta_rates]
   ON  [dbo].[valuta_rates]
   AFTER INSERT,UPDATE
AS 
BEGIN
   SET NOCOUNT ON
   
   insert dbo.valuta_rates_h (CodeValutaRate, CodeValuta, CodeReportValuta, CodeReportValuta1, CodeReportValuta2, Year, CodePeriod, Value, Value1, Value2, CodeUser, DateEdit )
   select
	   [CodeValutaRate]
      ,[CodeValuta]
      ,[CodeReportValuta]
	  ,[CodeReportValuta1]
	  ,[CodeReportValuta2]
      ,[Year]
      ,[CodePeriod]
      ,[Value]
      ,[Value1]
      ,[Value2]
      ,[CodeUser]
      ,getdate()
   FROM inserted   
END
GO


CREATE INDEX cell_code_cell_index ON dbo.cells (CodeCell); 
CREATE INDEX cell_code_period_index ON dbo.cells (CodePeriod); 
CREATE INDEX cell_year_index ON dbo.cells (Year); 
CREATE INDEX cell_code_valuta_index ON dbo.cells (CodeValuta); 

CREATE INDEX cell_h_code_cell_index ON dbo.cells_h (CodeCell); 

CREATE INDEX code_valuta_rate_index ON dbo.valuta_rates (CodeValutaRate);
CREATE INDEX code_valuta_index ON dbo.valuta_rates (CodeValuta);
CREATE INDEX vr_year_index ON dbo.valuta_rates (Year);
CREATE INDEX vr_code_period_index ON dbo.valuta_rates (CodePeriod);

GO

