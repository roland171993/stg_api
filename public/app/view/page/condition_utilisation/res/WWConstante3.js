// 19.0.1.0 WWConstante3.js
/*! VersionVI: 30F200041k x */
// Le seul support technique disponible pour cette librairie est accessible a travers le service "Assistance Directe".

// Days of the week
var STD_LUNDI = "Monday";
var STD_MARDI = "Thuesday";
var STD_MERCREDI = "Wednesday";
var STD_JEUDI = "Thursday";
var STD_VENDREDI = "Friday";
var STD_SAMEDI = "Saturday";
var STD_DIMANCHE = "Sunday";

// Month of the year
var STD_JANVIER = "January";
var STD_FEVRIER = "February";
var STD_MARS = "March";
var STD_AVRIL = "April";
var STD_MAI = "May";
var STD_JUIN = "June";
var STD_JUILLET = "July";
var STD_AOUT = "August";
var STD_SEPTEMBRE = "September";
var STD_OCTOBRE = "October";
var STD_NOVEMBRE = "November";
var STD_DECEMBRE = "December";

// Constants for the popup menu of tables/loopers
// Export
var TABLE_EXPORT =
{
	EXCEL: { sLibelle: "Export to Excel...", sTitre: "Export the content to Excel..." },
	WORD: { sLibelle: "Export to Word...", sTitre: "Export the content to Word..." },
	XML: { sLibelle: "Export to XML...", sTitre: "Export the content to XML..." },
	PDF: { sLibelle: "Print in PDF...", sTitre: "Print to a PDF file..." }
};
// Find/Filter
var TABLE_FILTRE =
{
	RECHERCHE: { sLibelle: "Find" },
	FILTRE: { sLibelle: "Filters:" },
	FILTRE_EGAL: { sLibelle: "Is equal to" },
	FILTRE_COMMENCE: { sLibelle: "Starts with" },
	FILTRE_CONTIENT: { sLibelle: "Contains" },
	FILTRE_TERMINE: { sLibelle: "Ends with" },
//	FILTRE_VIDE: { sLibelle: "Is empty" },
	FILTRE_DIFFERENT: { sLibelle: "Is different from" },
	FILTRE_COMMENCE_PAS: { sLibelle: "Does not start with" },
	FILTRE_CONTIENT_PAS: { sLibelle: "Does not contain" },
	FILTRE_TERMINE_PAS: { sLibelle: "Does not end with" },
	FILTRE_SUPERIEUR: { sLibelle: "Greater than" },
	FILTRE_SUPERIEUR_EGAL: { sLibelle: "Greater than or equal to" },
	FILTRE_INFERIEUR: { sLibelle: "Less than" },
	FILTRE_INFERIEUR_EGAL: { sLibelle: "Less than or equal to" },
	FILTRE_SUPPRIME: { sLibelle: "Delete the filter" }
};

// Constants for the popup menu of dashboards
var TDB_MENU =
{
	EDITION: { sLibelle: "Edit mode" },
	CONFINIT: { sLibelle: "Restore the initial configuration" }
};

// Error messages of debug
var STD_ERREUR_MESSAGE			= "Error running browser code\nError ";
var STD_ERREUR_CHAMP_FOCUS		= "SetFocus: unknown control";
var STD_ERREUR_NUM_CHAMP_FOCUS		= "1004";
var STD_ERREUR_CHAMP_OBLIGATOIRE1	= "'";
var STD_ERREUR_CHAMP_OBLIGATOIRE2	= "' control required";
var STD_TITRE_TRACE					= "Trace of WebDev browser codes";
var STD_INFO_TRACE					= "Ctrl+P enables you to print the trace window";
var STD_ERREUR_MESSAGE_UPLOAD		= "The upload failed.\nAn unexpected error occurred while uploading one of the files.\nCheck the size of the files to upload.";
var STD_ERREUR_MESSAGE_VIDEO		= "Unable to display the video file: %1.\n- Check whether the file exists on the server.\n- Check whether the consultation of this type of file (filtering by MIME type) is allowed by the Web server.";

