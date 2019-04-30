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
  "IdCell" int default -1,
  "CodeCell" varchar(900),
  "CodePeriod" varchar(900),
  "Year" int,
  "CodeUser" varchar(900),
  "CodeValuta" varchar(900),
  "Value" decimal(19,10),
  "CalcValue" varchar(900),
  "ReportValue" decimal(19,10),
  "ReportValue1" decimal(19,10),
  "ReportValue2" decimal(19,10),
  "Comment" varchar(900),
  "DateEdit" timestamp without time zone,
  "CodeRow" varchar(900),
  "CodeCol" varchar(900),
  "CodeObj" varchar(900)
);

INSERT INTO temp_cell ("CodeCell", "CodeUser", "CodePeriod", "Year",  "CodeValuta", "Value", "CalcValue", "Comment", "CodeRow", "CodeCol", "CodeObj")
SELECT "CodeCell", "CodeUser", "CodePeriod", "Year",  "CodeValuta", "Value", "CalcValue", "Comment", "CodeRow", "CodeCol", "CodeObj"
FROM json_to_recordset(data) as x(
  "CodeCell" varchar(900),
  "CodeUser" varchar(900),
  "CodePeriod" varchar(900),
  "Year" int,
  "CodeValuta" varchar(900),
  "Value" decimal(19,10),
  "CalcValue" varchar(900),
  "Comment" varchar(900),
  "CodeRow" varchar(900),
  "CodeCol" varchar(900),
  "CodeObj" varchar(900)
);

UPDATE temp_cell 
SET 
  "IdCell" = coalesce((SELECT "IdCell" FROM public.cells WHERE "CodeCell"=temp_cell."CodeCell"), 0),
  "DateEdit"=(now());


UPDATE temp_cell tempc
SET
  "ReportValue" = coalesce(tc."Value" , 0 ),
  "ReportValue1" = coalesce(tc."Value" , 0),
  "ReportValue2" = coalesce(tc."Value", 0)
FROM temp_cell as tc
WHERE tempc."CodeCell" = tc."CodeCell";

UPDATE temp_cell tempc
SET
  "ReportValue" = coalesce((tc."Value" * vr."Value"), 0 ),
  "ReportValue1" = coalesce((tc."Value" * vr."Value1"), 0),
  "ReportValue2" = coalesce((tc."Value" * vr."Value2"), 0)
FROM temp_cell as tc
INNER JOIN  public.valuta_rates AS vr ON vr."Year" = tc."Year" and vr."CodePeriod" = tc."CodePeriod" and vr."CodeValuta" = tc."CodeValuta"
WHERE tempc."CodeCell" = tc."CodeCell";

UPDATE  public.cells pubcel
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
  "ReportValue2" = tc."ReportValue2",
  "CodeRow" = tc."CodeRow",
  "CodeCol" = tc."CodeCol",
  "Comment" = tc."Comment",
  "CodeObj" = tc."CodeObj"
FROM public.cells AS cell
INNER JOIN temp_cell AS tc ON tc."CodeCell" = cell."CodeCell"
WHERE pubcel."CodeCell"=cell."CodeCell";

INSERT into public.cells ("CodeCell", "CodePeriod", "Year", "CodeUser", "CodeValuta", "Value", "CalcValue", "ReportValue", "ReportValue1", "ReportValue2", "Comment", "DateEdit", "CodeRow", "CodeCol", "CodeObj")
SELECT "CodeCell", "CodePeriod", "Year", "CodeUser", "CodeValuta", "Value", "CalcValue", "ReportValue", "ReportValue1", "ReportValue2", "Comment", "DateEdit", "CodeRow", "CodeCol", "CodeObj"
FROM temp_cell WHERE "IdCell"=0;



DROP TABLE temp_cell;

SELECT to_json(json_agg(r)) FROM  (SELECT "IdCell","CodeCell" FROM temp_cell) r INTO t_json; 
RETURN t_json; 

END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
ALTER FUNCTION public."SetCellsJSON"(json, integer)
  OWNER TO postgres;
