--CREATE DATABASE jetteam
--  WITH OWNER = postgres
       --ENCODING = 'UTF8'
       --TABLESPACE = pg_default
       --LC_COLLATE = 'Russian_Russia.1251'
       --LC_CTYPE = 'Russian_Russia.1251'
       --CONNECTION LIMIT = -1;


--CREATE SCHEMA public
  --AUTHORIZATION postgres;

--GRANT ALL ON SCHEMA public TO postgres;
--GRANT ALL ON SCHEMA public TO public;
--COMMENT ON SCHEMA public
  --IS 'standard public schema';

-- Function: public."GetCellsHistoryJSON"(text, json)

-- DROP FUNCTION public."GetCellsHistoryJSON"(text, json);

CREATE SEQUENCE public.cells_h_seq
  INCREMENT 1
  MINVALUE 1
  MAXVALUE 9223372036854775807
  START 1
  CACHE 1;
ALTER TABLE public.cells_h_seq
  OWNER TO postgres;


-- Sequence: public.cells_seq

-- DROP SEQUENCE public.cells_seq;

CREATE SEQUENCE public.cells_seq
  INCREMENT 1
  MINVALUE 1
  MAXVALUE 9223372036854775807
  START 1
  CACHE 1;
ALTER TABLE public.cells_seq
  OWNER TO postgres;


-- Sequence: public.valuta_rates_h_seq

-- DROP SEQUENCE public.valuta_rates_h_seq;

CREATE SEQUENCE public.valuta_rates_h_seq
  INCREMENT 1
  MINVALUE 1
  MAXVALUE 9223372036854775807
  START 1
  CACHE 1;
ALTER TABLE public.valuta_rates_h_seq
  OWNER TO postgres;

-- Sequence: public.valuta_rates_seq

-- DROP SEQUENCE public.valuta_rates_seq;

CREATE SEQUENCE public.valuta_rates_seq
  INCREMENT 1
  MINVALUE 1
  MAXVALUE 9223372036854775807
  START 1
  CACHE 1;
ALTER TABLE public.valuta_rates_seq
  OWNER TO postgres;


-- Function: public.trigger_on_cells()

-- DROP FUNCTION public.trigger_on_cells();

CREATE OR REPLACE FUNCTION public.trigger_on_cells()
  RETURNS trigger AS
$BODY$
BEGIN
	INSERT INTO public.cells_h ("CodeCell","CodeUser","CodePeriod","Year","CodeValuta","Value","CalcValue","ReportValue","ReportValue1","ReportValue2","Comment","DateEdit")
	select NEW."CodeCell", NEW."CodeUser", NEW."CodePeriod", NEW."Year",  NEW."CodeValuta", NEW."Value", NEW."CalcValue",NEW."ReportValue",NEW."ReportValue1",NEW."ReportValue2", NEW."Comment", (now());
	return NEW;
END; $BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
ALTER FUNCTION public.trigger_on_cells()
  OWNER TO postgres;


-- Function: public.trigger_on_valuta_rates()

-- DROP FUNCTION public.trigger_on_valuta_rates();

CREATE OR REPLACE FUNCTION public.trigger_on_valuta_rates()
  RETURNS trigger AS
$BODY$
BEGIN
	INSERT INTO public.valuta_rates_h ("CodeValutaRate","CodeValuta","CodeReportValuta","CodeReportValuta1","CodeReportValuta2","Year","CodePeriod","Value","Value1","Value2","CodeUser","DateEdit")
	SELECT NEW."CodeValutaRate",NEW."CodeValuta",NEW."CodeReportValuta",NEW."CodeReportValuta1",NEW."CodeReportValuta2",NEW."Year",NEW."CodePeriod",NEW."Value",NEW."Value1",NEW."Value2",NEW."CodeUser",(now());
	RETURN NEW;
END; $BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
ALTER FUNCTION public.trigger_on_valuta_rates()
  OWNER TO postgres;




CREATE OR REPLACE FUNCTION public."GetCellsHistoryJSON"(
    result text,
    data json)
  RETURNS json AS
$BODY$
DECLARE
  t_json json;
BEGIN

   EXECUTE ' SELECT to_json(json_agg(r))' ||
           ' FROM ( SELECT "'||replace(result,',','","')||'"'||
           ' FROM public.cells_h WHERE "CodeCell" IN (select "CodeCell" as "CodeCell" from json_to_recordset($1) as x("CodeCell" text))) AS r' 
   USING data
   INTO t_json;
     
   RETURN t_json;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
