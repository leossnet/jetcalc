module.exports = {
	"orggrp": {
		"tablename": "[link].[OrgGrps]",
		"menuplace": "Link",
		"fields": {
			"IdOrgGrp": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodeOrgGrp": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IdOrg": {
				"type": Number,
				"default": 0,
				"refmodel": "org",
				"view": "none",
				"dep": "CodeOrg",
				"hidden": true
			},
			"IdGrp": {
				"type": Number,
				"default": 0,
				"refmodel": "grp",
				"view": "none",
				"dep": "CodeGrp",
				"hidden": true
			},
			"CodeOrg": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdOrg",
				"refmodel": "org",
				"index": true,
				"extended": true
			},
			"CodeGrp": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdGrp",
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
			"IdFormat": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
	"userphoto": {
		"tablename": "[link].[UserPhotos]",
		"menuplace": "Link",
		"fields": {
			"IdUserPhoto": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"IdUser": {
				"type": Number,
				"default": 0,
				"refmodel": "user",
				"view": "none",
				"dep": "CodeUser",
				"hidden": true
			},
			"SPhoto": {
				"type": "Buffer",
				"default": null,
				"view": "none"
			},
			"Photo": {
				"type": "Buffer",
				"default": null,
				"view": "none"
			},
			"LPhoto": {
				"type": "Buffer",
				"default": null,
				"view": "none"
			},
			"CodeUserPhoto": {
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
				"dep": "IdUser",
				"refmodel": "user",
				"index": true,
				"extended": true
			}
		}
	},
	"objclass": {
		"tablename": "[spr].[ObjClasses]",
		"menuplace": "Service",
		"fields": {
			"IdObjClass": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			},
			"OldIdObjClass": {
				"type": Number,
				"default": -1,
				"view": "none"
			},
			"OldTagObjClass": {
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
			"IdColsetCol": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodeColsetCol": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IdColset": {
				"type": Number,
				"default": 0,
				"refmodel": "colset",
				"view": "none",
				"dep": "CodeColset",
				"hidden": true
			},
			"IdCol": {
				"type": Number,
				"default": 0,
				"refmodel": "col",
				"view": "none",
				"dep": "CodeCol",
				"hidden": true
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
			"IdPeriod": {
				"type": Number,
				"default": 0,
				"refmodel": "period",
				"view": "none",
				"dep": "CodePeriod",
				"hidden": true
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
			"IdRole": {
				"type": Number,
				"default": 0,
				"refmodel": "role",
				"view": "none",
				"dep": "CodeRole",
				"hidden": true
			},
			"IsNoRoles": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IdValid": {
				"type": Number,
				"default": 0,
				"refmodel": "valid",
				"view": "none",
				"dep": "CodeValid",
				"hidden": true
			},
			"IsHistory": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IdStyle": {
				"type": Number,
				"default": 0,
				"refmodel": "style",
				"view": "none",
				"dep": "CodeStyle",
				"hidden": true
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
				"dep": "IdColset",
				"refmodel": "colset",
				"index": true,
				"extended": true
			},
			"CodeCol": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdCol",
				"refmodel": "col",
				"index": true,
				"extended": true
			},
			"CodePeriod": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdPeriod",
				"refmodel": "period",
				"index": true,
				"extended": true
			},
			"CodeRole": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdRole",
				"refmodel": "role",
				"index": true,
				"extended": true
			},
			"CodeValid": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdValid",
				"refmodel": "valid",
				"index": true,
				"extended": true
			},
			"CodeStyle": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdStyle",
				"refmodel": "style",
				"index": true,
				"extended": true
			}
		}
	},
	"file": {
		"tablename": "[core].[Files]",
		"menuplace": "Core",
		"fields": {
			"IdFile": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdFileType": {
				"type": Number,
				"default": 0,
				"refmodel": "filetype",
				"view": "none",
				"dep": "CodeFileType",
				"hidden": true
			},
			"IdUser": {
				"type": Number,
				"default": 0,
				"refmodel": "user",
				"view": "none",
				"dep": "CodeUser",
				"hidden": true
			},
			"IdData": {
				"type": Number,
				"default": 0,
				"refmodel": "data",
				"view": "none",
				"dep": "CodeData",
				"hidden": true
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
				"dep": "IdFileType",
				"refmodel": "filetype",
				"index": true,
				"extended": true
			},
			"CodeUser": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdUser",
				"refmodel": "user",
				"index": true,
				"extended": true
			},
			"CodeData": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdData",
				"refmodel": "data",
				"index": true,
				"extended": true
			}
		}
	},
	"periodautofill": {
		"tablename": "[link].[PeriodAutofills]",
		"menuplace": "Link",
		"fields": {
			"IdPeriodAutofill": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodePeriodAutofill": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"Idx": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"IdSourcePeriod": {
				"type": Number,
				"default": 0,
				"refmodel": "period",
				"view": "none",
				"dep": "CodeSourcePeriod",
				"hidden": true
			},
			"IdTargetPeriod": {
				"type": Number,
				"default": 0,
				"refmodel": "period",
				"view": "none",
				"dep": "CodeTargetPeriod",
				"hidden": true
			},
			"CodeSourcePeriod": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdSourcePeriod",
				"refmodel": "period",
				"index": true,
				"extended": true
			},
			"CodeTargetPeriod": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdTargetPeriod",
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
			"IdParamSetKey": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodeParamSetKey": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IdParamSet": {
				"type": Number,
				"default": 0,
				"refmodel": "paramset",
				"view": "none",
				"dep": "CodeParamSet",
				"hidden": true
			},
			"IdParamKey": {
				"type": Number,
				"default": 0,
				"refmodel": "paramkey",
				"view": "none",
				"dep": "CodeParamKey",
				"hidden": true
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
				"dep": "IdParamSet",
				"refmodel": "paramset",
				"index": true,
				"extended": true
			},
			"CodeParamKey": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdParamKey",
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
			"IdChartType": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdPresent": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdDoc": {
				"type": Number,
				"default": 0,
				"refmodel": "doc",
				"view": "none",
				"dep": "CodeDoc",
				"hidden": true
			},
			"IdPresentThema": {
				"type": Number,
				"default": 0,
				"refmodel": "presentthema",
				"view": "none",
				"dep": "CodePresentThema",
				"hidden": true
			},
			"IdPresentTransitType": {
				"type": Number,
				"default": 0,
				"refmodel": "presenttransittype",
				"view": "none",
				"dep": "CodePresentTransitType",
				"hidden": true
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
				"dep": "IdDoc",
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodePresentThema": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdPresentThema",
				"refmodel": "presentthema",
				"index": true,
				"extended": true
			},
			"CodePresentTransitType": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdPresentTransitType",
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
			"IdRowColOption": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodeRowColOption": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IdRow": {
				"type": Number,
				"default": 0,
				"refmodel": "row",
				"view": "none",
				"dep": "CodeRow",
				"hidden": true
			},
			"IdCol": {
				"type": Number,
				"default": 0,
				"refmodel": "col",
				"view": "none",
				"dep": "CodeCol",
				"hidden": true
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
				"dep": "IdRow",
				"refmodel": "row",
				"index": true,
				"extended": true
			},
			"CodeCol": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdCol",
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
			"IdStyle": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdDocFolder": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdParentDocFolder": {
				"type": Number,
				"default": -1,
				"refmodel": "docfolder",
				"view": "none",
				"dep": "CodeParentDocFolder",
				"hidden": true
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
				"dep": "IdParentDocFolder",
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
			"IdFileType": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdColTag": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"IdCol": {
				"type": Number,
				"default": 0,
				"refmodel": "col",
				"view": "none",
				"dep": "CodeCol",
				"hidden": true
			},
			"IdTag": {
				"type": Number,
				"default": 0,
				"refmodel": "tag",
				"view": "none",
				"dep": "CodeTag",
				"hidden": true
			},
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
				"dep": "IdCol",
				"refmodel": "col",
				"index": true,
				"extended": true
			},
			"CodeTag": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdTag",
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
			"IdValid": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdData": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"YearData": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"IdDoc": {
				"type": Number,
				"default": 0,
				"refmodel": "doc",
				"view": "none",
				"dep": "CodeDoc",
				"hidden": true
			},
			"IdPeriod": {
				"type": Number,
				"default": 0,
				"refmodel": "period",
				"view": "none",
				"dep": "CodePeriod",
				"hidden": true
			},
			"IdObj": {
				"type": Number,
				"default": 0,
				"refmodel": "obj",
				"view": "none",
				"dep": "CodeObj",
				"hidden": true
			},
			"IdStatus": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"IdState": {
				"type": Number,
				"default": 0,
				"refmodel": "state",
				"view": "none",
				"dep": "CodeState",
				"hidden": true
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
				"dep": "IdDoc",
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodePeriod": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdPeriod",
				"refmodel": "period",
				"index": true,
				"extended": true
			},
			"CodeObj": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdObj",
				"refmodel": "obj",
				"index": true,
				"extended": true
			},
			"CodeState": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdState",
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
			"IdCol": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdValuta": {
				"type": Number,
				"default": 0,
				"refmodel": "valuta",
				"view": "none",
				"dep": "CodeValuta",
				"hidden": true
			},
			"OldIdCol": {
				"type": Number,
				"default": -1,
				"view": "none"
			},
			"OldTagCol": {
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
			"OldFormula": {
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
				"dep": "IdValuta",
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
			"IdPrivelege": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdStateCalendar": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodeStateCaledar": {
				"type": String,
				"default": null,
				"view": "none"
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
			"IdRole": {
				"type": Number,
				"default": 0,
				"refmodel": "role",
				"view": "none",
				"dep": "CodeRole",
				"hidden": true
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
				"dep": "IdRole",
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
			"IdValutaRate": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodeValutaRate": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IdValuta": {
				"type": Number,
				"default": 0,
				"refmodel": "valuta",
				"view": "none",
				"dep": "CodeValuta",
				"hidden": true
			},
			"IdReportValuta": {
				"type": Number,
				"default": 0,
				"refmodel": "valuta",
				"view": "none",
				"dep": "CodeReportValuta",
				"hidden": true
			},
			"IdReportValuta1": {
				"type": Number,
				"default": 0,
				"refmodel": "valuta",
				"view": "none",
				"dep": "CodeReportValuta1",
				"hidden": true
			},
			"IdReportValuta2": {
				"type": Number,
				"default": 0,
				"refmodel": "valuta",
				"view": "none",
				"dep": "CodeReportValuta2",
				"hidden": true
			},
			"Year": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"IdPeriod": {
				"type": Number,
				"default": 0,
				"refmodel": "period",
				"view": "none",
				"dep": "CodePeriod",
				"hidden": true
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
				"dep": "IdValuta",
				"refmodel": "valuta",
				"index": true,
				"extended": true
			},
			"CodeReportValuta": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdReportValuta",
				"refmodel": "valuta",
				"index": true,
				"extended": true
			},
			"CodeReportValuta1": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdReportValuta1",
				"refmodel": "valuta",
				"index": true,
				"extended": true
			},
			"CodeReportValuta2": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdReportValuta2",
				"refmodel": "valuta",
				"index": true,
				"extended": true
			},
			"CodePeriod": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdPeriod",
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
			"IdSumGrp": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdVirtualDocBase": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodeVirtualDocBase": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IdDoc": {
				"type": Number,
				"default": 0,
				"refmodel": "doc",
				"view": "none",
				"dep": "CodeDoc",
				"hidden": true
			},
			"IdDocBase": {
				"type": Number,
				"default": 0,
				"refmodel": "doc",
				"view": "none",
				"dep": "CodeDocBase",
				"hidden": true
			},
			"CodeDoc": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdDoc",
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodeDocBase": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdDocBase",
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
			"IdMeasure": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"OldIdMeasure": {
				"type": Number,
				"default": -1,
				"view": "none"
			},
			"OldEditUserMeasure": {
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
			"IdRole": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdModel": {
				"type": Number,
				"default": 0,
				"refmodel": "model",
				"view": "none",
				"dep": "CodeModel",
				"hidden": true
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
				"dep": "IdModel",
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
			"IdPresentSlide": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdxPresent": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"IdPresent": {
				"type": Number,
				"default": 0,
				"refmodel": "present",
				"view": "none",
				"dep": "CodePresent",
				"hidden": true
			},
			"IdPresentTransitType": {
				"type": Number,
				"default": 0,
				"refmodel": "presenttransittype",
				"view": "none",
				"dep": "CodePresentTransitType",
				"hidden": true
			},
			"IdPresentSlideLayout": {
				"type": Number,
				"default": 0,
				"refmodel": "presentslidelayout",
				"view": "none",
				"dep": "CodePresentSlideLayout",
				"hidden": true
			},
			"CodePresent": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdPresent",
				"refmodel": "present",
				"index": true,
				"extended": true
			},
			"CodePresentTransitType": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdPresentTransitType",
				"refmodel": "presenttransittype",
				"index": true,
				"extended": true
			},
			"CodePresentSlideLayout": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdPresentSlideLayout",
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
			"IdHeader": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdColset": {
				"type": Number,
				"default": 0,
				"refmodel": "colset",
				"view": "none",
				"dep": "CodeColset",
				"hidden": true
			},
			"IdParentHeader": {
				"type": Number,
				"default": -1,
				"refmodel": "header",
				"view": "none",
				"dep": "CodeParentHeader",
				"hidden": true
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
			"IdPeriod": {
				"type": Number,
				"default": 0,
				"refmodel": "period",
				"view": "none",
				"dep": "CodePeriod",
				"hidden": true
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
			"IdRole": {
				"type": Number,
				"default": 0,
				"refmodel": "role",
				"view": "none",
				"dep": "CodeRole",
				"hidden": true
			},
			"IsNoRoles": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IdValid": {
				"type": Number,
				"default": 0,
				"refmodel": "valid",
				"view": "none",
				"dep": "CodeValid",
				"hidden": true
			},
			"IsHistory": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IdStyle": {
				"type": Number,
				"default": 0,
				"refmodel": "style",
				"view": "none",
				"dep": "CodeStyle",
				"hidden": true
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
				"dep": "IdColset",
				"refmodel": "colset",
				"index": true,
				"extended": true
			},
			"CodeParentHeader": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdParentHeader",
				"refmodel": "header",
				"index": true,
				"extended": true
			},
			"CodePeriod": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdPeriod",
				"refmodel": "period",
				"index": true,
				"extended": true
			},
			"CodeRole": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdRole",
				"refmodel": "role",
				"index": true,
				"extended": true
			},
			"CodeValid": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdValid",
				"refmodel": "valid",
				"index": true,
				"extended": true
			},
			"CodeStyle": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdStyle",
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
			"IdChart": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdDoc": {
				"type": Number,
				"default": 0,
				"refmodel": "doc",
				"view": "none",
				"dep": "CodeDoc",
				"hidden": true
			},
			"IdChartType": {
				"type": Number,
				"default": 0,
				"refmodel": "charttype",
				"view": "none",
				"dep": "CodeChartType",
				"hidden": true
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
				"dep": "IdDoc",
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodeChartType": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdChartType",
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
			"IdDocRelation": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodeDocRelation": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IdDocSourse": {
				"type": Number,
				"default": 0,
				"refmodel": "doc",
				"view": "none",
				"dep": "CodeDocSourse",
				"hidden": true
			},
			"IdDocTarget": {
				"type": Number,
				"default": 0,
				"refmodel": "doc",
				"view": "none",
				"dep": "CodeDocTarget",
				"hidden": true
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
			"IdGrpSource": {
				"type": Number,
				"default": 0,
				"refmodel": "grp",
				"view": "none",
				"dep": "CodeGrpSource",
				"hidden": true
			},
			"IdGrpTarget": {
				"type": Number,
				"default": 0,
				"refmodel": "grp",
				"view": "none",
				"dep": "CodeGrpTarget",
				"hidden": true
			},
			"CodeDocSourse": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdDocSourse",
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodeDocTarget": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdDocTarget",
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodeGrpSource": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdGrpSource",
				"refmodel": "grp",
				"index": true,
				"extended": true
			},
			"CodeGrpTarget": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdGrpTarget",
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
			"IdDepart": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdParentDepart": {
				"type": Number,
				"default": 0,
				"refmodel": "depart",
				"view": "none",
				"dep": "CodeParentDepart",
				"hidden": true
			},
			"IdOrg": {
				"type": Number,
				"default": 0,
				"refmodel": "org",
				"view": "none",
				"dep": "CodeOrg",
				"hidden": true
			},
			"IdChiefUser": {
				"type": Number,
				"default": 0,
				"refmodel": "user",
				"view": "none",
				"dep": "CodeChiefUser",
				"hidden": true
			},
			"CodeParentDepart": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdParentDepart",
				"refmodel": "depart",
				"index": true,
				"extended": true
			},
			"CodeOrg": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdOrg",
				"refmodel": "org",
				"index": true,
				"extended": true
			},
			"CodeChiefUser": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdChiefUser",
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
			"IdStateCalendarDate": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodeStateCalendarDate": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IdStateCalendar": {
				"type": Number,
				"default": 0,
				"refmodel": "statecalendar",
				"view": "none",
				"dep": "CodeStateCalendar",
				"hidden": true
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
			"IdPeriod": {
				"type": Number,
				"default": 0,
				"refmodel": "period",
				"view": "none",
				"dep": "CodePeriod",
				"hidden": true
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
				"dep": "IdStateCalendar",
				"refmodel": "statecalendar",
				"index": true,
				"extended": true
			},
			"CodePeriod": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdPeriod",
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
			"IdTaskPrivelege": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodeTaskPrivelege": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IdTask": {
				"type": Number,
				"default": 0,
				"refmodel": "task",
				"view": "none",
				"dep": "CodeTask",
				"hidden": true
			},
			"IdPrivelege": {
				"type": Number,
				"default": 0,
				"refmodel": "privelege",
				"view": "none",
				"dep": "CodePrivelege",
				"hidden": true
			},
			"CodeTask": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdTask",
				"refmodel": "task",
				"index": true,
				"extended": true
			},
			"CodePrivelege": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdPrivelege",
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
			"IdRowSumGrp": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"IdSumGrp": {
				"type": Number,
				"default": 0,
				"refmodel": "sumgrp",
				"view": "none",
				"dep": "CodeSumGrp",
				"hidden": true
			},
			"IdRow": {
				"type": Number,
				"default": 0,
				"refmodel": "row",
				"view": "none",
				"dep": "CodeRow",
				"hidden": true
			},
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
				"dep": "IdSumGrp",
				"refmodel": "sumgrp",
				"index": true,
				"extended": true
			},
			"CodeRow": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdRow",
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
			"IdTask": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdDepart": {
				"type": Number,
				"default": 0,
				"refmodel": "depart",
				"view": "none",
				"dep": "CodeDepart",
				"hidden": true
			},
			"IdModel": {
				"type": Number,
				"default": 0,
				"refmodel": "model",
				"view": "none",
				"dep": "CodeModel",
				"hidden": true
			},
			"CodeDepart": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdDepart",
				"refmodel": "depart",
				"index": true,
				"extended": true
			},
			"CodeModel": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdModel",
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
			"IdColsetColPeriodGrp": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodeColsetColPeriodGrp": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IdColsetCol": {
				"type": Number,
				"default": 0,
				"refmodel": "colsetcol",
				"view": "none",
				"dep": "CodeColsetCol",
				"hidden": true
			},
			"IdPeriodGrp": {
				"type": Number,
				"default": 0,
				"refmodel": "periodgrp",
				"view": "none",
				"dep": "CodePeriodGrp",
				"hidden": true
			},
			"CodeColsetCol": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdColsetCol",
				"refmodel": "colsetcol",
				"index": true,
				"extended": true
			},
			"CodePeriodGrp": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdPeriodGrp",
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
			"IdDoc": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdDocType": {
				"type": Number,
				"default": 0,
				"refmodel": "doctype",
				"view": "none",
				"dep": "CodeDocType",
				"hidden": true
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
			"OldIdDoc": {
				"type": Number,
				"default": -1,
				"view": "none"
			},
			"FirstYear": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"IdRole": {
				"type": Number,
				"default": 0,
				"refmodel": "role",
				"view": "none",
				"dep": "CodeRole",
				"hidden": true
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
			"IdGrp": {
				"type": Number,
				"default": 0,
				"refmodel": "grp",
				"view": "none",
				"dep": "CodeGrp",
				"hidden": true
			},
			"IsShowRoots": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IsActiveCondition": {
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
			"IdModel": {
				"type": Number,
				"default": 0,
				"refmodel": "model",
				"view": "none",
				"dep": "CodeModel",
				"hidden": true
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
			"IdMeasure": {
				"type": Number,
				"default": 0,
				"refmodel": "measure",
				"view": "none",
				"dep": "CodeMeasure",
				"hidden": true
			},
			"CodeDocType": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdDocType",
				"refmodel": "doctype",
				"index": true,
				"extended": true
			},
			"CodeRole": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdRole",
				"refmodel": "role",
				"index": true,
				"extended": true
			},
			"CodeGrp": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdGrp",
				"refmodel": "grp",
				"index": true,
				"extended": true
			},
			"CodeModel": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdModel",
				"refmodel": "model",
				"index": true,
				"extended": true
			},
			"CodeMeasure": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdMeasure",
				"refmodel": "measure",
				"index": true,
				"extended": true
			}
		}
	},
	"docbill": {
		"tablename": "[link].[DocBills]",
		"menuplace": "Link",
		"fields": {
			"IdDocBill": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodeDocBill": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IdDoc": {
				"type": Number,
				"default": 0,
				"refmodel": "doc",
				"view": "none",
				"dep": "CodeDoc",
				"hidden": true
			},
			"IdBill": {
				"type": Number,
				"default": 0,
				"refmodel": "bill",
				"view": "none",
				"dep": "CodeBill",
				"hidden": true
			},
			"CodeDoc": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdDoc",
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodeBill": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdBill",
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
			"IdColset": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdCountry": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			},
			"OldIdCountry": {
				"type": Number,
				"default": -1,
				"view": "none"
			}
		}
	},
	"reportparamkey": {
		"tablename": "[link].[ReportParamKeys]",
		"menuplace": "Link",
		"fields": {
			"IdReportParamKey": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodeReportParamKey": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IdReport": {
				"type": Number,
				"default": 0,
				"refmodel": "report",
				"view": "none",
				"dep": "CodeReport",
				"hidden": true
			},
			"IdParam": {
				"type": Number,
				"default": 0,
				"refmodel": "param",
				"view": "none",
				"dep": "CodeParam",
				"hidden": true
			},
			"IdParamSet": {
				"type": Number,
				"default": 0,
				"refmodel": "paramset",
				"view": "none",
				"dep": "CodeParamSet",
				"hidden": true
			},
			"CodeReport": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdReport",
				"refmodel": "report",
				"index": true,
				"extended": true
			},
			"CodeParam": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdParam",
				"refmodel": "param",
				"index": true,
				"extended": true
			},
			"CodeParamSet": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdParamSet",
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
			"IdBill": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"OldIdCode": {
				"type": Number,
				"default": -1,
				"view": "none"
			},
			"OldEditUserBill": {
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
			"IdBillRelation": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodeBillRelation": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IdBillSource": {
				"type": Number,
				"default": 0,
				"refmodel": "bill",
				"view": "none",
				"dep": "CodeBillSource",
				"hidden": true
			},
			"IdBillTarget": {
				"type": Number,
				"default": 0,
				"refmodel": "bill",
				"view": "none",
				"dep": "CodeBillTarget",
				"hidden": true
			},
			"IsNotGrpSource": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IdGrpSource": {
				"type": Number,
				"default": 0,
				"refmodel": "grp",
				"view": "none",
				"dep": "CodeGrpSource",
				"hidden": true
			},
			"IsNotGrpTarget": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IdGrpTarget": {
				"type": Number,
				"default": 0,
				"refmodel": "grp",
				"view": "none",
				"dep": "CodeGrpTarget",
				"hidden": true
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
				"dep": "IdBillSource",
				"refmodel": "bill",
				"index": true,
				"extended": true
			},
			"CodeBillTarget": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdBillTarget",
				"refmodel": "bill",
				"index": true,
				"extended": true
			},
			"CodeGrpSource": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdGrpSource",
				"refmodel": "grp",
				"index": true,
				"extended": true
			},
			"CodeGrpTarget": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdGrpTarget",
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
			"IdStatus": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdDocFolderDoc": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"IdDoc": {
				"type": Number,
				"default": 0,
				"refmodel": "doc",
				"view": "none",
				"dep": "CodeDoc",
				"hidden": true
			},
			"IdDocFolder": {
				"type": Number,
				"default": 0,
				"refmodel": "docfolder",
				"view": "none",
				"dep": "CodeDocFolder",
				"hidden": true
			},
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
				"dep": "IdDoc",
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodeDocFolder": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdDocFolder",
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
			"IdRowObj": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"IdRow": {
				"type": Number,
				"default": 0,
				"refmodel": "row",
				"view": "none",
				"dep": "CodeRow",
				"hidden": true
			},
			"IdObj": {
				"type": Number,
				"default": 0,
				"refmodel": "obj",
				"view": "none",
				"dep": "CodeObj",
				"hidden": true
			},
			"IdGrp": {
				"type": Number,
				"default": 0,
				"refmodel": "grp",
				"view": "none",
				"dep": "CodeGrp",
				"hidden": true
			},
			"IdObjType": {
				"type": Number,
				"default": 0,
				"refmodel": "objtype",
				"view": "none",
				"dep": "CodeObjType",
				"hidden": true
			},
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
				"dep": "IdRow",
				"refmodel": "row",
				"index": true,
				"extended": true
			},
			"CodeObj": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdObj",
				"refmodel": "obj",
				"index": true,
				"extended": true
			},
			"CodeGrp": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdGrp",
				"refmodel": "grp",
				"index": true,
				"extended": true
			},
			"CodeObjType": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdObjType",
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
			"IdUserFavorite": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodeUserFavorite": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IdUser": {
				"type": Number,
				"default": 0,
				"refmodel": "user",
				"view": "none",
				"dep": "CodeUser",
				"hidden": true
			},
			"IdDoc": {
				"type": Number,
				"default": 0,
				"refmodel": "doc",
				"view": "none",
				"dep": "CodeDoc",
				"hidden": true
			},
			"IdObj": {
				"type": Number,
				"default": 0,
				"refmodel": "obj",
				"view": "none",
				"dep": "CodeObj",
				"hidden": true
			},
			"IdDiv": {
				"type": Number,
				"default": 0,
				"refmodel": "div",
				"view": "none",
				"dep": "CodeDiv",
				"hidden": true
			},
			"IdOtrasl": {
				"type": Number,
				"default": 0,
				"refmodel": "otrasl",
				"view": "none",
				"dep": "CodeOtrasl",
				"hidden": true
			},
			"IdRegion": {
				"type": Number,
				"default": 0,
				"refmodel": "region",
				"view": "none",
				"dep": "CodeRegion",
				"hidden": true
			},
			"IdGrp": {
				"type": Number,
				"default": 0,
				"refmodel": "grp",
				"view": "none",
				"dep": "CodeGrp",
				"hidden": true
			},
			"Year": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"IdPeriod": {
				"type": Number,
				"default": 0,
				"refmodel": "period",
				"view": "none",
				"dep": "CodePeriod",
				"hidden": true
			},
			"CodeUser": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdUser",
				"refmodel": "user",
				"index": true,
				"extended": true
			},
			"CodeDoc": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdDoc",
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodeObj": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdObj",
				"refmodel": "obj",
				"index": true,
				"extended": true
			},
			"CodeDiv": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdDiv",
				"refmodel": "div",
				"index": true,
				"extended": true
			},
			"CodeOtrasl": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdOtrasl",
				"refmodel": "otrasl",
				"index": true,
				"extended": true
			},
			"CodeRegion": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdRegion",
				"refmodel": "region",
				"index": true,
				"extended": true
			},
			"CodeGrp": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdGrp",
				"refmodel": "grp",
				"index": true,
				"extended": true
			},
			"CodePeriod": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdPeriod",
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
			"IdPresetSlot": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdPresentSlide": {
				"type": Number,
				"default": 0,
				"refmodel": "presentslide",
				"view": "none",
				"dep": "CodePresentSlide",
				"hidden": true
			},
			"IdDoc": {
				"type": Number,
				"default": 0,
				"refmodel": "doc",
				"view": "none",
				"dep": "CodeDoc",
				"hidden": true
			},
			"IdReport": {
				"type": Number,
				"default": 0,
				"refmodel": "report",
				"view": "none",
				"dep": "CodeReport",
				"hidden": true
			},
			"YearData": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"IdPeriod": {
				"type": Number,
				"default": 0,
				"refmodel": "period",
				"view": "none",
				"dep": "CodePeriod",
				"hidden": true
			},
			"IdValuta": {
				"type": Number,
				"default": 0,
				"refmodel": "valuta",
				"view": "none",
				"dep": "CodeValuta",
				"hidden": true
			},
			"CodePresentSlide": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdPresentSlide",
				"refmodel": "presentslide",
				"index": true,
				"extended": true
			},
			"CodeDoc": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdDoc",
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodeReport": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdReport",
				"refmodel": "report",
				"index": true,
				"extended": true
			},
			"CodePeriod": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdPeriod",
				"refmodel": "period",
				"index": true,
				"extended": true
			},
			"CodeValuta": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdValuta",
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
			"IdColRelation": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodeColRelation": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IdDocRelation": {
				"type": Number,
				"default": 0,
				"refmodel": "docrelation",
				"view": "none",
				"dep": "CodeDocRelation",
				"hidden": true
			},
			"IdColSource": {
				"type": Number,
				"default": 0,
				"refmodel": "col",
				"view": "none",
				"dep": "CodeColSource",
				"hidden": true
			},
			"IdColTarget": {
				"type": Number,
				"default": 0,
				"refmodel": "col",
				"view": "none",
				"dep": "CodeColTarget",
				"hidden": true
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
				"dep": "IdDocRelation",
				"refmodel": "docrelation",
				"index": true,
				"extended": true
			},
			"CodeColSource": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdColSource",
				"refmodel": "col",
				"index": true,
				"extended": true
			},
			"CodeColTarget": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdColTarget",
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
			"IdDocType": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdColsetColGrp": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"IdColsetCol": {
				"type": Number,
				"default": 0,
				"refmodel": "colsetcol",
				"view": "none",
				"dep": "CodeColsetCol",
				"hidden": true
			},
			"IdGrp": {
				"type": Number,
				"default": 0,
				"refmodel": "grp",
				"view": "none",
				"dep": "CodeGrp",
				"hidden": true
			},
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
				"dep": "IdColsetCol",
				"refmodel": "colsetcol",
				"index": true,
				"extended": true
			},
			"CodeGrp": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdGrp",
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
			"IdRegion": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdCountry": {
				"type": Number,
				"default": 0,
				"refmodel": "country",
				"view": "none",
				"dep": "CodeCountry",
				"hidden": true
			},
			"OldIdRegion": {
				"type": Number,
				"default": -1,
				"view": "none"
			},
			"Idx": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"CodeCountry": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdCountry",
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
			"IdDocPacket": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodeDocPacket": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IdDoc": {
				"type": Number,
				"default": 0,
				"refmodel": "doc",
				"view": "none",
				"dep": "CodeDoc",
				"hidden": true
			},
			"IdPacket": {
				"type": Number,
				"default": 0,
				"refmodel": "doc",
				"view": "none",
				"dep": "CodePacket",
				"hidden": true
			},
			"CodeDoc": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdDoc",
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodePacket": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdPacket",
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
			"IdDogovorType": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdProd": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdMeasure": {
				"type": Number,
				"default": 0,
				"refmodel": "measure",
				"view": "none",
				"dep": "CodeMeasure",
				"hidden": true
			},
			"Comment": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"OldIdProd": {
				"type": Number,
				"default": -1,
				"view": "none"
			},
			"OldTagProd": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"IdParentProd": {
				"type": Number,
				"default": 0,
				"refmodel": "prod",
				"view": "none",
				"dep": "CodeParentProd",
				"hidden": true
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
				"dep": "IdMeasure",
				"refmodel": "measure",
				"index": true,
				"extended": true
			},
			"CodeParentProd": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdParentProd",
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
			"IdDocRow": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"IdDoc": {
				"type": Number,
				"default": 0,
				"refmodel": "doc",
				"view": "none",
				"dep": "CodeDoc",
				"hidden": true
			},
			"IdRow": {
				"type": Number,
				"default": 0,
				"refmodel": "row",
				"view": "none",
				"dep": "CodeRow",
				"hidden": true
			},
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
				"dep": "IdDoc",
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodeRow": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdRow",
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
			"IdListDef": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdPeriodEdit": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodePeriodEdit": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IdRole": {
				"type": Number,
				"default": 0,
				"refmodel": "role",
				"view": "none",
				"dep": "CodeRole",
				"hidden": true
			},
			"Year": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"IdPeriod": {
				"type": Number,
				"default": 0,
				"refmodel": "period",
				"view": "none",
				"dep": "CodePeriod",
				"hidden": true
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
				"dep": "IdRole",
				"refmodel": "role",
				"index": true,
				"extended": true
			},
			"CodePeriod": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdPeriod",
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
			"IdListDefinition": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdObj": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"IdParentObj": {
				"type": Number,
				"default": -1,
				"refmodel": "obj",
				"view": "none",
				"dep": "CodeParentObj",
				"hidden": true
			},
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
			"IdOrg": {
				"type": Number,
				"default": 0,
				"refmodel": "org",
				"view": "none",
				"dep": "CodeOrg",
				"hidden": true
			},
			"IdObjType": {
				"type": Number,
				"default": 0,
				"refmodel": "objtype",
				"view": "none",
				"dep": "CodeObjType",
				"hidden": true
			},
			"IdValuta": {
				"type": Number,
				"default": 0,
				"refmodel": "valuta",
				"view": "none",
				"dep": "CodeValuta",
				"hidden": true
			},
			"Comment": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"OldIdObj": {
				"type": Number,
				"default": -1,
				"view": "none"
			},
			"OldTagObj": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"OldGroupCasheObj": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"OldEditUserObj": {
				"type": String,
				"default": "sys",
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
			"IdGrpEditFilter": {
				"type": Number,
				"default": 0,
				"refmodel": "grp",
				"view": "none",
				"dep": "CodeGrpEditFilter",
				"hidden": true
			},
			"OldFormula": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"IdStatus": {
				"type": Number,
				"default": 0,
				"refmodel": "status",
				"view": "none",
				"dep": "CodeStatus",
				"hidden": true
			},
			"IdPriority": {
				"type": Number,
				"default": 0,
				"refmodel": "priority",
				"view": "none",
				"dep": "CodePriority",
				"hidden": true
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
				"dep": "IdParentObj",
				"refmodel": "obj",
				"index": true,
				"extended": true
			},
			"CodeOrg": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdOrg",
				"refmodel": "org",
				"index": true,
				"extended": true
			},
			"CodeObjType": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdObjType",
				"refmodel": "objtype",
				"index": true,
				"extended": true
			},
			"CodeValuta": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdValuta",
				"refmodel": "valuta",
				"index": true,
				"extended": true
			},
			"CodeGrpEditFilter": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdGrpEditFilter",
				"refmodel": "grp",
				"index": true,
				"extended": true
			},
			"CodeStatus": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdStatus",
				"refmodel": "status",
				"index": true,
				"extended": true
			},
			"CodePriority": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdPriority",
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
			"IdPeriodRedirect": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodePeriodRedirect": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IdDocType": {
				"type": Number,
				"default": 0,
				"refmodel": "doctype",
				"view": "none",
				"dep": "CodeDocType",
				"hidden": true
			},
			"IdGrp": {
				"type": Number,
				"default": 0,
				"refmodel": "grp",
				"view": "none",
				"dep": "CodeGrp",
				"hidden": true
			},
			"NotGrp": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IdPeriod": {
				"type": Number,
				"default": 0,
				"refmodel": "period",
				"view": "none",
				"dep": "CodePeriod",
				"hidden": true
			},
			"IdPeriodToRedirect": {
				"type": Number,
				"default": 0,
				"refmodel": "period",
				"view": "none",
				"dep": "CodePeriodToRedirect",
				"hidden": true
			},
			"CodeDocType": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdDocType",
				"refmodel": "doctype",
				"index": true,
				"extended": true
			},
			"CodeGrp": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdGrp",
				"refmodel": "grp",
				"index": true,
				"extended": true
			},
			"CodePeriod": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdPeriod",
				"refmodel": "period",
				"index": true,
				"extended": true
			},
			"CodePeriodToRedirect": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdPeriodToRedirect",
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
			"IdOrgGroup": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodeOrgGroup": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IdDoc": {
				"type": Number,
				"default": 0,
				"refmodel": "doc",
				"view": "none",
				"dep": "CodeDoc",
				"hidden": true
			},
			"IdGrp": {
				"type": Number,
				"default": 0,
				"refmodel": "grp",
				"view": "none",
				"dep": "CodeGrp",
				"hidden": true
			},
			"CodeDoc": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdDoc",
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodeGrp": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdGrp",
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
			"IdPriority": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdCity": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdRegion": {
				"type": Number,
				"default": 0,
				"refmodel": "region",
				"view": "none",
				"dep": "CodeRegion",
				"hidden": true
			},
			"OldIdCity": {
				"type": Number,
				"default": -1,
				"view": "none"
			},
			"CodeRegion": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdRegion",
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
			"IdDogovor": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdOrg": {
				"type": Number,
				"default": 0,
				"refmodel": "org",
				"view": "none",
				"dep": "CodeOrg",
				"hidden": true
			},
			"IdAltOrg": {
				"type": Number,
				"default": 0,
				"refmodel": "org",
				"view": "none",
				"dep": "CodeAltOrg",
				"hidden": true
			},
			"IdThirdOrg": {
				"type": Number,
				"default": 0,
				"refmodel": "org",
				"view": "none",
				"dep": "CodeThirdOrg",
				"hidden": true
			},
			"IdDogovorType": {
				"type": Number,
				"default": 0,
				"refmodel": "dogovortype",
				"view": "none",
				"dep": "CodeDogovorType",
				"hidden": true
			},
			"IdParentDogovor": {
				"type": Number,
				"default": 0,
				"refmodel": "dogovor",
				"view": "none",
				"dep": "CodeParentDogovor",
				"hidden": true
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
			"IdValuta": {
				"type": Number,
				"default": 0,
				"refmodel": "valuta",
				"view": "none",
				"dep": "CodeValuta",
				"hidden": true
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
			"OldTagDogovor": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"CodeOrg": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdOrg",
				"refmodel": "org",
				"index": true,
				"extended": true
			},
			"CodeAltOrg": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdAltOrg",
				"refmodel": "org",
				"index": true,
				"extended": true
			},
			"CodeThirdOrg": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdThirdOrg",
				"refmodel": "org",
				"index": true,
				"extended": true
			},
			"CodeDogovorType": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdDogovorType",
				"refmodel": "dogovortype",
				"index": true,
				"extended": true
			},
			"CodeParentDogovor": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdParentDogovor",
				"refmodel": "dogovor",
				"index": true,
				"extended": true
			},
			"CodeValuta": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdValuta",
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
			"IdFunction": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdDocHeader": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"IdDoc": {
				"type": Number,
				"default": 0,
				"refmodel": "doc",
				"view": "none",
				"dep": "CodeDoc",
				"hidden": true
			},
			"IdHeader": {
				"type": Number,
				"default": 0,
				"refmodel": "header",
				"view": "none",
				"dep": "CodeHeader",
				"hidden": true
			},
			"IdPeriodGrp": {
				"type": Number,
				"default": 0,
				"refmodel": "periodgrp",
				"view": "none",
				"dep": "CodePeriodGrp",
				"hidden": true
			},
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
				"dep": "IdDoc",
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodeHeader": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdHeader",
				"refmodel": "header",
				"index": true,
				"extended": true
			},
			"IndexDocHeader": {
				"type": Number,
				"default": -1,
				"index":true
			},			
			"CodePeriodGrp": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdPeriodGrp",
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
			"IdParamSet": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdListDefinition": {
				"type": Number,
				"default": 0,
				"refmodel": "listdefinition",
				"view": "none",
				"dep": "CodeListDefinition",
				"hidden": true
			},
			"Idx": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"CodeListDefinition": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdListDefinition",
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
			"IdRowChartLine": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodeRowChartLine": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IdDoc": {
				"type": Number,
				"default": 0,
				"refmodel": "doc",
				"view": "none",
				"dep": "CodeDoc",
				"hidden": true
			},
			"IdRow": {
				"type": Number,
				"default": 0,
				"refmodel": "row",
				"view": "none",
				"dep": "CodeRow",
				"hidden": true
			},
			"IdChartColor": {
				"type": Number,
				"default": 0,
				"refmodel": "chartcolor",
				"view": "none",
				"dep": "CodeChartColor",
				"hidden": true
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
				"dep": "IdDoc",
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodeRow": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdRow",
				"refmodel": "row",
				"index": true,
				"extended": true
			},
			"CodeChartColor": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdChartColor",
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
			"IdParamTab": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdRequest": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdObj": {
				"type": Number,
				"default": 0,
				"refmodel": "obj",
				"view": "none",
				"dep": "CodeObj",
				"hidden": true
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
				"dep": "IdObj",
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
			"IdUserTask": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodeUserTask": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IdUser": {
				"type": Number,
				"default": 0,
				"refmodel": "user",
				"view": "none",
				"dep": "CodeUser",
				"hidden": true
			},
			"IdTask": {
				"type": Number,
				"default": 0,
				"refmodel": "task",
				"view": "none",
				"dep": "CodeTask",
				"hidden": true
			},
			"IdObj": {
				"type": Number,
				"default": 0,
				"refmodel": "obj",
				"view": "none",
				"dep": "CodeObj",
				"hidden": true
			},
			"IdObjGrp": {
				"type": Number,
				"default": 0,
				"refmodel": "grp",
				"view": "none",
				"dep": "CodeObjGrp",
				"hidden": true
			},
			"IdDoc": {
				"type": Number,
				"default": 0,
				"refmodel": "doc",
				"view": "none",
				"dep": "CodeDoc",
				"hidden": true
			},
			"IdRole": {
				"type": Number,
				"default": 0,
				"refmodel": "role",
				"view": "none",
				"dep": "CodeRole",
				"hidden": true
			},
			"IdPeriod": {
				"type": Number,
				"default": 0,
				"refmodel": "period",
				"view": "none",
				"dep": "CodePeriod",
				"hidden": true
			},
			"IdPeriodGrp": {
				"type": Number,
				"default": 0,
				"refmodel": "periodgrp",
				"view": "none",
				"dep": "CodePeriodGrp",
				"hidden": true
			},
			"CodeUser": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdUser",
				"refmodel": "user",
				"index": true,
				"extended": true
			},
			"CodeTask": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdTask",
				"refmodel": "task",
				"index": true,
				"extended": true
			},
			"CodeObj": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdObj",
				"refmodel": "obj",
				"index": true,
				"extended": true
			},
			"CodeObjGrp": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdObjGrp",
				"refmodel": "grp",
				"index": true,
				"extended": true
			},
			"CodeDoc": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdDoc",
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodeRole": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdRole",
				"refmodel": "role",
				"index": true,
				"extended": true
			},
			"CodePeriod": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdPeriod",
				"refmodel": "period",
				"index": true,
				"extended": true
			},
			"CodePeriodGrp": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdPeriodGrp",
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
			"IdDiv": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"OldIdDiv": {
				"type": Number,
				"default": -1,
				"view": "none"
			},
			"OldIdxDiv": {
				"type": Number,
				"default": -1,
				"view": "none"
			},
			"OldTagDiv": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"Idx": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"IdDivOrg": {
				"type": Number,
				"default": 0,
				"refmodel": "org",
				"view": "none",
				"dep": "CodeDivOrg",
				"hidden": true
			},
			"CodeDivOrg": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdDivOrg",
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
			"IdAction": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdPermit": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdObj": {
				"type": Number,
				"default": 0,
				"refmodel": "obj",
				"view": "none",
				"dep": "CodeObj",
				"hidden": true
			},
			"CodeObj": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdObj",
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
			"IdParamKey": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdParamGrp": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdReportRow": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodeReportRow": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IdReport": {
				"type": Number,
				"default": 0,
				"refmodel": "report",
				"view": "none",
				"dep": "CodeReport",
				"hidden": true
			},
			"IdRow": {
				"type": Number,
				"default": 0,
				"refmodel": "row",
				"view": "none",
				"dep": "CodeRow",
				"hidden": true
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
				"dep": "IdReport",
				"refmodel": "report",
				"index": true,
				"extended": true
			},
			"CodeRow": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdRow",
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
			"IdDogovorArt": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdValuta": {
				"type": Number,
				"default": 0,
				"refmodel": "valuta",
				"view": "none",
				"dep": "CodeValuta",
				"hidden": true
			},
			"CodeValuta": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdValuta",
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
			"IdTagDef": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"IdTag": {
				"type": Number,
				"default": 0,
				"refmodel": "tag",
				"view": "none",
				"dep": "CodeTag",
				"hidden": true
			},
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
				"dep": "IdTag",
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
			"IdRow": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodeRow": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IdParentRow": {
				"type": Number,
				"default": 0,
				"refmodel": "row",
				"view": "none",
				"dep": "CodeParentRow",
				"hidden": true
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
			"IdValuta": {
				"type": Number,
				"default": 0,
				"refmodel": "valuta",
				"view": "none",
				"dep": "CodeValuta",
				"hidden": true
			},
			"IdMeasure": {
				"type": Number,
				"default": 0,
				"refmodel": "measure",
				"view": "none",
				"dep": "CodeMeasure",
				"hidden": true
			},
			"IdFormat": {
				"type": Number,
				"default": 0,
				"refmodel": "format",
				"view": "none",
				"dep": "CodeFormat",
				"hidden": true
			},
			"IdStyle": {
				"type": Number,
				"default": 0,
				"refmodel": "style",
				"view": "none",
				"dep": "CodeStyle",
				"hidden": true
			},
			"IdBill": {
				"type": Number,
				"default": 0,
				"refmodel": "bill",
				"view": "none",
				"dep": "CodeBill",
				"hidden": true
			},
			"IdProd": {
				"type": Number,
				"default": 0,
				"refmodel": "prod",
				"view": "none",
				"dep": "CodeProd",
				"hidden": true
			},
			"IdAltOrg": {
				"type": Number,
				"default": 0,
				"refmodel": "org",
				"view": "none",
				"dep": "CodeAltOrg",
				"hidden": true
			},
			"OldIdRow": {
				"type": Number,
				"default": -1,
				"view": "none"
			},
			"OldTagRow": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"OldMarkCacheRow": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"OldGrpRow": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"OldEditUserRow": {
				"type": String,
				"default": "sys",
				"view": "none"
			},
			"OldPathRow": {
				"type": String,
				"default": "",
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
			"IdFilteredAltGrp": {
				"type": Number,
				"default": 0,
				"refmodel": "grp",
				"view": "none",
				"dep": "CodeFilteredAltGrp",
				"hidden": true
			},
			"IdDogovor": {
				"type": Number,
				"default": 0,
				"refmodel": "dogovor",
				"view": "none",
				"dep": "CodeDogovor",
				"hidden": true
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
			"IdDogovorArt": {
				"type": Number,
				"default": 0,
				"refmodel": "dogovorart",
				"view": "none",
				"dep": "CodeDogovorArt",
				"hidden": true
			},
			"IdGrpEditFilter": {
				"type": Number,
				"default": 0,
				"refmodel": "grp",
				"view": "none",
				"dep": "CodeGrpEditFilter",
				"hidden": true
			},
			"NoDoSum": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IdRowLink": {
				"type": Number,
				"default": 0,
				"refmodel": "row",
				"view": "none",
				"dep": "CodeRowLink",
				"hidden": true
			},
			"OldFormula": {
				"type": String,
				"default": "",
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
				"dep": "IdParentRow",
				"refmodel": "row",
				"index": true,
				"extended": true
			},
			"CodeValuta": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdValuta",
				"refmodel": "valuta",
				"index": true,
				"extended": true
			},
			"CodeMeasure": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdMeasure",
				"refmodel": "measure",
				"index": true,
				"extended": true
			},
			"CodeFormat": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdFormat",
				"refmodel": "format",
				"index": true,
				"extended": true
			},
			"CodeStyle": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdStyle",
				"refmodel": "style",
				"index": true,
				"extended": true
			},
			"CodeBill": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdBill",
				"refmodel": "bill",
				"index": true,
				"extended": true
			},
			"CodeProd": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdProd",
				"refmodel": "prod",
				"index": true,
				"extended": true
			},
			"CodeAltOrg": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdAltOrg",
				"refmodel": "org",
				"index": true,
				"extended": true
			},
			"CodeFilteredAltGrp": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdFilteredAltGrp",
				"refmodel": "grp",
				"index": true,
				"extended": true
			},
			"CodeDogovor": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdDogovor",
				"refmodel": "dogovor",
				"index": true,
				"extended": true
			},
			"CodeDogovorArt": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdDogovorArt",
				"refmodel": "dogovorart",
				"index": true,
				"extended": true
			},
			"CodeGrpEditFilter": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdGrpEditFilter",
				"refmodel": "grp",
				"index": true,
				"extended": true
			},
			"CodeRowLink": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdRowLink",
				"refmodel": "row",
				"index": true,
				"extended": true
			}
		}
	},
	"routefiletype": {
		"tablename": "[link].[RouteFileTypes]",
		"menuplace": "Link",
		"fields": {
			"IdRouteFileType": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodeRouteFileType": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IdRoute": {
				"type": Number,
				"default": 0,
				"refmodel": "route",
				"view": "none",
				"dep": "CodeRoute",
				"hidden": true
			},
			"IdDoc": {
				"type": Number,
				"default": 0,
				"refmodel": "doc",
				"view": "none",
				"dep": "CodeDoc",
				"hidden": true
			},
			"IdFileType": {
				"type": Number,
				"default": 0,
				"refmodel": "filetype",
				"view": "none",
				"dep": "CodeFileType",
				"hidden": true
			},
			"IdPeriod": {
				"type": Number,
				"default": 0,
				"refmodel": "period",
				"view": "none",
				"dep": "CodePeriod",
				"hidden": true
			},
			"IdPeriodGrp": {
				"type": Number,
				"default": 0,
				"refmodel": "periodgrp",
				"view": "none",
				"dep": "CodePeriodGrp",
				"hidden": true
			},
			"CodeRoute": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdRoute",
				"refmodel": "route",
				"index": true,
				"extended": true
			},
			"CodeDoc": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdDoc",
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodeFileType": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdFileType",
				"refmodel": "filetype",
				"index": true,
				"extended": true
			},
			"CodePeriod": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdPeriod",
				"refmodel": "period",
				"index": true,
				"extended": true
			},
			"CodePeriodGrp": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdPeriodGrp",
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
			"IdDogovorTypeArt": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodeDogovorTypeArt": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IdDogovorType": {
				"type": Number,
				"default": 0,
				"refmodel": "dogovortype",
				"view": "none",
				"dep": "CodeDogovorType",
				"hidden": true
			},
			"IdDogovorArt": {
				"type": Number,
				"default": 0,
				"refmodel": "dogovorart",
				"view": "none",
				"dep": "CodeDogovorArt",
				"hidden": true
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
			"Idx": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"CodeDogovorType": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdDogovorType",
				"refmodel": "dogovortype",
				"index": true,
				"extended": true
			},
			"CodeDogovorArt": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdDogovorArt",
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
			"IdPresentThema": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdObjGrp": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"IdObj": {
				"type": Number,
				"default": 0,
				"refmodel": "obj",
				"view": "none",
				"dep": "CodeObj",
				"hidden": true
			},
			"IdGrp": {
				"type": Number,
				"default": 0,
				"refmodel": "grp",
				"view": "none",
				"dep": "CodeGrp",
				"hidden": true
			},
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
				"dep": "IdObj",
				"refmodel": "obj",
				"index": true,
				"extended": true
			},
			"CodeGrp": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdGrp",
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
			"IdModel": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdState": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdOtrasl": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			},
			"OldIdOtrasl": {
				"type": Number,
				"default": -1,
				"view": "none"
			},
			"OldTagOtrasl": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"OldEditUserOtrasl": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"Idx": {
				"type": Number,
				"default": 0,
				"view": "none"
			}
		}
	},
	"periodgrp": {
		"tablename": "[spr].[PeriodGrps]",
		"menuplace": "Service",
		"fields": {
			"IdPeriodGrp": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdDocTag": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"IdDoc": {
				"type": Number,
				"default": 0,
				"refmodel": "doc",
				"view": "none",
				"dep": "CodeDoc",
				"hidden": true
			},
			"IdTag": {
				"type": Number,
				"default": 0,
				"refmodel": "tag",
				"view": "none",
				"dep": "CodeTag",
				"hidden": true
			},
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
				"dep": "IdDoc",
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodeTag": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdTag",
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
			"IdRoute": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdFinalState": {
				"type": Number,
				"default": 0,
				"refmodel": "state",
				"view": "none",
				"dep": "CodeFinalState",
				"hidden": true
			},
			"IdInitState": {
				"type": Number,
				"default": 0,
				"refmodel": "state",
				"view": "none",
				"dep": "CodeInitState",
				"hidden": true
			},
			"CodeFinalState": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdFinalState",
				"refmodel": "state",
				"index": true,
				"extended": true
			},
			"CodeInitState": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdInitState",
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
			"IdObjTag": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"IdObj": {
				"type": Number,
				"default": 0,
				"refmodel": "obj",
				"view": "none",
				"dep": "CodeObj",
				"hidden": true
			},
			"IdTag": {
				"type": Number,
				"default": 0,
				"refmodel": "tag",
				"view": "none",
				"dep": "CodeTag",
				"hidden": true
			},
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
				"dep": "IdObj",
				"refmodel": "obj",
				"index": true,
				"extended": true
			},
			"CodeTag": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdTag",
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
			"IdCourse": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodeCourse": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IdValuta": {
				"type": Number,
				"default": 0,
				"refmodel": "valuta",
				"view": "none",
				"dep": "CodeValuta",
				"hidden": true
			},
			"Year": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"IdPeriod": {
				"type": Number,
				"default": 0,
				"refmodel": "period",
				"view": "none",
				"dep": "CodePeriod",
				"hidden": true
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
				"dep": "IdValuta",
				"refmodel": "valuta",
				"index": true,
				"extended": true
			},
			"CodePeriod": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdPeriod",
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
			"IdGrp": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"Idx": {
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
			"IdUserRequest": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CoreUserRequest": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"IdUser": {
				"type": Number,
				"default": 0,
				"refmodel": "user",
				"view": "none",
				"dep": "CodeUser",
				"hidden": true
			},
			"IdRequest": {
				"type": Number,
				"default": 0,
				"refmodel": "request",
				"view": "none",
				"dep": "CodeRequest",
				"hidden": true
			},
			"CodeUser": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdUser",
				"refmodel": "user",
				"index": true,
				"extended": true
			},
			"CodeRequest": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdRequest",
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
			"IdPresentTransitType": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdOrg": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdOtrasl": {
				"type": Number,
				"default": 0,
				"refmodel": "otrasl",
				"view": "none",
				"dep": "CodeOtrasl",
				"hidden": true
			},
			"IdDiv": {
				"type": Number,
				"default": 0,
				"refmodel": "div",
				"view": "none",
				"dep": "CodeDiv",
				"hidden": true
			},
			"IdCity": {
				"type": Number,
				"default": 0,
				"refmodel": "city",
				"view": "none",
				"dep": "CodeCity",
				"hidden": true
			},
			"OldIdOrg": {
				"type": Number,
				"default": -1,
				"view": "none"
			},
			"IdParentOrg": {
				"type": Number,
				"default": 0,
				"refmodel": "org",
				"view": "none",
				"dep": "CodeParentOrg",
				"hidden": true
			},
			"IdHoldingOrg": {
				"type": Number,
				"default": 0,
				"refmodel": "org",
				"view": "none",
				"dep": "CodeHoldingOrg",
				"hidden": true
			},
			"OldCodeOrg": {
				"type": String,
				"default": null,
				"view": "none"
			},
			"CodeOtrasl": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdOtrasl",
				"refmodel": "otrasl",
				"index": true,
				"extended": true
			},
			"CodeDiv": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdDiv",
				"refmodel": "div",
				"index": true,
				"extended": true
			},
			"CodeCity": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdCity",
				"refmodel": "city",
				"index": true,
				"extended": true
			},
			"CodeParentOrg": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdParentOrg",
				"refmodel": "org",
				"index": true,
				"extended": true
			},
			"CodeHoldingOrg": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdHoldingOrg",
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
			"IdPeriod": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"OldIdPeriod": {
				"type": Number,
				"default": -1,
				"view": "none"
			},
			"OldFormula": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"IsReportPeriod": {
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
			"IdTaskFuntion": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodeTaskFuntion": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IdTask": {
				"type": Number,
				"default": 0,
				"refmodel": "task",
				"view": "none",
				"dep": "CodeTask",
				"hidden": true
			},
			"IdFunction": {
				"type": Number,
				"default": 0,
				"refmodel": "function",
				"view": "none",
				"dep": "CodeFunction",
				"hidden": true
			},
			"CodeTask": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdTask",
				"refmodel": "task",
				"index": true,
				"extended": true
			},
			"CodeFunction": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdFunction",
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
			"IdLabel": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			},
			"Idx": {
				"type": Number,
				"default": 0,
				"view": "none"
			}
		}
	},
	"presentslottype": {
		"tablename": "[spr].[PresentSlotTypes]",
		"menuplace": "Service",
		"fields": {
			"IdPresentSlotType": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdReport": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdDoc": {
				"type": Number,
				"default": 0,
				"refmodel": "doc",
				"view": "none",
				"dep": "CodeDoc",
				"hidden": true
			},
			"IdUser": {
				"type": Number,
				"default": 0,
				"refmodel": "user",
				"view": "none",
				"dep": "CodeUser",
				"hidden": true
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
			"IdGrp": {
				"type": Number,
				"default": 0,
				"refmodel": "grp",
				"view": "none",
				"dep": "CodeGrp",
				"hidden": true
			},
			"IdPeriodGrp": {
				"type": Number,
				"default": 0,
				"refmodel": "periodgrp",
				"view": "none",
				"dep": "CodePeriodGrp",
				"hidden": true
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
				"dep": "IdDoc",
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodeUser": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdUser",
				"refmodel": "user",
				"index": true,
				"extended": true
			},
			"CodeGrp": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdGrp",
				"refmodel": "grp",
				"index": true,
				"extended": true
			},
			"CodePeriodGrp": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdPeriodGrp",
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
			"IdTag": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdUser": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdOrg": {
				"type": Number,
				"default": 0,
				"refmodel": "org",
				"view": "none",
				"dep": "CodeOrg",
				"hidden": true
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
			"OldIdUser": {
				"type": Number,
				"default": -1,
				"view": "none"
			},
			"OldUserRoles": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"OldUserSlotList": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"OldLoginUser": {
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
			"IdDepart": {
				"type": Number,
				"default": 0,
				"refmodel": "depart",
				"view": "none",
				"dep": "CodeDepart",
				"hidden": true
			},
			"IdObj": {
				"type": Number,
				"default": 0,
				"refmodel": "obj",
				"view": "none",
				"dep": "CodeObj",
				"hidden": true
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
				"dep": "IdOrg",
				"refmodel": "org",
				"index": true,
				"extended": true
			},
			"CodeDepart": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdDepart",
				"refmodel": "depart",
				"index": true,
				"extended": true
			},
			"CodeObj": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdObj",
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
			"IdLabelUser": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodeLabelUser": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IdObj": {
				"type": Number,
				"default": 0,
				"refmodel": "obj",
				"view": "none",
				"dep": "CodeObj",
				"hidden": true
			},
			"IdLabel": {
				"type": Number,
				"default": 0,
				"refmodel": "label",
				"view": "none",
				"dep": "CodeLabel",
				"hidden": true
			},
			"IdUser": {
				"type": Number,
				"default": 0,
				"refmodel": "user",
				"view": "none",
				"dep": "CodeUser",
				"hidden": true
			},
			"CodeObj": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdObj",
				"refmodel": "obj",
				"index": true,
				"extended": true
			},
			"CodeLabel": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdLabel",
				"refmodel": "label",
				"index": true,
				"extended": true
			},
			"CodeUser": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdUser",
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
			"IdRowTag": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"IdRow": {
				"type": Number,
				"default": 0,
				"refmodel": "row",
				"view": "none",
				"dep": "CodeRow",
				"hidden": true
			},
			"IdTag": {
				"type": Number,
				"default": 0,
				"refmodel": "tag",
				"view": "none",
				"dep": "CodeTag",
				"hidden": true
			},
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
				"dep": "IdRow",
				"refmodel": "row",
				"index": true,
				"extended": true
			},
			"CodeTag": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdTag",
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
			"IdCoursePeriod": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodeCoursePeriod": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IdPeriod": {
				"type": Number,
				"default": 0,
				"refmodel": "period",
				"view": "none",
				"dep": "CodePeriod",
				"hidden": true
			},
			"IdLinkPeriod": {
				"type": Number,
				"default": 0,
				"refmodel": "period",
				"view": "none",
				"dep": "CodeLinkPeriod",
				"hidden": true
			},
			"CodePeriod": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdPeriod",
				"refmodel": "period",
				"index": true,
				"extended": true
			},
			"CodeLinkPeriod": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdLinkPeriod",
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
			"IdObjTypeTag": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"IdObjType": {
				"type": Number,
				"default": 0,
				"refmodel": "objtype",
				"view": "none",
				"dep": "CodeObjType",
				"hidden": true
			},
			"IdTag": {
				"type": Number,
				"default": 0,
				"refmodel": "tag",
				"view": "none",
				"dep": "CodeTag",
				"hidden": true
			},
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
				"dep": "IdObjType",
				"refmodel": "objtype",
				"index": true,
				"extended": true
			},
			"CodeTag": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdTag",
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
			"IdObjType": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdObjClass": {
				"type": Number,
				"default": 0,
				"refmodel": "objclass",
				"view": "none",
				"dep": "CodeObjClass",
				"hidden": true
			},
			"OldIdObjType": {
				"type": Number,
				"default": -1,
				"view": "none"
			},
			"OldTagObjType": {
				"type": String,
				"default": "",
				"view": "none"
			},
			"CodeObjClass": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdObjClass",
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
			"IdParam": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdParamGrp": {
				"type": Number,
				"default": 0,
				"refmodel": "paramgrp",
				"view": "none",
				"dep": "CodeParamGrp",
				"hidden": true
			},
			"IdListDefinition": {
				"type": Number,
				"default": 0,
				"refmodel": "listdefinition",
				"view": "none",
				"dep": "CodeListDefinition",
				"hidden": true
			},
			"IdParamSet": {
				"type": Number,
				"default": 0,
				"refmodel": "paramset",
				"view": "none",
				"dep": "CodeParamSet",
				"hidden": true
			},
			"CodeParamGrp": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdParamGrp",
				"refmodel": "paramgrp",
				"index": true,
				"extended": true
			},
			"CodeListDefinition": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdListDefinition",
				"refmodel": "listdefinition",
				"index": true,
				"extended": true
			},
			"CodeParamSet": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdParamSet",
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
			"IdRoutePeriod": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodeRoutePeriod": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IdRoute": {
				"type": Number,
				"default": 0,
				"refmodel": "route",
				"view": "none",
				"dep": "CodeRoute",
				"hidden": true
			},
			"IdPeriod": {
				"type": Number,
				"default": 0,
				"refmodel": "period",
				"view": "none",
				"dep": "CodePeriod",
				"hidden": true
			},
			"IdDocType": {
				"type": Number,
				"default": 0,
				"refmodel": "doctype",
				"view": "none",
				"dep": "CodeDocType",
				"hidden": true
			},
			"IdGrp": {
				"type": Number,
				"default": 0,
				"refmodel": "grp",
				"view": "none",
				"dep": "CodeGrp",
				"hidden": true
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
				"dep": "IdRoute",
				"refmodel": "route",
				"index": true,
				"extended": true
			},
			"CodePeriod": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdPeriod",
				"refmodel": "period",
				"index": true,
				"extended": true
			},
			"CodeDocType": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdDocType",
				"refmodel": "doctype",
				"index": true,
				"extended": true
			},
			"CodeGrp": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdGrp",
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
			"IdDocLabel": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodeDocLabel": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IdDoc": {
				"type": Number,
				"default": 0,
				"refmodel": "doc",
				"view": "none",
				"dep": "CodeDoc",
				"hidden": true
			},
			"IdLabel": {
				"type": Number,
				"default": 0,
				"refmodel": "label",
				"view": "none",
				"dep": "CodeLabel",
				"hidden": true
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
			"IdPeriodGrp": {
				"type": Number,
				"default": 0,
				"refmodel": "periodgrp",
				"view": "none",
				"dep": "CodePeriodGrp",
				"hidden": true
			},
			"CodeDoc": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdDoc",
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodeLabel": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdLabel",
				"refmodel": "label",
				"index": true,
				"extended": true
			},
			"CodePeriodGrp": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdPeriodGrp",
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
			"IdProdSumGrp": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodeProdSumGrp": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IdProd": {
				"type": Number,
				"default": 0,
				"refmodel": "prod",
				"view": "none",
				"dep": "CodeProd",
				"hidden": true
			},
			"IdSumGrp": {
				"type": Number,
				"default": 0,
				"refmodel": "sumgrp",
				"view": "none",
				"dep": "CodeSumGrp",
				"hidden": true
			},
			"CodeProd": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdProd",
				"refmodel": "prod",
				"index": true,
				"extended": true
			},
			"CodeSumGrp": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdSumGrp",
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
			"IdChartColor": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdPresentSlideLayout": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdCommit": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdReportPeriods": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodeReportPeriod": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdReportPeriod",
				"refmodel": "period",
				"index": true,
				"extended": true
			},
			"IdPeriod": {
				"type": Number,
				"default": 0,
				"refmodel": "period",
				"view": "none",
				"dep": "CodePeriod",
				"hidden": true
			},
			"IdReportPeriod": {
				"type": Number,
				"default": 0,
				"refmodel": "period",
				"view": "none",
				"dep": "CodeReportPeriod",
				"hidden": true
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
				"dep": "IdPeriod",
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
			"IdDocParamKey": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodeDocParamKey": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IdDoc": {
				"type": Number,
				"default": 0,
				"refmodel": "doc",
				"view": "none",
				"dep": "CodeDoc",
				"hidden": true
			},
			"IdPeriodGrp": {
				"type": Number,
				"default": 0,
				"refmodel": "periodgrp",
				"view": "none",
				"dep": "CodePeriodGrp",
				"hidden": true
			},
			"IsInput": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IdParam": {
				"type": Number,
				"default": 0,
				"refmodel": "param",
				"view": "none",
				"dep": "CodeParam",
				"hidden": true
			},
			"IdParamSet": {
				"type": Number,
				"default": 0,
				"refmodel": "paramset",
				"view": "none",
				"dep": "CodeParamSet",
				"hidden": true
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
				"dep": "IdDoc",
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodePeriodGrp": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdPeriodGrp",
				"refmodel": "periodgrp",
				"index": true,
				"extended": true
			},
			"CodeParam": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdParam",
				"refmodel": "param",
				"index": true,
				"extended": true
			},
			"CodeParamSet": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdParamSet",
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
			"IdRouteRefPeriod": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodeRouteRefPeriod": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IdRoute": {
				"type": Number,
				"default": 0,
				"refmodel": "route",
				"view": "none",
				"dep": "CodeRoute",
				"hidden": true
			},
			"IdPeriod": {
				"type": Number,
				"default": 0,
				"refmodel": "period",
				"view": "none",
				"dep": "CodePeriod",
				"hidden": true
			},
			"IdRefPeriod": {
				"type": Number,
				"default": 0,
				"refmodel": "period",
				"view": "none",
				"dep": "CodeRefPeriod",
				"hidden": true
			},
			"CodeRoute": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdRoute",
				"refmodel": "route",
				"index": true,
				"extended": true
			},
			"CodePeriod": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdPeriod",
				"refmodel": "period",
				"index": true,
				"extended": true
			},
			"CodeRefPeriod": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdRefPeriod",
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
			"IdUserPermit": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"IdUser": {
				"type": Number,
				"default": 0,
				"refmodel": "user",
				"view": "none",
				"dep": "CodeUser",
				"hidden": true
			},
			"IdPermit": {
				"type": Number,
				"default": 0,
				"refmodel": "permit",
				"view": "none",
				"dep": "CodePermit",
				"hidden": true
			},
			"IdGrp": {
				"type": Number,
				"default": 0,
				"refmodel": "grp",
				"view": "none",
				"dep": "CodeGrp",
				"hidden": true
			},
			"IdObj": {
				"type": Number,
				"default": 0,
				"refmodel": "obj",
				"view": "none",
				"dep": "CodeObj",
				"hidden": true
			},
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
				"dep": "IdUser",
				"refmodel": "user",
				"index": true,
				"extended": true
			},
			"CodePermit": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdPermit",
				"refmodel": "permit",
				"index": true,
				"extended": true
			},
			"CodeGrp": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdGrp",
				"refmodel": "grp",
				"index": true,
				"extended": true
			},
			"CodeObj": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdObj",
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
			"IdValuta": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
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
			"IdPermitRole": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"IdPermit": {
				"type": Number,
				"default": 0,
				"refmodel": "permit",
				"view": "none",
				"dep": "CodePermit",
				"hidden": true
			},
			"IdPeriodGrp": {
				"type": Number,
				"default": 0,
				"refmodel": "periodgrp",
				"view": "none",
				"dep": "CodePeriodGrp",
				"hidden": true
			},
			"IdRole": {
				"type": Number,
				"default": 0,
				"refmodel": "role",
				"view": "none",
				"dep": "CodeRole",
				"hidden": true
			},
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
				"dep": "IdPermit",
				"refmodel": "permit",
				"index": true,
				"extended": true
			},
			"CodePeriodGrp": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdPeriodGrp",
				"refmodel": "periodgrp",
				"index": true,
				"extended": true
			},
			"CodeRole": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdRole",
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
			"IdRouteCheckPeriod": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodeRouteCheckPeriod": {
				"type": String,
				"default": null,
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IdRoute": {
				"type": Number,
				"default": 0,
				"refmodel": "route",
				"view": "none",
				"dep": "CodeRoute",
				"hidden": true
			},
			"IdDocType": {
				"type": Number,
				"default": 0,
				"refmodel": "doctype",
				"view": "none",
				"dep": "CodeDocType",
				"hidden": true
			},
			"IdGrp": {
				"type": Number,
				"default": 0,
				"refmodel": "grp",
				"view": "none",
				"dep": "CodeGrp",
				"hidden": true
			},
			"NoGrp": {
				"type": Boolean,
				"default": false,
				"view": "none"
			},
			"IdPeriod": {
				"type": Number,
				"default": 0,
				"refmodel": "period",
				"view": "none",
				"dep": "CodePeriod",
				"hidden": true
			},
			"IdCheckPeriod": {
				"type": Number,
				"default": 0,
				"refmodel": "period",
				"view": "none",
				"dep": "CodeCheckPeriod",
				"hidden": true
			},
			"RelYear": {
				"type": Number,
				"default": 0,
				"view": "none"
			},
			"IdCheckState": {
				"type": Number,
				"default": 0,
				"refmodel": "state",
				"view": "none",
				"dep": "CodeCheckState",
				"hidden": true
			},
			"CodeRoute": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdRoute",
				"refmodel": "route",
				"index": true,
				"extended": true
			},
			"CodeDocType": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdDocType",
				"refmodel": "doctype",
				"index": true,
				"extended": true
			},
			"CodeGrp": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdGrp",
				"refmodel": "grp",
				"index": true,
				"extended": true
			},
			"CodePeriod": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdPeriod",
				"refmodel": "period",
				"index": true,
				"extended": true
			},
			"CodeCheckPeriod": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdCheckPeriod",
				"refmodel": "period",
				"index": true,
				"extended": true
			},
			"CodeCheckState": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdCheckState",
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
			"IdPeriodGrpRef": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"IdPeriod": {
				"type": Number,
				"default": 0,
				"refmodel": "period",
				"view": "none",
				"dep": "CodePeriod",
				"hidden": true
			},
			"IdPeriodGrp": {
				"type": Number,
				"default": 0,
				"refmodel": "periodgrp",
				"view": "none",
				"dep": "CodePeriodGrp",
				"hidden": true
			},
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
				"dep": "IdPeriod",
				"refmodel": "period",
				"index": true,
				"extended": true
			},
			"CodePeriodGrp": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdPeriodGrp",
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
			"IdDocObjType": {
				"type": Number,
				"default": 0,
				"view": "none",
				"role": "id",
				"readonly": true,
				"index": true
			},
			"CodeDocObjType": {
				"type": String,
				"default": "",
				"view": "all",
				"role": "code",
				"index": true,
				"unique": true
			},
			"IdDoc": {
				"type": Number,
				"default": 0,
				"refmodel": "doc",
				"view": "none",
				"dep": "CodeDoc",
				"hidden": true
			},
			"IdObjClass": {
				"type": Number,
				"default": 0,
				"refmodel": "objclass",
				"view": "none",
				"dep": "CodeObjClass",
				"hidden": true
			},
			"IdObjType": {
				"type": Number,
				"default": 0,
				"refmodel": "objtype",
				"view": "none",
				"dep": "CodeObjType",
				"hidden": true
			},
			"IdParentObjClass": {
				"type": Number,
				"default": 0,
				"refmodel": "objclass",
				"view": "none",
				"dep": "CodeParentObjClass",
				"hidden": true
			},
			"IdParentObjTypes": {
				"type": Number,
				"default": 0,
				"refmodel": "objtype",
				"view": "none",
				"dep": "CodeParentObjTypes",
				"hidden": true
			},
			"CodeDoc": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdDoc",
				"refmodel": "doc",
				"index": true,
				"extended": true
			},
			"CodeObjClass": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdObjClass",
				"refmodel": "objclass",
				"index": true,
				"extended": true
			},
			"CodeObjType": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdObjType",
				"refmodel": "objtype",
				"index": true,
				"extended": true
			},
			"CodeParentObjClass": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdParentObjClass",
				"refmodel": "objclass",
				"index": true,
				"extended": true
			},
			"CodeParentObjTypes": {
				"type": String,
				"default": "",
				"view": "none",
				"dep": "IdParentObjTypes",
				"refmodel": "objtype",
				"index": true,
				"extended": true
			}
		}
	}
}