#!/bin/bash

export PGPASSWORD="postgres"

psql -h 127.0.0.1 -U postgres -w -f ./procedures/GetCellsHistoryJSON.sql -d jetcalc
psql -h 127.0.0.1 -U postgres -w -f ./procedures/GetCellsJSON.sql -d jetcalc
psql -h 127.0.0.1 -U postgres -w -f ./procedures/SetCellsJSON.sql -d jetcalc
psql -h 127.0.0.1 -U postgres -w -f ./procedures/SetValutaRatesJSON.sql -d jetcalc