ALTER FUNCTION public."GetCellsHistoryJSON"(text, json)
  OWNER TO postgres;


-- Function: public."GetCellsJSON"(text, json)

-- DROP FUNCTION public."GetCellsJSON"(text, json);

CREATE OR REPLACE FUNCTION public."GetCellsJSON"(
    result text,
    data json)
  RETURNS json AS
$BODY$
DECLARE
  t_json json;
BEGIN

   EXECUTE ' SELECT to_json(json_agg(r))' ||
           ' FROM ( SELECT "'||replace(result,',','","')||'"'||
           ' FROM public.cells as cell WHERE "CodeCell" IN (select "CodeCell" as "CodeCell" from json_to_recordset($1) as x("CodeCell" text))) AS r' 
   USING data
   INTO t_json;

   --  SELECT  to_json(json_agg(r)) FROM (SELECT * from json_to_recordset(data) as x("CodeCell" text)) as r INTO t_json2;
     
   RETURN t_json;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
ALTER FUNCTION public."GetCellsJSON"(text, json)
  OWNER TO postgres;


-- Function: public."SetCellsJSON"(json, integer)

-- DROP FUNCTION public."SetCellsJSON"(json, integer);

CREATE OR REPLACE FUNCTION public."SetCellsJSON"(
    data json,
    emulate integer DEFAULT 0)
  RETURNS json AS
$BODY$
DECLARE
	t_json json;
	Error  text = '';
BEGIN
   

CREATE TEMP table temp_cell (
	"IdCell" int,
	"CodeCell" varchar(900),
	"CodePeriod" varchar(900),
	"Year" int,
	"CodeUser" varchar(900),
	"CodeValuta" varchar(900),
	"Value" decimal(19,5),
	"CalcValue" varchar(900),
	"ReportValue" decimal(19,5),
	"ReportValue1" decimal(19,5),
	"ReportValue2" decimal(19,5),
	"Comment" varchar(900),
	"DateEdit" timestamp without time zone
);

INSERT INTO temp_cell ("CodeCell", "CodeUser", "CodePeriod", "Year",  "CodeValuta", "Value", "CalcValue", "Comment")
SELECT "CodeCell", "CodeUser", "CodePeriod", "Year",  "CodeValuta", "Value", "CalcValue", "Comment"
FROM json_to_recordset(data) as x(
	"CodeCell" varchar(900),
	"CodeUser" varchar(900),
	"CodePeriod" varchar(900),
	"Year" int,
	"CodeValuta" varchar(900),
	"Value" decimal(19,5),
	"CalcValue" varchar(900),
	"Comment" varchar(900)
);


UPDATE temp_cell  
SET 
	"IdCell" = coalesce(c."IdCell", 0),
	"DateEdit"=(now())
FROM temp_cell tc
LEFT JOIN public.cells c ON c."CodeCell" = tc."CodeCell";


UPDATE temp_cell tempc
SET
	"ReportValue" = coalesce((tc."Value" * vr."Value"), 0 ),
	"ReportValue1" = coalesce((tc."Value" * vr."Value1"), 0),
	"ReportValue2" = coalesce((tc."Value" * vr."Value2"), 0)
FROM temp_cell as tc
LEFT JOIN  public.valuta_rates AS vr ON vr."Year" = tc."Year" and vr."CodePeriod" = tc."CodePeriod" and vr."CodeValuta" = tc."CodeValuta"
WHERE tempc."CodeCell" = tc."CodeCell";



UPDATE	public.cells pubcel
SET
	"Value" = tc."Value", 
	"CodePeriod" = tc."CodePeriod", 
	"Year" = tc."Year", 
	"CalcValue" = tc."CalcValue", 
	"CodeValuta" = tc."CodeValuta", 
	"CodeUser" = tc."CodeUser", 
	"DateEdit"=(now()),
	"ReportValue" = tc."ReportValue",
	"ReportValue1" = tc."ReportValue1",
	"ReportValue2" = tc."ReportValue2"
FROM public.cells AS cell
INNER JOIN temp_cell AS tc ON tc."CodeCell" = cell."CodeCell"
WHERE pubcel."CodeCell"=cell."CodeCell";


