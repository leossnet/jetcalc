CREATE OR REPLACE FUNCTION public."GetCellsJSON"(result text,data json) RETURNS json AS 
$BODY$
  DECLARE t_json json;
  BEGIN
     EXECUTE ' SELECT to_json(json_agg(r))' ||
             ' FROM ( SELECT "'||replace(result,',','","')||'"'||
             ' FROM public.cells as cell WHERE "CodeCell" IN (select "CodeCell" as "CodeCell" from json_to_recordset($1) as x("CodeCell" text))) AS r' 
     USING data
     INTO t_json;
     RETURN t_json;
  END;
$BODY$ LANGUAGE plpgsql VOLATILE COST 100;