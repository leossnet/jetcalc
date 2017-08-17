module.exports = {
	"orggrp": {
		"tablename": "[link].[OrgGrps]",
		"menuplace": "Link",
		"fields": {
			"CodeOrgGrp": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"CodeOrg": {
				"type": String,
				"default": "",
				"view": "none",				
				"refmodel": "org",
				"index": true,
				"extended": true
			},
			"CodeGrp": {
				"type": String,
				"default": "",
				"view": "none",				
				"refmodel": "grp",
				"index": true,
				"extended": true
			}
		}
	},
	"format": {
		"tablename": "[spr].[Formats]",
		"menuplace": "Service",
		"fields": {
			"CodeFormat": {
				"type": String,
				"default": "NONE",
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameFormat": {
				"type": String,
				"default": "Noname format",
				"view": "all",
				"role": "name"
			},
			"SNameFormat": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"FormatValue": {
				"type": String,
				"default": "",
				"view": "none"
			}
		}
	},
	"objclass": {
		"tablename": "[spr].[ObjClasses]",
		"menuplace": "Service",
		"fields": {
			"CodeObjClass": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameObjClass": {
				"type": String,
				"default": "Noname class",
				"view": "all",
				"role": "name"
			},
			"SNameObjClass": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"Comment": {
				"type": String,
				"default": "",
				"view": "none"
			}
		}
	},
	"colsetcol": {
		"tablename": "[core].[ColsetCols]",
		"menuplace": "Core",
		"fields": {
			"CodeColsetCol": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameColsetCol": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "name"
			},
			"SNameColsetCol": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"IndexColsetCol": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"Condition": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"Year": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"IsFixed": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsControlPoint": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsNoRoles": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsHistory": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsAgFormula": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"AgFormula": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"IsAfFormula": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"AfFormula": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"CodeColset": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "colset",
				"index": true,
				"extended": true
			},
			"CodeCol": {
				"type": String,
				"default": "",
				"view": "none",				
				"refmodel": "col",
				"index": true,
				"extended": true
			},
			"CodePeriod": {
				"type": String,
				"default": "",
				"view": "none",				
				"refmodel": "period",
				"index": true,
				"extended": true
			},
			"CodeRole": {
				"type": String,
				"default": "",
				"view": "none",				
				"refmodel": "role",
				"index": true,
				"extended": true
			},
			"CodeValid": {
				"type": String,
				"default": "",
				"view": "none",				
				"refmodel": "valid",
				"index": true,
				"extended": true
			},
			"CodeStyle": {
				"type": String,
				"default": "",
				"view": "none",				
				"refmodel": "style",
				"index": true,
				"extended": true
			},
			"CodeDocSource": {
				"type": String,
				"default": "",
				"view": "none",				
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodeFormat": {
				"type": String,
				"default": "",
				"view": "none",				
				"refmodel": "format",
				"index": true,
				"extended": true
			},
			"AfPriority": {
				"type": Number,
				"default": 0,
				"view": "none"
			}
		}
	},
	"file": {
		"tablename": "[core].[Files]",
		"menuplace": "Core",
		"fields": {
			"CodeFile": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameFile": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "name"
			},
			"SNameFile": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"NumDoc": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"DateDoc": {
				"type": Date,
				"default": "1970-01-01T00:00:00.000Z",
				"view": "none"
			},
			"HashCode": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"Comment": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"CodeFileType": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "filetype",
				"index": true,
				"extended": true
			},
			"CodeUser": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "user",
				"index": true,
				"extended": true
			}
		}
	},
	"periodautofill": {
		"tablename": "[link].[PeriodAutofills]",
		"menuplace": "Link",
		"fields": {
			"CodePeriodAutofill": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"CodeSourcePeriod": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "period",
				"index": true,
				"extended": true
			},
			"CodeTargetPeriod": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "period",
				"index": true,
				"extended": true
			}
		}
	},
	"paramsetkey": {
		"tablename": "[link].[ParamSetKeys]",
		"menuplace": "Link",
		"fields": {
			"CodeParamSetKey": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"KeyValue": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"CodeParamSet": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "paramset",
				"index": true,
				"extended": true
			},
			"CodeParamKey": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "paramkey",
				"index": true,
				"extended": true
			}
		}
	},
	"charttype": {
		"tablename": "[spr].[ChartTypes]",
		"menuplace": "Service",
		"fields": {
			"CodeChartType": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameChartType": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "name"
			},
			"SNameChartType": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"LibCodeChartType": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"DefaultSizeWidth": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"DefaultSizeHeight": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"DefaultInteraction": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"DefaultShowGridX": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"DefaultShowGridY": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"DefaultLegentPositionBottom": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"DefaultLegentPositionRight": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"DefaultLegentPositionInset": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"DefaultShowValued": {
				"type": Number,
				"default": 0,
				"view": "none"
			}
		}
	},
	"present": {
		"tablename": "[core].[Presents]",
		"menuplace": "Core",
		"fields": {
			"CodePresent": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NamePresent": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "name"
			},
			"SNamePresent": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"PresentHeader": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"PresenFooter": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"IsAutoPlay": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"AutoPlayInterval": {
				"type": Number,
				"default": 10,
				"view": "none"
			},
			"IsLoop": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsShowNavigation": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"CodeDoc": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodePresentThema": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "presentthema",
				"index": true,
				"extended": true
			},
			"CodePresentTransitType": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "presenttransittype",
				"index": true,
				"extended": true
			}
		}
	},
	"rowcoloption": {
		"tablename": "[link].[RowColOptions]",
		"menuplace": "Link",
		"fields": {
			"CodeRowColOption": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IsEditable": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"UseFormula": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"CodeRow": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "row",
				"index": true,
				"extended": true
			},
			"CodeCol": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "col",
				"index": true,
				"extended": true
			}
		}
	},
	"style": {
		"tablename": "[spr].[Styles]",
		"menuplace": "Service",
		"fields": {
			"CodeStyle": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameStyle": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "name"
			},
			"SNameStyle": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"CSS": {
				"type": String,
				"default": "",
				"view": "none"
			}
		}
	},
	"docfolder": {
		"tablename": "[core].[DocFolders]",
		"menuplace": "Core",
		"fields": {
			"CodeDocFolder": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameDocFolder": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "name"
			},
			"SNameDocFolder": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"NumDocFolder": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"IndexDocFolder": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"CodeParentDocFolder": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "docfolder",
				"index": true,
				"extended": true
			}
		}
	},
	"filetype": {
		"tablename": "[spr].[FileTypes]",
		"menuplace": "Service",
		"fields": {
			"CodeFileType": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameFileType": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "name"
			},
			"SNameFileType": {
				"type": String,
				"default": null,
				"view": "none"
			}
		}
	},
	"coltag": {
		"tablename": "[link].[ColTags]",
		"menuplace": "Link",
		"fields": {
			"Value": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"CodeColTag": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"CodeCol": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "col",
				"index": true,
				"extended": true
			},
			"CodeTag": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "tag",
				"index": true,
				"extended": true
			}
		}
	},
	"valid": {
		"tablename": "[spr].[Valids]",
		"menuplace": "Service",
		"fields": {
			"CodeValid": {
				"type": String,
				"default": "NONE",
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameValid": {
				"type": String,
				"default": "Noname valid",
				"view": "all",
				"role": "name"
			},
			"SNameValid": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"Value": {
				"type": String,
				"default": "",
				"view": "none"
			}
		}
	},
	"data": {
		"tablename": "[core].[Data]",
		"menuplace": "Core",
		"fields": {
			"YearData": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"CodeData": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"CodeDoc": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodePeriod": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "period",
				"index": true,
				"extended": true
			},
			"CodeObj": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "obj",
				"index": true,
				"extended": true
			},
			"CodeState": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "state",
				"index": true,
				"extended": true
			}
		}
	},
	"col": {
		"tablename": "[core].[Cols]",
		"menuplace": "Core",
		"fields": {
			"CodeCol": {
				"type": String,
				"default": "NONE",
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameCol": {
				"type": String,
				"default": "Noname col",
				"view": "all",
				"role": "name"
			},
			"SNameCol": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"Comment": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"IsFormula": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"Formula": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"DoSum": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"NoCalcSum": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"NoCalcSumHard": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"DoExRef": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"AsAgFormula": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsAgFormula": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"AgFormula": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"IsVirtual": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"CodeValuta": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "valuta",
				"index": true,
				"extended": true
			}
		}
	},
	"privelege": {
		"tablename": "[spr].[Priveleges]",
		"menuplace": "Service",
		"fields": {
			"CodePrivelege": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NamePrivelege": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "name"
			},
			"SNamePrivelege": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"ModuleName": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"ModuleSName": {
				"type": String,
				"default": null,
				"view": "none"
			}
		}
	},
	"statecalendar": {
		"tablename": "[spr].[StateCalendar]",
		"menuplace": "Service",
		"fields": {
			"CodeStateCalendar": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameStateCalendar": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "name"
			},
			"SNameStateCalendar": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"DaysClosed": {
				"type": Number,
				"default": 30,
				"view": "none"
			},
			"CodeRole": {
				"type": String,
				"default": "",
				"view": "none",				
				"refmodel": "role",
				"index": true,
				"extended": true
			}
		}
	},
	"valutarate": {
		"tablename": "[link].[ValutaRates]",
		"menuplace": "Link",
		"fields": {
			"CodeValutaRate": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"Year": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"Value": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"Value1": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"Value2": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"CodeValuta": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "valuta",
				"index": true,
				"extended": true
			},
			"CodeReportValuta": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "valuta",
				"index": true,
				"extended": true
			},
			"CodeReportValuta1": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "valuta",
				"index": true,
				"extended": true
			},
			"CodeReportValuta2": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "valuta",
				"index": true,
				"extended": true
			},
			"CodePeriod": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "period",
				"index": true,
				"extended": true
			}
		}
	},
	"sumgrp": {
		"tablename": "[spr].[SumGrps]",
		"menuplace": "Service",
		"fields": {
			"CodeSumGrp": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameSumGrp": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "name"
			},
			"SNameSumGrp": {
				"type": String,
				"default": "",
				"view": "none"
			}
		}
	},
	"virtualdocbase": {
		"tablename": "[link].[VirtualDocBases]",
		"menuplace": "Link",
		"fields": {
			"CodeVirtualDocBase": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"CodeDoc": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodeDocBase": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "doc",
				"index": true,
				"extended": true
			}
		}
	},
	"measure": {
		"tablename": "[spr].[Measures]",
		"menuplace": "Service",
		"fields": {
			"CodeMeasure": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameMeasure": {
				"type": String,
				"default": "Noname measure",
				"view": "all",
				"role": "name"
			},
			"SNameMeasure": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"NumMeasure": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"Comment": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"IsExchange": {
				"type": Boolean,
				"default": false,
				"view": "none"
			}
		}
	},
	"role": {
		"tablename": "[spr].[Roles]",
		"menuplace": "Service",
		"fields": {
			"CodeRole": {
				"type": String,
				"default": "NONE",
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameRole": {
				"type": String,
				"default": "Noname role",
				"view": "all",
				"role": "name"
			},
			"SNameRole": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"ForAdmin": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"ForDivAdmin": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"ForOrgAdmin": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"ForDepAdmin": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsExtended": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"CodeModel": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "model",
				"index": true,
				"extended": true
			}
		}
	},
	"presentslide": {
		"tablename": "[core].[PresentSlides]",
		"menuplace": "Core",
		"fields": {
			"CodePresentSlide": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NamePresentSlide": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "name"
			},
			"SNamePresentSlide": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"PresentSlideHeder": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"PresentSlideFooter": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"CodePresent": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "present",
				"index": true,
				"extended": true
			},
			"CodePresentTransitType": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "presenttransittype",
				"index": true,
				"extended": true
			},
			"CodePresentSlideLayout": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "presentslidelayout",
				"index": true,
				"extended": true
			}
		}
	},
	"header": {
		"tablename": "[core].[Headers]",
		"menuplace": "Core",
		"fields": {
			"CodeHeader": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameHeader": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "name"
			},
			"SNameHeader": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"IndexHeader": {
				"type": Number,
				"default": -1,
				"view": "none"
			},
			"Condition": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"Year": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"IsFixed": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsControlPoint": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsNoRoles": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsHistory": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsPublic": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"CodeColset": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "colset",
				"index": true,
				"extended": true
			},
			"CodeParentHeader": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "header",
				"index": true,
				"extended": true
			},
			"CodePeriod": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "period",
				"index": true,
				"extended": true
			},
			"CodeRole": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "role",
				"index": true,
				"extended": true
			},
			"CodeValid": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "valid",
				"index": true,
				"extended": true
			},
			"CodeStyle": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "style",
				"index": true,
				"extended": true
			}
		}
	},
	"chart": {
		"tablename": "[core].[Charts]",
		"menuplace": "Core",
		"fields": {
			"CodeChart": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameChart": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "name"
			},
			"SNameChart": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"UseGrid": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"UseLegend": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"UseSizeWidth": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"UseSizeHeight": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"UseInteraction": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"UseShowGridX": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"UseShowGridY": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"UseLegentPositionBottom": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"UseLegentPositionRight": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"UseLegentPositionInset": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"UseShowValues": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"CodeDoc": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodeChartType": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "charttype",
				"index": true,
				"extended": true
			}
		}
	},
	"docrelation": {
		"tablename": "[link].[DocRelations]",
		"menuplace": "Link",
		"fields": {
			"CodeDocRelation": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"DoSetTree": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"DoFillCell": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsOuterLink": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsMirror": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"CodeDocSourse": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodeDocTarget": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodeGrpSource": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "grp",
				"index": true,
				"extended": true
			},
			"CodeGrpTarget": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "grp",
				"index": true,
				"extended": true
			}
		}
	},
	"depart": {
		"tablename": "[core].[Departs]",
		"menuplace": "Core",
		"fields": {
			"CodeDepart": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameDepart": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "name"
			},
			"SNameDepart": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"CodeParentDepart": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "depart",
				"index": true,
				"extended": true
			},
			"CodeOrg": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "org",
				"index": true,
				"extended": true
			},
			"CodeChiefUser": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "user",
				"index": true,
				"extended": true
			}
		}
	},
	"statecalendardate": {
		"tablename": "[link].[StateCalendarDates]",
		"menuplace": "Link",
		"fields": {
			"CodeStateCalendarDate": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"YearReport": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"Year": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"DateClosed": {
				"type": Date,
				"default": null,
				"view": "none"
			},
			"DateAgreed": {
				"type": Date,
				"default": null,
				"view": "none"
			},
			"CodeStateCalendar": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "statecalendar",
				"index": true,
				"extended": true
			},
			"CodePeriod": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "period",
				"index": true,
				"extended": true
			}
		}
	},
	"taskprivelege": {
		"tablename": "[link].[TaskPriveleges]",
		"menuplace": "Link",
		"fields": {
			"CodeTaskPrivelege": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"CodeTask": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "task",
				"index": true,
				"extended": true
			},
			"CodePrivelege": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "privelege",
				"index": true,
				"extended": true
			}
		}
	},
	"rowsumgrp": {
		"tablename": "[link].[RowSumGrps]",
		"menuplace": "Link",
		"fields": {
			"CodeRowSumGrp": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"CodeSumGrp": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "sumgrp",
				"index": true,
				"extended": true
			},
			"CodeRow": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "row",
				"index": true,
				"extended": true
			}
		}
	},
	"task": {
		"tablename": "[spr].[Tasks]",
		"menuplace": "Service",
		"fields": {
			"CodeTask": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameTask": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "name"
			},
			"SNameTask": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"CodeDepart": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "depart",
				"index": true,
				"extended": true
			},
			"CodeModel": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "model",
				"index": true,
				"extended": true
			}
		}
	},
	"colsetcolperiodgrp": {
		"tablename": "[link].[ColsetColPeriodGrps]",
		"menuplace": "Link",
		"fields": {
			"CodeColsetColPeriodGrp": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"CodeColsetCol": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "colsetcol",
				"index": true,
				"extended": true
			},
			"CodePeriodGrp": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "periodgrp",
				"index": true,
				"extended": true
			}
		}
	},
	"doc": {
		"tablename": "[core].[Docs]",
		"menuplace": "Core",
		"fields": {
			"CodeDoc": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameDoc": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "name"
			},
			"SNameDoc": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"PrintNameDoc": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"PrintNumDoc": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"FirstYear": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"IsDesigner": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsTester": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsOverPeriodBlock": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"HasChildObjs": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IndexDoc": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"IsShowRoots": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsPrimary": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsAnalytic": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsOlap": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsInput": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsChart": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsPresent": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsDivObj": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsObjToRow": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsShowParentObj": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsBiztranDoc": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"UseProd": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"UseOrg": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"UseDogovor": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"UseDogovorArt": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsShowMeasure": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"UseOrgGroup": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"UseSelfOrg": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsInnerOrg": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsVirtual": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsObjTree": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsRelBiztranDoc": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"CodeDocType": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "doctype",
				"index": true,
				"extended": true
			},
			"CodeRole": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "role",
				"index": true,
				"extended": true
			},
			"CodeGrp": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "grp",
				"index": true,
				"extended": true
			},
			"CodeModel": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "model",
				"index": true,
				"extended": true
			},
			"CodeMeasure": {
				"type": String,
				"default": "",
				"view": "none",				
				"refmodel": "measure",
				"index": true,
				"extended": true
			},
			"CodeStyleSubtotal": {
				"type": String,
				"default": "",
				"view": "none",				
				"refmodel": "style",
				"index": true,
				"extended": true
			},
			"CodeStyleTotal": {
				"type": String,
				"default": "",
				"view": "none",				
				"refmodel": "style",
				"index": true,
				"extended": true
			}
		}
	},
	"docbill": {
		"tablename": "[link].[DocBills]",
		"menuplace": "Link",
		"fields": {
			"CodeDocBill": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"CodeDoc": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodeBill": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "bill",
				"index": true,
				"extended": true
			}
		}
	},
	"colset": {
		"tablename": "[core].[Colsets]",
		"menuplace": "Core",
		"fields": {
			"CodeColset": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameColset": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "name"
			},
			"SNameColset": {
				"type": String,
				"default": "",
				"view": "none"
			}
		}
	},
	"country": {
		"tablename": "[spr].[Countries]",
		"menuplace": "Service",
		"fields": {
			"CodeCountry": {
				"type": String,
				"default": "NONE",
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameCountry": {
				"type": String,
				"default": "Noname Country",
				"view": "all",
				"role": "name"
			},
			"SNameCountry": {
				"type": String,
				"default": "",
				"view": "none"
			}
		}
	},
	"reportparamkey": {
		"tablename": "[link].[ReportParamKeys]",
		"menuplace": "Link",
		"fields": {
			"CodeReportParamKey": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"CodeReport": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "report",
				"index": true,
				"extended": true
			},
			"CodeParam": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "param",
				"index": true,
				"extended": true
			},
			"CodeParamSet": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "paramset",
				"index": true,
				"extended": true
			}
		}
	},
	"bill": {
		"tablename": "[spr].[Bills]",
		"menuplace": "Service",
		"fields": {
			"CodeBill": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameBill": {
				"type": String,
				"default": "Noname  bill",
				"view": "all",
				"role": "name"
			},
			"SNameBill": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"NumBill": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"Comment": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"UseAltOrg": {
				"type": Boolean,
				"default": false,
				"view": "none"
			}
		}
	},
	"billrelation": {
		"tablename": "[link].[BillRelations]",
		"menuplace": "Link",
		"fields": {
			"CodeBillRelation": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IsNotGrpSource": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsNotGrpTarget": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsMirror": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"CodeBillSource": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "bill",
				"index": true,
				"extended": true
			},
			"CodeBillTarget": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "bill",
				"index": true,
				"extended": true
			},
			"CodeGrpSource": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "grp",
				"index": true,
				"extended": true
			},
			"CodeGrpTarget": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "grp",
				"index": true,
				"extended": true
			}
		}
	},
	"status": {
		"tablename": "[spr].[Status]",
		"menuplace": "Service",
		"fields": {
			"CodeStatus": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameStatus": {
				"type": String,
				"default": "Noname status",
				"view": "all",
				"role": "name"
			},
			"SNameStatus": {
				"type": String,
				"default": "",
				"view": "none"
			}
		}
	},
	"docfolderdoc": {
		"tablename": "[link].[DocFolderDocs]",
		"menuplace": "Link",
		"fields": {
			"CodeDocFolderDoc": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"CodeDoc": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodeDocFolder": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "docfolder",
				"index": true,
				"extended": true
			}
		}
	},
	"rowobj": {
		"tablename": "[link].[RowObjs]",
		"menuplace": "Link",
		"fields": {
			"CodeRowObj": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IsAccept": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"HasData": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"CodeRow": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "row",
				"index": true,
				"extended": true
			},
			"CodeObj": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "obj",
				"index": true,
				"extended": true
			},
			"CodeGrp": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "grp",
				"index": true,
				"extended": true
			},
			"CodeObjType": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "objtype",
				"index": true,
				"extended": true
			}
		}
	},
	"userfavorite": {
		"tablename": "[link].[UserFavorites]",
		"menuplace": "Link",
		"fields": {
			"CodeUserFavorite": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"Year": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"CodeUser": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "user",
				"index": true,
				"extended": true
			},
			"CodeDoc": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodeObj": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "obj",
				"index": true,
				"extended": true
			},
			"CodeDiv": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "div",
				"index": true,
				"extended": true
			},
			"CodeOtrasl": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "otrasl",
				"index": true,
				"extended": true
			},
			"CodeRegion": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "region",
				"index": true,
				"extended": true
			},
			"CodeGrp": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "grp",
				"index": true,
				"extended": true
			},
			"CodePeriod": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "period",
				"index": true,
				"extended": true
			}
		}
	},
	"presetslot": {
		"tablename": "[core].[PresentSlots]",
		"menuplace": "Core",
		"fields": {
			"CodePresentSlot": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"NamePresentSlot": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"SNamePresentSlot": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"YearData": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"CodePresentSlide": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "presentslide",
				"index": true,
				"extended": true
			},
			"CodeDoc": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodeReport": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "report",
				"index": true,
				"extended": true
			},
			"CodePeriod": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "period",
				"index": true,
				"extended": true
			},
			"CodeValuta": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "valuta",
				"index": true,
				"extended": true
			}
		}
	},
	"colrelation": {
		"tablename": "[link].[ColRelations]",
		"menuplace": "Link",
		"fields": {
			"CodeColRelation": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IsAfFormula": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"AfFormula": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"CodeDocRelation": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "docrelation",
				"index": true,
				"extended": true
			},
			"CodeColSource": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "col",
				"index": true,
				"extended": true
			},
			"CodeColTarget": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "col",
				"index": true,
				"extended": true
			}
		}
	},
	"doctype": {
		"tablename": "[spr].[DocTypes]",
		"menuplace": "Service",
		"fields": {
			"CodeDocType": {
				"type": String,
				"default": "NONE",
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameDocType": {
				"type": String,
				"default": "Noname doctype",
				"view": "all",
				"role": "name"
			},
			"SNameDocType": {
				"type": String,
				"default": "",
				"view": "none"
			}
		}
	},
	"colsetcolgrp": {
		"tablename": "[link].[ColsetColGrps]",
		"menuplace": "Link",
		"fields": {
			"NotInGrp": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"CodeColsetColGrp": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"CodeColsetCol": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "colsetcol",
				"index": true,
				"extended": true
			},
			"CodeGrp": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "grp",
				"index": true,
				"extended": true
			}
		}
	},
	"region": {
		"tablename": "[spr].[Regions]",
		"menuplace": "Service",
		"fields": {
			"CodeRegion": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameRegion": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "name"
			},
			"SNameRegion": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"CodeCountry": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "country",
				"index": true,
				"extended": true
			}
		}
	},
	"docpacket": {
		"tablename": "[link].[DocPackets]",
		"menuplace": "Link",
		"fields": {
			"CodeDocPacket": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"CodeDoc": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodePacket": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "doc",
				"index": true,
				"extended": true
			}
		}
	},
	"dogovortype": {
		"tablename": "[spr].[DogovorTypes]",
		"menuplace": "Service",
		"fields": {
			"CodeDogovorType": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameDogovorType": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "name"
			},
			"SNameDogovorType": {
				"type": String,
				"default": null,
				"view": "none"
			}
		}
	},
	"prod": {
		"tablename": "[spr].[Prods]",
		"menuplace": "Service",
		"fields": {
			"CodeProd": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameProd": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "name"
			},
			"SNameProd": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"NumProd": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"Comment": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"IsCalcSum": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"CodeMeasure": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "measure",
				"index": true,
				"extended": true
			},
			"CodeParentProd": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "prod",
				"index": true,
				"extended": true
			}
		}
	},
	"docrow": {
		"tablename": "[link].[DocRows]",
		"menuplace": "Link",
		"fields": {
			"CodeDocRow": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IsExpandTree": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IndexRow": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"PrintNameRow": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"CodeDoc": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodeRow": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "row",
				"index": true,
				"extended": true
			}
		}
	},
	"listdef": {
		"tablename": "[core].[ListDefs]",
		"menuplace": "Core",
		"fields": {
			"CodeListDef": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameListDef": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "name"
			},
			"SNameListDef": {
				"type": String,
				"default": "",
				"view": "none"
			}
		}
	},
	"periodedit": {
		"tablename": "[link].[PeriodEdits]",
		"menuplace": "Link",
		"fields": {
			"CodePeriodEdit": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"Year": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"IsEdit": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"CodeRole": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "role",
				"index": true,
				"extended": true
			},
			"CodePeriod": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "period",
				"index": true,
				"extended": true
			}
		}
	},
	"listdefinition": {
		"tablename": "[spr].[ListDefinitions]",
		"menuplace": "Service",
		"fields": {
			"CodeListDefinition": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameListDefinition": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "name"
			},
			"SNameListDefinition": {
				"type": String,
				"default": "",
				"view": "none"
			}
		}
	},
	"obj": {
		"tablename": "[core].[Objs]",
		"menuplace": "Core",
		"fields": {
			"CodeObj": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameObj": {
				"type": String,
				"default": "Noname Obj",
				"view": "all",
				"role": "name"
			},
			"SNameObj": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"NumObj": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"IsShow": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsFormula": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"Formula": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"IndexObj": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"Comment": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"IsAfFormula": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"AfFormula": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"IsRowEditFilter": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"DateBegin": {
				"type": Date,
				"default": "1970-01-01T00:00:00.000Z",
				"view": "none"
			},
			"DateEnd": {
				"type": Date,
				"default": "1970-01-01T00:00:00.000Z",
				"view": "none"
			},
			"CodeParentObj": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "obj",
				"index": true,
				"extended": true
			},
			"CodeOrg": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "org",
				"index": true,
				"extended": true
			},
			"CodeObjType": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "objtype",
				"index": true,
				"extended": true
			},
			"CodeValuta": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "valuta",
				"index": true,
				"extended": true
			},
			"CodeGrpEditFilter": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "grp",
				"index": true,
				"extended": true
			},
			"CodeStatus": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "status",
				"index": true,
				"extended": true
			},
			"CodePriority": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "priority",
				"index": true,
				"extended": true
			}
		}
	},
	"periodredirect": {
		"tablename": "[link].[PeriodRedirects]",
		"menuplace": "Link",
		"fields": {
			"CodePeriodRedirect": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NotGrp": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"CodeDocType": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "doctype",
				"index": true,
				"extended": true
			},
			"CodeGrp": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "grp",
				"index": true,
				"extended": true
			},
			"CodePeriod": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "period",
				"index": true,
				"extended": true
			},
			"CodePeriodToRedirect": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "period",
				"index": true,
				"extended": true
			}
		}
	},
	"orggroup": {
		"tablename": "[link].[OrgGroups]",
		"menuplace": "Link",
		"fields": {
			"CodeOrgGroup": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"CodeDoc": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodeGrp": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "grp",
				"index": true,
				"extended": true
			}
		}
	},
	"priority": {
		"tablename": "[spr].[Prioritys]",
		"menuplace": "Service",
		"fields": {
			"CodePriority": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NamePriority": {
				"type": String,
				"default": "Noname status",
				"view": "all",
				"role": "name"
			},
			"SNamePriority": {
				"type": String,
				"default": "",
				"view": "none"
			}
		}
	},
	"city": {
		"tablename": "[spr].[Cities]",
		"menuplace": "Service",
		"fields": {
			"CodeCity": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameCity": {
				"type": String,
				"default": "Noname City",
				"view": "all",
				"role": "name"
			},
			"Comment": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"CodeRegion": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "region",
				"index": true,
				"extended": true
			}
		}
	},
	"dogovor": {
		"tablename": "[core].[Dogovors]",
		"menuplace": "Core",
		"fields": {
			"CodeDogovor": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameDogovor": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "name"
			},
			"SNameDogovor": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"NumDogovor": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"DateDogovor": {
				"type": Date,
				"default": "1970-01-01T00:00:00.000Z",
				"view": "none"
			},
			"BeginDate": {
				"type": Date,
				"default": "1970-01-01T00:00:00.000Z",
				"view": "none"
			},
			"EndDate": {
				"type": Date,
				"default": "1970-01-01T00:00:00.000Z",
				"view": "none"
			},
			"DelayDate": {
				"type": Date,
				"default": "1970-01-01T00:00:00.000Z",
				"view": "none"
			},
			"SummaDogovor": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"IsAddDogovor": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsGarantDogovor": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"Comment": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"CodeOrg": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "org",
				"index": true,
				"extended": true
			},
			"CodeAltOrg": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "org",
				"index": true,
				"extended": true
			},
			"CodeThirdOrg": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "org",
				"index": true,
				"extended": true
			},
			"CodeDogovorType": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "dogovortype",
				"index": true,
				"extended": true
			},
			"CodeParentDogovor": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "dogovor",
				"index": true,
				"extended": true
			},
			"CodeValuta": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "valuta",
				"index": true,
				"extended": true
			}
		}
	},
	"function": {
		"tablename": "[spr].[Functions]",
		"menuplace": "Service",
		"fields": {
			"CodeFunction": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameFunction": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "name"
			},
			"SNameFunction": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"IsAdm": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsAdmin": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsDepAdmin": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsDivAdmin": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsOrgAdmin": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsTester": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsDesigner": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsOverDocBlock": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsOverPeriodBlock": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsOverControlPoint": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsHoldBlocker": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsDivBlocker": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsDocWriter": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"DoResetPass": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsHeaderTuner": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsColsetTuner": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsRowTuner": {
				"type": Boolean,
				"default": false,
				"view": "none"
			}
		}
	},
	"docheader": {
		"tablename": "[link].[DocHeaders]",
		"menuplace": "Link",
		"fields": {
			"IsInput": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"CodeDocHeader": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"CodeDoc": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodeHeader": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "header",
				"index": true,
				"extended": true
			},
			"IndexDocHeader": {
				"type": Number,
				"default": -1,
				"index": true
			},
			"CodePeriodGrp": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "periodgrp",
				"index": true,
				"extended": true
			}
		}
	},
	"paramset": {
		"tablename": "[spr].[ParamSets]",
		"menuplace": "Service",
		"fields": {
			"CodeParamSet": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameParamSet": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "name"
			},
			"SNameParamSet": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"CodeListDefinition": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "listdefinition",
				"index": true,
				"extended": true
			}
		}
	},
	"rowchartline": {
		"tablename": "[link].[RowChartLines]",
		"menuplace": "Link",
		"fields": {
			"CodeRowChartLine": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"ColorCorrection": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"CodeDoc": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodeRow": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "row",
				"index": true,
				"extended": true
			},
			"CodeChartColor": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "chartcolor",
				"index": true,
				"extended": true
			}
		}
	},
	"paramtab": {
		"tablename": "[spr].[ParamTabs]",
		"menuplace": "Service",
		"fields": {
			"CodeParamTab": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameParamTab": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "name"
			},
			"SNameParamTab": {
				"type": String,
				"default": "",
				"view": "none"
			}
		}
	},
	"request": {
		"tablename": "[core].[Requests]",
		"menuplace": "Core",
		"fields": {
			"CodeRequest": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"DateRequest": {
				"type": Date,
				"default": null,
				"view": "none"
			},
			"NameUser": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"JobTitle": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"TabNum": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"Birthday": {
				"type": Date,
				"default": "1970-01-01T00:00:00.000Z",
				"view": "none"
			},
			"WorkPhone": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"MobilePhone": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"Mail": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"NameObjs": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"NameRoles": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"Photo": {
				"type": "Buffer",
				"default": null,
				"view": "none"
			},
			"Comments": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"LoginUser": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"IsAccept": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"ScanRequest": {
				"type": "Buffer",
				"default": null,
				"view": "none"
			},
			"IsVerified": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"CodeObj": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "obj",
				"index": true,
				"extended": true
			}
		}
	},
	"usertask": {
		"tablename": "[link].[UserTasks]",
		"menuplace": "Link",
		"fields": {
			"CodeUserTask": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"CodeUser": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "user",
				"index": true,
				"extended": true
			},
			"CodeTask": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "task",
				"index": true,
				"extended": true
			},
			"CodeObj": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "obj",
				"index": true,
				"extended": true
			},
			"CodeObjGrp": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "grp",
				"index": true,
				"extended": true
			},
			"CodeDoc": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodeRole": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "role",
				"index": true,
				"extended": true
			},
			"CodePeriod": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "period",
				"index": true,
				"extended": true
			},
			"CodePeriodGrp": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "periodgrp",
				"index": true,
				"extended": true
			}
		}
	},
	"div": {
		"tablename": "[spr].[Divs]",
		"menuplace": "Service",
		"fields": {
			"CodeDiv": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameDiv": {
				"type": String,
				"default": "Noname Division",
				"view": "all",
				"role": "name"
			},
			"SNameDiv": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"Comment": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"CodeDivOrg": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "org",
				"index": true,
				"extended": true
			}
		}
	},
	"action": {
		"tablename": "[spr].[Actions]",
		"menuplace": "Service",
		"fields": {
			"CodeAction": {
				"type": String,
				"default": "NONE",
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameAction": {
				"type": String,
				"default": "Noname action",
				"view": "all",
				"role": "name"
			},
			"SNameAction": {
				"type": String,
				"default": "",
				"view": "none"
			}
		}
	},
	"permit": {
		"tablename": "[core].[Permits]",
		"menuplace": "Core",
		"fields": {
			"CodePermit": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NamePermit": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "name"
			},
			"SNamePermit": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"IsPersonal": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsPublic": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"CodeObj": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "obj",
				"index": true,
				"extended": true
			}
		}
	},
	"paramkey": {
		"tablename": "[spr].[ParamKeys]",
		"menuplace": "Service",
		"fields": {
			"CodeParamKey": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameParamKey": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "name"
			},
			"SNameParamKey": {
				"type": String,
				"default": "",
				"view": "none"
			}
		}
	},
	"paramgrp": {
		"tablename": "[spr].[ParamGrps]",
		"menuplace": "Service",
		"fields": {
			"CodeParamGrp": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameParamGrp": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "name"
			},
			"SNameParamGrp": {
				"type": String,
				"default": "",
				"view": "none"
			}
		}
	},
	"reportrow": {
		"tablename": "[link].[ReportRows]",
		"menuplace": "Link",
		"fields": {
			"CodeReportRow": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IsHidden": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsToggled": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsShowOlap": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsShowWithParent": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsShowWithChildren": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IndexReportRow": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"CodeReport": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "report",
				"index": true,
				"extended": true
			},
			"CodeRow": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "row",
				"index": true,
				"extended": true
			}
		}
	},
	"dogovorart": {
		"tablename": "[spr].[DogovorArts]",
		"menuplace": "Service",
		"fields": {
			"CodeDogovorArt": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameDogovorArt": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "name"
			},
			"SNameDogovorArt": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"CodeValuta": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "valuta",
				"index": true,
				"extended": true
			}
		}
	},
	"tagdef": {
		"tablename": "[spr].[TagDefs]",
		"menuplace": "Service",
		"fields": {
			"CodeTagDef": {
				"type": String,
				"default": "NONE",
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameTagDef": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "name"
			},
			"Value": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"CodeTag": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "tag",
				"index": true,
				"extended": true
			}
		}
	},
	"row": {
		"tablename": "[core].[Rows]",
		"menuplace": "Core",
		"fields": {
			"CodeRow": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameRow": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "name"
			},
			"SNameRow": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"IndexRow": {
				"type": Number,
				"default": -1,
				"view": "none"
			},
			"NumRow": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"IsFormula": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"Formula": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"Link": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"IsSum": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"NoSum": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsMinus": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsAnalytic": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsControlPoint": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsCalcSum": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"NoOutput": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"NoInput": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsAgFormula": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"AgFormula": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"IsAfFormula": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"AfFormula": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"AsAgFormula": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"HasFilteredChild": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"NoFiltered": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"FromObsolete": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"FromYear": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"NoDoSum": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"UseProdSumGrps": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"FormulaFromYear": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"FormulaFromObsolete": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"IsVirtual": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"CodeParentRow": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "row",
				"index": true,
				"extended": true
			},
			"CodeValuta": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "valuta",
				"index": true,
				"extended": true
			},
			"CodeMeasure": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "measure",
				"index": true,
				"extended": true
			},
			"CodeFormat": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "format",
				"index": true,
				"extended": true
			},
			"CodeStyle": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "style",
				"index": true,
				"extended": true
			},
			"CodeBill": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "bill",
				"index": true,
				"extended": true
			},
			"CodeProd": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "prod",
				"index": true,
				"extended": true
			},
			"CodeAltOrg": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "org",
				"index": true,
				"extended": true
			},
			"CodeFilteredAltGrp": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "grp",
				"index": true,
				"extended": true
			},
			"CodeDogovor": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "dogovor",
				"index": true,
				"extended": true
			},
			"CodeDogovorArt": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "dogovorart",
				"index": true,
				"extended": true
			},
			"CodeGrpEditFilter": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "grp",
				"index": true,
				"extended": true
			},
			"CodeRowLink": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "row",
				"index": true,
				"extended": true
			},
			"AfPriority": {
				"type": Number,
				"default": 0,
				"view": "none"
			}
		}
	},
	"routefiletype": {
		"tablename": "[link].[RouteFileTypes]",
		"menuplace": "Link",
		"fields": {
			"CodeRouteFileType": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"CodeRoute": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "route",
				"index": true,
				"extended": true
			},
			"CodeDoc": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodeFileType": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "filetype",
				"index": true,
				"extended": true
			},
			"CodePeriod": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "period",
				"index": true,
				"extended": true
			},
			"CodePeriodGrp": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "periodgrp",
				"index": true,
				"extended": true
			}
		}
	},
	"dogovortypeart": {
		"tablename": "[link].[DogovorTypeArts]",
		"menuplace": "Link",
		"fields": {
			"CodeDogovorTypeArt": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IsDefault": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"NoSum": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"CodeDogovorType": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "dogovortype",
				"index": true,
				"extended": true
			},
			"CodeDogovorArt": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "dogovorart",
				"index": true,
				"extended": true
			}
		}
	},
	"presentthema": {
		"tablename": "[spr].[PresentThemas]",
		"menuplace": "Service",
		"fields": {
			"CodePresentThema": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"LibCodePresentThema": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"NamePresentThema": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "name"
			},
			"SNamePresentThema": {
				"type": String,
				"default": null,
				"view": "none"
			}
		}
	},
	"objgrp": {
		"tablename": "[link].[ObjGrps]",
		"menuplace": "Link",
		"fields": {
			"CodeObjGrp": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"CodeObj": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "obj",
				"index": true,
				"extended": true
			},
			"CodeGrp": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "grp",
				"index": true,
				"extended": true
			}
		}
	},
	"model": {
		"tablename": "[core].[Models]",
		"menuplace": "Core",
		"fields": {
			"CodeModel": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameModel": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "name"
			},
			"SNameModel": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"VersionModel": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"YearModel": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"AuthorModel": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"DescriptionModel": {
				"type": String,
				"default": null,
				"view": "none"
			}
		}
	},
	"state": {
		"tablename": "[spr].[States]",
		"menuplace": "Service",
		"fields": {
			"CodeState": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameState": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "name"
			},
			"SNameState": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"IsDefault": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsOpened": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsClosed": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsAgreed": {
				"type": Boolean,
				"default": false,
				"view": "none"
			}
		}
	},
	"otrasl": {
		"tablename": "[spr].[Otrasls]",
		"menuplace": "Service",
		"fields": {
			"CodeOtrasl": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameOtrasl": {
				"type": String,
				"default": "Noname Otrasl",
				"view": "all",
				"role": "name"
			},
			"SNameOtrasl": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"Comment": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"IsShow": {
				"type": Boolean,
				"default": false,
				"view": "none"
			}
		}
	},
	"periodgrp": {
		"tablename": "[spr].[PeriodGrps]",
		"menuplace": "Service",
		"fields": {
			"CodePeriodGrp": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NamePeriodGrp": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "name"
			},
			"SNamePeriodGrp": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"ForPermits": {
				"type": Boolean,
				"default": false,
				"view": "none"
			}
		}
	},
	"doctag": {
		"tablename": "[link].[DocTags]",
		"menuplace": "Link",
		"fields": {
			"Value": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"CodeDocTag": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"CodeDoc": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodeTag": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "tag",
				"index": true,
				"extended": true
			}
		}
	},
	"route": {
		"tablename": "[core].[Routes]",
		"menuplace": "Core",
		"fields": {
			"CodeRoute": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameRoute": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "name"
			},
			"SNameRoute": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"CodeFinalState": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "state",
				"index": true,
				"extended": true
			},
			"CodeInitState": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "state",
				"index": true,
				"extended": true
			}
		}
	},
	"objtag": {
		"tablename": "[link].[ObjTags]",
		"menuplace": "Link",
		"fields": {
			"Value": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"CodeObjTag": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"CodeObj": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "obj",
				"index": true,
				"extended": true
			},
			"CodeTag": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "tag",
				"index": true,
				"extended": true
			}
		}
	},
	"course": {
		"tablename": "[spr].[Courses]",
		"menuplace": "Service",
		"fields": {
			"CodeCourse": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"Year": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"CourseValue": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"CodeValuta": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "valuta",
				"index": true,
				"extended": true
			},
			"CodePeriod": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "period",
				"index": true,
				"extended": true
			}
		}
	},
	"grp": {
		"tablename": "[spr].[Grps]",
		"menuplace": "Service",
		"fields": {
			"CodeGrp": {
				"type": String,
				"default": "NONE",
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameGrp": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "name"
			},
			"SNameGrp": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"IsFilter": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsExFilter": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsAgGroup": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsFormula": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"Formula": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"IsAllOrg": {
				"type": Boolean,
				"default": false,
				"view": "none"
			}
		}
	},
	"userrequest": {
		"tablename": "[link].[UserRequests]",
		"menuplace": "Link",
		"fields": {
			"CoreUserRequest": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"CodeUser": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "user",
				"index": true,
				"extended": true
			},
			"CodeRequest": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "request",
				"index": true,
				"extended": true
			}
		}
	},
	"presenttransittype": {
		"tablename": "[spr].[PresentTransitTypes]",
		"menuplace": "Service",
		"fields": {
			"CodePresentTransitType": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"LibCodePresentTransitType": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"NamePresentTransitType": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "name"
			},
			"SNamePresentTransitType": {
				"type": String,
				"default": null,
				"view": "none"
			}
		}
	},
	"org": {
		"tablename": "[spr].[Orgs]",
		"menuplace": "Service",
		"fields": {
			"CodeOrg": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameOrg": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "name"
			},
			"SNameOrg": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"CodeOtrasl": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "otrasl",
				"index": true,
				"extended": true
			},
			"CodeDiv": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "div",
				"index": true,
				"extended": true
			},
			"CodeCity": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "city",
				"index": true,
				"extended": true
			},
			"CodeParentOrg": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "org",
				"index": true,
				"extended": true
			},
			"CodeHoldingOrg": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "org",
				"index": true,
				"extended": true
			}
		}
	},
	"period": {
		"tablename": "[core].[Periods]",
		"menuplace": "Core",
		"fields": {
			"CodePeriod": {
				"type": String,
				"default": "NONE",
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NamePeriod": {
				"type": String,
				"default": "Noname period",
				"view": "all",
				"role": "name"
			},
			"SNamePeriod": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"BeginDate": {
				"type": Date,
				"default": "1900-01-01T00:00:00.000Z",
				"view": "none"
			},
			"EndDate": {
				"type": Date,
				"default": "1900-01-31T00:00:00.000Z",
				"view": "none"
			},
			"MCount": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"IsFormula": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"Formula": {
				"type": String,
				"default": "0",
				"view": "none"
			},
			"IsReportPeriod": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsCalendar": {
				"type": Boolean,
				"default": false,
				"view": "none"
			}
		}
	},
	"taskfuntion": {
		"tablename": "[link].[TaskFunctions]",
		"menuplace": "Link",
		"fields": {
			"CodeTaskFuntion": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"CodeTask": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "task",
				"index": true,
				"extended": true
			},
			"CodeFunction": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "function",
				"index": true,
				"extended": true
			}
		}
	},
	"label": {
		"tablename": "[spr].[Labels]",
		"menuplace": "Service",
		"fields": {
			"CodeLabel": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameLabel": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "name"
			},
			"SNameLabel": {
				"type": String,
				"default": null,
				"view": "none"
			}
		}
	},
	"presentslottype": {
		"tablename": "[spr].[PresentSlotTypes]",
		"menuplace": "Service",
		"fields": {
			"CodePresentSlotType": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NamePresentSlotType": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "name"
			},
			"SNamePresentSlotType": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"IsTable": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsChart": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsNote": {
				"type": Boolean,
				"default": false,
				"view": "none"
			}
		}
	},
	"report": {
		"tablename": "[core].[Reports]",
		"menuplace": "Core",
		"fields": {
			"CodeReport": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IndexReport": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"NameReport": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "name"
			},
			"SNameReport": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"PrintNameReport": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"PrintDocReport": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"IsPublic": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsPrivate": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsInput": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsDefault": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"CodeDoc": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodeUser": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "user",
				"index": true,
				"extended": true
			},
			"CodeGrp": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "grp",
				"index": true,
				"extended": true
			},
			"CodePeriodGrp": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "periodgrp",
				"index": true,
				"extended": true
			}
		}
	},
	"tag": {
		"tablename": "[spr].[Tags]",
		"menuplace": "Service",
		"fields": {
			"CodeTag": {
				"type": String,
				"default": "NONE",
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameTag": {
				"type": String,
				"default": "Noname tag",
				"view": "all",
				"role": "name"
			},
			"SNameTag": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"IsList": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsObj": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsRow": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsCol": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsObjType": {
				"type": Boolean,
				"default": false,
				"view": "none"
			}
		}
	},
	"user": {
		"tablename": "[core].[Users]",
		"menuplace": "Core",
		"fields": {
			"NameUser": {
				"type": String,
				"default": "Noname User",
				"view": "all",
				"role": "name"
			},
			"CodeUser": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"LoginUser": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"PassHash": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"IsAdm": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"JobTitle": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"WorkPhone": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"Mail": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"Comment": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"AuthDoc": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"IsAdmin": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsDepAdmin": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsDivAdmin": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsOrgAdmin": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsTester": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsDesigner": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsOverDocBlock": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsOverPeriodBlock": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsOverControlPoint": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsHoldBlocker": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsDivBlocker": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsDocWriter": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"DoResetPass": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"PassSalt": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"TabNum": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"Birthday": {
				"type": Date,
				"default": "1970-01-01T00:00:00.000Z",
				"view": "none"
			},
			"MobilePhone": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"IsConfirmed": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"CodeOrg": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "org",
				"index": true,
				"extended": true
			},
			"CodeDepart": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "depart",
				"index": true,
				"extended": true
			},
			"CodeObj": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "obj",
				"index": true,
				"extended": true
			}
		}
	},
	"labeluser": {
		"tablename": "[link].[LabelUsers]",
		"menuplace": "Link",
		"fields": {
			"CodeLabelUser": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"CodeObj": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "obj",
				"index": true,
				"extended": true
			},
			"CodeLabel": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "label",
				"index": true,
				"extended": true
			},
			"CodeUser": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "user",
				"index": true,
				"extended": true
			}
		}
	},
	"rowtag": {
		"tablename": "[link].[RowTags]",
		"menuplace": "Link",
		"fields": {
			"Value": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"CodeRowTag": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"CodeRow": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "row",
				"index": true,
				"extended": true
			},
			"CodeTag": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "tag",
				"index": true,
				"extended": true
			}
		}
	},
	"courseperiod": {
		"tablename": "[link].[CoursePeriods]",
		"menuplace": "Link",
		"fields": {
			"CodeCoursePeriod": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"CodePeriod": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "period",
				"index": true,
				"extended": true
			},
			"CodeLinkPeriod": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "period",
				"index": true,
				"extended": true
			}
		}
	},
	"objtypetag": {
		"tablename": "[link].[ObjTypeTags]",
		"menuplace": "Link",
		"fields": {
			"Value": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"CodeObjTypeTag": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"CodeObjType": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "objtype",
				"index": true,
				"extended": true
			},
			"CodeTag": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "tag",
				"index": true,
				"extended": true
			}
		}
	},
	"objtype": {
		"tablename": "[spr].[ObjTypes]",
		"menuplace": "Service",
		"fields": {
			"CodeObjType": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IndexObjType": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"NameObjType": {
				"type": String,
				"default": "Noname Type",
				"view": "all",
				"role": "name"
			},
			"SNameObjType": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"Comment": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"CodeObjClass": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "objclass",
				"index": true,
				"extended": true
			}
		}
	},
	"param": {
		"tablename": "[core].[Params]",
		"menuplace": "Core",
		"fields": {
			"CodeParam": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameParam": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "name"
			},
			"SNameParam": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"IndexParam": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"CodeParamGrp": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "paramgrp",
				"index": true,
				"extended": true
			},
			"CodeListDefinition": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "listdefinition",
				"index": true,
				"extended": true
			},
			"CodeParamSet": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "paramset",
				"index": true,
				"extended": true
			}
		}
	},
	"routeperiod": {
		"tablename": "[link].[RoutePeriods]",
		"menuplace": "Link",
		"fields": {
			"CodeRoutePeriod": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NoGrp": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"CodeRoute": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "route",
				"index": true,
				"extended": true
			},
			"CodePeriod": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "period",
				"index": true,
				"extended": true
			},
			"CodeDocType": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "doctype",
				"index": true,
				"extended": true
			},
			"CodeGrp": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "grp",
				"index": true,
				"extended": true
			}
		}
	},
	"doclabel": {
		"tablename": "[link].[DocLabels]",
		"menuplace": "Link",
		"fields": {
			"CodeDocLabel": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IsSignature": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsApproval": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"CodeDoc": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodeLabel": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "label",
				"index": true,
				"extended": true
			},
			"CodePeriodGrp": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "periodgrp",
				"index": true,
				"extended": true
			}
		}
	},
	"prodsumgrp": {
		"tablename": "[link].[ProdSumGrps]",
		"menuplace": "Link",
		"fields": {
			"CodeProdSumGrp": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"CodeProd": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "prod",
				"index": true,
				"extended": true
			},
			"CodeSumGrp": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "sumgrp",
				"index": true,
				"extended": true
			}
		}
	},
	"chartcolor": {
		"tablename": "[spr].[ChartColors]",
		"menuplace": "Service",
		"fields": {
			"CodeChartColor": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameChartColor": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "name"
			},
			"SNameChartColor": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"IndexObj": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"CodeRGB": {
				"type": String,
				"default": null,
				"view": "none"
			}
		}
	},
	"presentslidelayout": {
		"tablename": "[spr].[PresentSlideLayouts]",
		"menuplace": "Service",
		"fields": {
			"CodePresentSlideLayout": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NamePresentSlideLayout": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "name"
			},
			"SNamePresentSlideLayout": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"HSlotCount": {
				"type": Number,
				"default": 1,
				"view": "none"
			},
			"VSlotCount": {
				"type": Number,
				"default": 1,
				"view": "none"
			},
			"UseLeftTopSlot": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"UseLeftBottomSlot": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"UseRightTopSlot": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"UseRightBottomSlot": {
				"type": Boolean,
				"default": false,
				"view": "none"
			}
		}
	},
	"commit": {
		"tablename": "[core].[Commits]",
		"menuplace": "Core",
		"fields": {
			"CodeCommit": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameCommit": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "name"
			},
			"SNameCommit": {
				"type": String,
				"default": null,
				"view": "none"
			}
		}
	},
	"reportperiods": {
		"tablename": "[link].[ReportPeriods]",
		"menuplace": "Link",
		"fields": {
			"CodeReportPeriod": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "period",
				"index": true,
				"extended": true
			},
			"IndexReportPeriod": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"ReportYear": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"IsOptional": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"CodePeriod": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "period",
				"index": true,
				"extended": true
			}
		}
	},
	"docparamkey": {
		"tablename": "[link].[DocParamKeys]",
		"menuplace": "Link",
		"fields": {
			"CodeDocParamKey": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IsShow": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"CodeDoc": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodePeriodGrp": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "periodgrp",
				"index": true,
				"extended": true
			},
			"CodeParam": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "param",
				"index": true,
				"extended": true
			},
			"CodeParamSet": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "paramset",
				"index": true,
				"extended": true
			}
		}
	},
	"routerefperiod": {
		"tablename": "[link].[RouteRefPeriods]",
		"menuplace": "Link",
		"fields": {
			"CodeRouteRefPeriod": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"CodeRoute": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "route",
				"index": true,
				"extended": true
			},
			"CodePeriod": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "period",
				"index": true,
				"extended": true
			},
			"CodeRefPeriod": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "period",
				"index": true,
				"extended": true
			}
		}
	},
	"userpermit": {
		"tablename": "[link].[UserPermits]",
		"menuplace": "Link",
		"fields": {
			"CodeUserPermit": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"CodeUser": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "user",
				"index": true,
				"extended": true
			},
			"CodePermit": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "permit",
				"index": true,
				"extended": true
			},
			"CodeGrp": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "grp",
				"index": true,
				"extended": true
			},
			"CodeObj": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "obj",
				"index": true,
				"extended": true
			}
		}
	},
	"valuta": {
		"tablename": "[spr].[Valutes]",
		"menuplace": "Service",
		"fields": {
			"CodeValuta": {
				"type": String,
				"default": "NONE",
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NameValuta": {
				"type": String,
				"default": "Noname valuta",
				"view": "all",
				"role": "name"
			},
			"SNameValuta": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"SignValuta": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"IsReportValuta": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsReportValuta1": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsReportValuta2": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"KolEdValuta": {
				"type": Number,
				"default": 1,
				"view": "none"
			},
			"NoConversion": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsNone": {
				"type": Boolean,
				"default": false,
				"view": "none"
			}
		}
	},
	"permitrole": {
		"tablename": "[link].[PermitRoles]",
		"menuplace": "Link",
		"fields": {
			"DoRead": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"DoWrite": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"DoBlock": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"CodePermitRole": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"CodePermit": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "permit",
				"index": true,
				"extended": true
			},
			"CodePeriodGrp": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "periodgrp",
				"index": true,
				"extended": true
			},
			"CodeRole": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "role",
				"index": true,
				"extended": true
			}
		}
	},
	"routecheckperiod": {
		"tablename": "[link].[RouteCheckPeriods]",
		"menuplace": "Link",
		"fields": {
			"CodeRouteCheckPeriod": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"NoGrp": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"RelYear": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"CodeRoute": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "route",
				"index": true,
				"extended": true
			},
			"CodeDocType": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "doctype",
				"index": true,
				"extended": true
			},
			"CodeGrp": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "grp",
				"index": true,
				"extended": true
			},
			"CodePeriod": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "period",
				"index": true,
				"extended": true
			},
			"CodeCheckPeriod": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "period",
				"index": true,
				"extended": true
			},
			"CodeCheckState": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "state",
				"index": true,
				"extended": true
			}
		}
	},
	"periodgrpref": {
		"tablename": "[link].[PeriodGrpRefs]",
		"menuplace": "Link",
		"fields": {
			"CodePeriodGrpRef": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"CodePeriod": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "period",
				"index": true,
				"extended": true
			},
			"CodePeriodGrp": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "periodgrp",
				"index": true,
				"extended": true
			}
		}
	},
	"docobjtype": {
		"tablename": "[link].[DocObjTypes]",
		"menuplace": "Link",
		"fields": {
			"CodeDocObjType": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"CodeDoc": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodeObjClass": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "objclass",
				"index": true,
				"extended": true
			},
			"CodeObjType": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "objtype",
				"index": true,
				"extended": true
			},
			"CodeParentObjClass": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "objclass",
				"index": true,
				"extended": true
			},
			"CodeParentObjTypes": {
				"type": String,
				"default": "",
				"view": "none",
				
				"refmodel": "objtype",
				"index": true,
				"extended": true
			}
		}
	}
}