// Tooltips and messages of the toolbar for the chart controls
var CHART_TOOLBAR =
{
	// Tooltips of the buttons in the bar
	ALTTEXT :
	{
		PIE : "Pie charts...",
		COL : "Bar charts...",
		CUR : "Line charts...",
		STO : "Stock charts...",
		SAV : "Save as...",
		PRI : "Print...",
		LEG : "Legend...",
		GDH : "Horizontal gridlines",
		GDV : "Vertical gridlines",
		SMO : "Smoothing",
		GRA : "Gradient",
		RAI : "Raised",
		ANT : "Anti-aliasing",
		TRA : "Transparency",
		MIR : "Crosshair",
		ANI : "Animation",
		INT : "Interactivity"
	},

	// Caption of the menu for the legend
	LEG :
	{
		0 : "None",
		1 : "Right",
		2 : "Left",
		3 : "Top",
		4 : "Bottom"
	},

	// Text of the menus for the types
	// Pie charts
	PIE :
	{
		0 : "Pie",
		1 : "Semi-circular",
		2 : "Donut",
		3 : "Funnel"
	},
	// Bar charts
	COL :
	{
		0 : "Clustered bar charts",
		1 : "Stacked bar charts",
		2 : "Grouped horizontal bar charts",
		3: "Stacked horizontal bar charts",
		4: "Waterfall"
	},
	// Line charts
	CUR :
	{
		0 : "Line",
		1 : "Scatter",
		2 : "Area",
		3 : "Radar",
		4 : "Bubbles"
	},
	// Stock charts
	STO :
	{
		0 : "Candlestick",
		1 : "BarCharts",
		2 : "MinMax"
	},
	// Tooltip
	MIR :
	{
		0 : "Multiple crosshair",
		1 : "Crosshair",
		2 : "Tooltip"
	}
};

// Tooltips and messages in the toolbar of the rich HTML edit control
var HTML_TOOLBAR =
{
	// Tooltips of the buttons in the bar
	ALTTEXT :
	{
		GRA : "Bold",
		ITA : "Italic",
		SOU : "Underline",
		BAR : "Strikeout",
		AGA : "Align left",
		ACE : "Center",
		ADR : "Align right",
		AJU : "Justify",
		LNU : "Numbering",
		LPU : "Bullets",
		RMO : "Decrease indent",
		RPL : "Increase indent",
		EXP : "Superscript",
		IND : "Subscript",
		COL : "Color",
		LNK : "Insert a link",
		IMG : "Insert an image",
		FNA : "Font",
		FSI : "Font size"
	},
	// Couleurs de la palette
	COFP:
	{
		0: "General",
		1: "Title",
		2: "Subtitle",
		3: "Note/Warning"
	},
	COLP :
	{
		0: "General",
		1: "Title",
		2: "Subtitle",
		3: "Link (1)",
		4: "Link (2)",
		5: "Note/Warning"
	},
	FHE:
	{
		0: "Normal",
		1: "Title 1",
		2: "Title 2",
		3: "Title 3",
		4: "Title 4",
		5: "Title 5",
		6: "Title 6",
		7: "Preformatted",
		8: "Highlighted"
	}
};

var tabWDErrors =
{
	// Message generiques :
	0: "Unknown error.",
	1: "Error in the browser code:\n",
	// Commun entre plusieurs modules
	// WDLanguage.js
	200: "Incorrect value subscript: access to subscript %1 while %2 value(s) have been found.",
	201: "Element not found in the associative array.",
	202: "The associative array contains %1 element(s) referenced by this key: unable to access element %2.",
	203: "Reading an element of an associative array with duplicates is not allowed with this syntax: several elements can be referenced by the same key.",
	204: "Invalid format.",
	// WDZRNavigateur.js
	300: "Wrong subscript: %1. The control is empty.",
	301: "Wrong subscript: %1. Values must be included between %2 and %3.",
	302: "The <%1> column is unknown.",
	303: "Bad constant value (%1).",
	// WDSQL.js
	400: "The <%1> query does not exist.",
	401: "No current connection.",
	// WDAJAX.js
	500: "Error while sending the query:\n%1",
	// WDUtil.js
	600: "Only structure of same definition can be assigned to structure."
};
