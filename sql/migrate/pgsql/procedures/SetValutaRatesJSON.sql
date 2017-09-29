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
  "Value" decimal(19,10),
  "Value1" decimal(19,10),
  "Value2" decimal(19,10),
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
    "Value" decimal(19,10),
    "Value1" decimal(19,10),
    "Value2" decimal(19,10),
    "CodeUser" varchar(900)
);

UPDATE temp_vr up_vr 
SET 
  "IdValutaRate" = coalesce(vr."IdValutaRate", 0),
  "DateEdit"=(now())
FROM temp_vr tvr
LEFT JOIN public.valuta_rates vr ON vr."CodeValutaRate" = tvr."CodeValutaRate"
WHERE tvr."CodeValutaRate" = up_vr."CodeValutaRate";

UPDATE  public.valuta_rates AS upr
SET
  "Value" = tvr."Value", 
  "Value1" = tvr."Value1", 
  "Value2" = tvr."Value2", 
  "CodeUser" = tvr."CodeUser", 
  "DateEdit"=(now())
FROM public.valuta_rates AS rate
INNER JOIN temp_vr AS tvr ON tvr."CodeValutaRate" = rate."CodeValutaRate"
WHERE upr."CodeValutaRate" = rate."CodeValutaRate";

UPDATE  public.cells AS tab
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