INSERT into public.cells ("CodeCell", "CodePeriod", "Year", "CodeUser", "CodeValuta", "Value", "CalcValue", "ReportValue", "ReportValue1", "ReportValue2", "Comment", "DateEdit")
SELECT "CodeCell", "CodePeriod", "Year", "CodeUser", "CodeValuta", "Value", "CalcValue", "ReportValue", "ReportValue1", "ReportValue2", "Comment", "DateEdit"
FROM temp_cell WHERE "IdCell"=0;






SELECT to_json(json_agg(r)) FROM  (SELECT "CodeCell","Value","ReportValue2" FROM temp_cell) r INTO t_json; 


DROP TABLE temp_cell;

RETURN t_json; 

END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
ALTER FUNCTION public."SetCellsJSON"(json, integer)
  OWNER TO postgres;


-- Function: public."SetValutaRatesJSON"(json, integer)

-- DROP FUNCTION public."SetValutaRatesJSON"(json, integer);

CREATE OR REPLACE FUNCTION public."SetValutaRatesJSON"(
    data json,
    emulate integer DEFAULT 0)
  RETURNS json AS
$BODY$
DECLARE
	t_json json;
	Error  text = '';
BEGIN
   

CREATE TEMP table temp_vr (
	"IdValutaRate" int,
	"CodeValutaRate" varchar(900),
	"CodeValuta" varchar(900),
	"CodeReportValuta" varchar(900),
	"CodeReportValuta1" varchar(900),
	"CodeReportValuta2" varchar(900),
	"Year" int,
	"CodePeriod" varchar(900),
	"Value" decimal(19,5),
	"Value1" decimal(19,5),
	"Value2" decimal(19,5),
	"CodeUser" varchar(900),
	"DateEdit" timestamp without time zone
);

INSERT INTO temp_vr ("CodeValutaRate", "CodeValuta", "CodeReportValuta", "CodeReportValuta1", "CodeReportValuta2", "Year",  "CodePeriod", "Value", "Value1", "Value2", "CodeUser")

SELECT "CodeValutaRate", "CodeValuta", "CodeReportValuta", "CodeReportValuta1", "CodeReportValuta2", "Year",  "CodePeriod", "Value", "Value1", "Value2", "CodeUser"
FROM json_to_recordset(data) as 
x(
		"CodeValutaRate" varchar(900),
		"CodeValuta" varchar(900),
		"CodeReportValuta" varchar(900),
		"CodeReportValuta1" varchar(900),
		"CodeReportValuta2" varchar(900),
		"Year" int,  
		"CodePeriod" varchar(900),
		"Value" decimal(19,5),
		"Value1" decimal(19,5),
		"Value2" decimal(19,5),
		"CodeUser" varchar(900)
);


UPDATE temp_vr  
SET 
	"IdValutaRate" = coalesce(vr."IdValutaRate", 0),
	"DateEdit"=(now())
FROM temp_vr tvr
LEFT JOIN public.valuta_rates vr ON vr."CodeValutaRate" = tvr."CodeValutaRate";



UPDATE	public.valuta_rates
SET
	"Value" = tvr."Value", 
	"Value1" = tvr."Value1", 
	"Value2" = tvr."Value2", 
	"CodeUser" = tvr."CodeUser", 
	"DateEdit"=(now())
FROM public.valuta_rates AS rate
INNER JOIN temp_vr AS tvr ON tvr."CodeValutaRate" = rate."CodeValutaRate"  AND (tvr."Value" != rate."Value" OR tvr."Value1" != rate."Value1" OR tvr."Value2" != rate."Value2");




UPDATE	public.cells AS tab
SET
	"ReportValue" = COALESCE((cell."Value" * vr."Value"), 0 ),
	"ReportValue1" = COALESCE((cell."Value" * vr."Value1"), 0),
	"ReportValue2" = COALESCE((cell."Value" * vr."Value2"), 0)
FROM public.cells AS cell
INNER JOIN temp_vr as vr ON vr."Year" = cell."Year" and vr."CodePeriod" = cell."CodePeriod" and vr."CodeValuta" = cell."CodeValuta"
WHERE tab."CodeCell" = cell."CodeCell";


INSERT into public.valuta_rates ("CodeValutaRate","CodeValuta","CodeReportValuta","CodeReportValuta1","CodeReportValuta2","Year","CodePeriod","Value","Value1","Value2","CodeUser","DateEdit")
SELECT "CodeValutaRate","CodeValuta","CodeReportValuta","CodeReportValuta1","CodeReportValuta2","Year","CodePeriod","Value","Value1","Value2","CodeUser","DateEdit"
FROM temp_vr 
WHERE "IdValutaRate"=0;

SELECT to_json(json_agg(r)) FROM  temp_vr r INTO t_json; 


DROP TABLE temp_vr;

RETURN t_json; 

END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
ALTER FUNCTION public."SetValutaRatesJSON"(json, integer)
  OWNER TO postgres;


-- Table: public.cells

-- DROP TABLE public.cells;

CREATE TABLE public.cells
(
  "IdCell" integer NOT NULL DEFAULT nextval('cells_seq'::regclass),
  "CodeCell" character varying(500),
  "CodePeriod" character varying(500),
  "Year" integer,
  "CodeUser" character varying(500),
  "CodeValuta" character varying(500),
  "Value" numeric(19,5) NOT NULL DEFAULT 0.0,
  "CalcValue" character varying(255),
  "ReportValue" numeric(19,5) NOT NULL DEFAULT 0.0,
  "ReportValue1" numeric(19,5) DEFAULT 0,
  "ReportValue2" numeric(19,5) DEFAULT 0,
  "Comment" character varying(500) DEFAULT ''::character varying,
  "DateEdit" timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT "PK__Cells__3A4B12F3AE0F548F" PRIMARY KEY ("IdCell")
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.cells
  OWNER TO postgres;

-- Index: public.cell_code_cell_index

-- DROP INDEX public.cell_code_cell_index;

CREATE INDEX cell_code_cell_index
  ON public.cells
  USING btree
  ("CodeCell" COLLATE pg_catalog."default");

-- Index: public.cell_code_period_index

-- DROP INDEX public.cell_code_period_index;

CREATE INDEX cell_code_period_index
  ON public.cells
  USING btree
  ("CodePeriod" COLLATE pg_catalog."default");

-- Index: public.cell_code_valuta_index

-- DROP INDEX public.cell_code_valuta_index;

CREATE INDEX cell_code_valuta_index
  ON public.cells
  USING btree
  ("CodeValuta" COLLATE pg_catalog."default");

-- Index: public.cell_year_index

-- DROP INDEX public.cell_year_index;

CREATE INDEX cell_year_index
  ON public.cells
  USING btree
  ("Year");


-- Trigger: trigger_on_cells on public.cells

-- DROP TRIGGER trigger_on_cells ON public.cells;

CREATE TRIGGER trigger_on_cells
  BEFORE INSERT OR UPDATE
  ON public.cells
  FOR EACH ROW
  EXECUTE PROCEDURE public.trigger_on_cells();



-- Table: public.cells_h

-- DROP TABLE public.cells_h;

CREATE TABLE public.cells_h
(
  "IdCellH" integer NOT NULL DEFAULT nextval('cells_h_seq'::regclass),
  "CodeCell" character varying(500),
  "CodePeriod" character varying(500),
  "Year" integer,
  "CodeUser" character varying(500),
  "CodeValuta" character varying(500),
  "Value" numeric(19,5) NOT NULL DEFAULT 0.0,
  "CalcValue" character varying(255),
  "ReportValue" numeric(19,5) NOT NULL DEFAULT 0.0,
  "ReportValue1" numeric(19,5) DEFAULT 0,
  "ReportValue2" numeric(19,5) DEFAULT 0,
  "Comment" character varying(500) DEFAULT ''::character varying,
  "DateEdit" timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT "PK__Cells_h__8AC7A1B748CFD2BB" PRIMARY KEY ("IdCellH")
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.cells_h
  OWNER TO postgres;

-- Index: public.cell_h_code_cell_index

-- DROP INDEX public.cell_h_code_cell_index;

CREATE INDEX cell_h_code_cell_index
  ON public.cells_h
  USING btree
  ("CodeCell" COLLATE pg_catalog."default");



-- Table: public.valuta_rates

-- DROP TABLE public.valuta_rates;

CREATE TABLE public.valuta_rates
(
  "IdValutaRate" integer NOT NULL DEFAULT nextval('valuta_rates_seq'::regclass),
  "CodeValutaRate" character varying(255),
  "CodeValuta" character varying(255),
  "CodeReportValuta" character varying(255),
  "CodeReportValuta1" character varying(255),
  "CodeReportValuta2" character varying(255),
  "Year" integer,
  "CodePeriod" character varying(255),
  "Value" numeric(19,5),
  "Value1" numeric(19,5),
  "Value2" numeric(19,5),
  "CodeUser" character varying(255),
  "DateEdit" timestamp without time zone DEFAULT now(),
  CONSTRAINT "PK__valuta_r__49D7083F1A9A173D" PRIMARY KEY ("IdValutaRate")
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.valuta_rates
  OWNER TO postgres;

-- Index: public."Index_CodeValutaRate_in_ValutaRates"

-- DROP INDEX public."Index_CodeValutaRate_in_ValutaRates";

CREATE UNIQUE INDEX "Index_CodeValutaRate_in_ValutaRates"
  ON public.valuta_rates
  USING btree
  ("CodeValutaRate" COLLATE pg_catalog."default");

-- Index: public.code_valuta_index

-- DROP INDEX public.code_valuta_index;

CREATE INDEX code_valuta_index
  ON public.valuta_rates
  USING btree
  ("CodeValuta" COLLATE pg_catalog."default");

-- Index: public.vr_code_period_index

-- DROP INDEX public.vr_code_period_index;

CREATE INDEX vr_code_period_index
  ON public.valuta_rates
  USING btree
  ("CodePeriod" COLLATE pg_catalog."default");

-- Index: public.vr_year_index

-- DROP INDEX public.vr_year_index;

CREATE INDEX vr_year_index
  ON public.valuta_rates
  USING btree
  ("Year");


-- Trigger: trigger_on_valuta_rates on public.valuta_rates

-- DROP TRIGGER trigger_on_valuta_rates ON public.valuta_rates;

CREATE TRIGGER trigger_on_valuta_rates
  BEFORE INSERT OR UPDATE
  ON public.valuta_rates
  FOR EACH ROW
  EXECUTE PROCEDURE public.trigger_on_valuta_rates();



-- Table: public.valuta_rates_h

-- DROP TABLE public.valuta_rates_h;

CREATE TABLE public.valuta_rates_h
(
  "IdValutaRateH" integer NOT NULL DEFAULT nextval('valuta_rates_h_seq'::regclass),
  "CodeValutaRate" character varying(255),
  "CodeValuta" character varying(255),
  "CodeReportValuta" character varying(255),
  "CodeReportValuta1" character varying(255),
  "CodeReportValuta2" character varying(255),
  "Year" integer,
  "CodePeriod" character varying(255),
  "Value" numeric(19,5),
  "Value1" numeric(19,5),
  "Value2" numeric(19,5),
  "CodeUser" character varying(255),
  "DateEdit" timestamp without time zone DEFAULT now(),
  CONSTRAINT "PK__valuta_r__4C4FB228DD3298F5" PRIMARY KEY ("IdValutaRateH")
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.valuta_rates_h
  OWNER TO postgres;

-- Function: public.trigger_on_cells()

-- DROP FUNCTION public.trigger_on_cells();

CREATE OR REPLACE FUNCTION public.trigger_on_cells()
  RETURNS trigger AS
$BODY$
BEGIN
	INSERT INTO public.cells_h ("CodeCell","CodeUser","CodePeriod","Year","CodeValuta","Value","CalcValue","ReportValue","ReportValue1","ReportValue2","Comment","DateEdit")
	select NEW."CodeCell", NEW."CodeUser", NEW."CodePeriod", NEW."Year",  NEW."CodeValuta", NEW."Value", NEW."CalcValue",NEW."ReportValue",NEW."ReportValue1",NEW."ReportValue2", NEW."Comment", (now());
	return NEW;
END; $BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
ALTER FUNCTION public.trigger_on_cells()
  OWNER TO postgres;


-- Function: public.trigger_on_valuta_rates()

-- DROP FUNCTION public.trigger_on_valuta_rates();

CREATE OR REPLACE FUNCTION public.trigger_on_valuta_rates()
  RETURNS trigger AS
$BODY$
BEGIN
	INSERT INTO public.valuta_rates_h ("CodeValutaRate","CodeValuta","CodeReportValuta","CodeReportValuta1","CodeReportValuta2","Year","CodePeriod","Value","Value1","Value2","CodeUser","DateEdit")
	SELECT NEW."CodeValutaRate",NEW."CodeValuta",NEW."CodeReportValuta",NEW."CodeReportValuta1",NEW."CodeReportValuta2",NEW."Year",NEW."CodePeriod",NEW."Value",NEW."Value1",NEW."Value2",NEW."CodeUser",(now());
	RETURN NEW;
END; $BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
ALTER FUNCTION public.trigger_on_valuta_rates()
  OWNER TO postgres;

