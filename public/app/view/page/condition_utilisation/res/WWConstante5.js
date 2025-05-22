// 19.0.1.0 WWConstante5.js
/*! VersionVI: 30F200066p x */
// Le seul support technique disponible pour cette librairie est accessible a travers le service "Assistance Directe".

// Constantes pour les jours de la semaine
var STD_LUNDI = "Lundi";
var STD_MARDI = "Mardi";
var STD_MERCREDI = "Mercredi";
var STD_JEUDI = "Jeudi";
var STD_VENDREDI = "Vendredi";
var STD_SAMEDI = "Samedi";
var STD_DIMANCHE = "Dimanche";

// Constantes pour les mois de l'annee
var STD_JANVIER = "Janvier";
var STD_FEVRIER = "F\xE9vrier";
var STD_MARS = "Mars";
var STD_AVRIL = "Avril";
var STD_MAI = "Mai";
var STD_JUIN = "Juin";
var STD_JUILLET = "Juillet";
var STD_AOUT = "Ao\xFBt";
var STD_SEPTEMBRE = "Septembre";
var STD_OCTOBRE = "Octobre";
var STD_NOVEMBRE = "Novembre";
var STD_DECEMBRE = "D\xE9cembre";

// Constantes des menus contextuel des tables/zones repetees
// Exportations
var TABLE_EXPORT =
{
	EXCEL: { sLibelle: "Exporter vers Excel...", sTitre: "Exporter le contenu vers Excel..." },
	WORD: { sLibelle: "Exporter vers Word...", sTitre: "Exporter le contenu vers Word..." },
	XML: { sLibelle: "Exporter vers XML...", sTitre: "Exporter le contenu vers XML..." },
	PDF: { sLibelle: "Imprimer en PDF...", sTitre: "Imprimer vers un fichier PDF..." }
};
// Recherche/filre
var TABLE_FILTRE =
{
	RECHERCHE: { sLibelle: "Rechercher" },
	FILTRE: { sLibelle: "Filtres :" },
	FILTRE_EGAL: { sLibelle: "Est \xE9gal \xE0" },
	FILTRE_COMMENCE: { sLibelle: "Commence par" },
	FILTRE_CONTIENT: { sLibelle: "Contient" },
	FILTRE_TERMINE: { sLibelle: "Se termine par" },
//	FILTRE_VIDE: { sLibelle: "Est vide" },
	FILTRE_DIFFERENT: { sLibelle: "Est diff\xE9rent de" },
	FILTRE_COMMENCE_PAS: { sLibelle: "Ne commence pas par" },
	FILTRE_CONTIENT_PAS: { sLibelle: "Ne contient pas" },
	FILTRE_TERMINE_PAS: { sLibelle: "Ne se termine pas par" },
	FILTRE_SUPERIEUR: { sLibelle: "Sup\xE9rieur \xE0" },
	FILTRE_SUPERIEUR_EGAL: { sLibelle: "Sup\xE9rieur ou \xE9gal \xE0" },
	FILTRE_INFERIEUR: { sLibelle: "Inf\xE9rieur \xE0" },
	FILTRE_INFERIEUR_EGAL: { sLibelle: "Inf\xE9rieur ou \xE9gal \xE0" },
	FILTRE_SUPPRIME: { sLibelle: "Supprimer le filtre" }
};

// Constantes du menus contextuel des tableaux de bords
var TDB_MENU =
{
	EDITION: { sLibelle: "Mode \xE9dition" },
	CONFINIT: { sLibelle: "Restaurer la configuration initiale" }
};

// Messages d'erreur de debug
var STD_ERREUR_MESSAGE = "Une erreur est survenue pendant l'ex\xE9cution du code navigateur\nErreur ";
var STD_ERREUR_CHAMP_FOCUS		= "DonneFocus : champ inconnu";
var STD_ERREUR_NUM_CHAMP_FOCUS		= "1004";
var STD_ERREUR_CHAMP_OBLIGATOIRE1	= "Champ '";
var STD_ERREUR_CHAMP_OBLIGATOIRE2	= "' obligatoire";
var STD_TITRE_TRACE					= "Trace des codes navigateur de WebDev";
var STD_INFO_TRACE = "Utiliser Ctrl+P pour imprimer la fen\xEAtre de trace";
var STD_ERREUR_MESSAGE_UPLOAD = "L'upload a \xE9chou\xE9.\nUne erreur inattendue est survenue pendant l'upload d'un des fichiers.\nV\xE9rifiez que les fichiers \xE0 uploader ne sont pas trop volumineux.";
var STD_ERREUR_MESSAGE_VIDEO = "Impossible de trouver le fichier vid\xE9o : %1.\nPour corriger ce probl\xE8me :\n- V\xE9rifiez que le fichier existe toujours sur le serveur.\n- V\xE9rifiez que le serveur WEB ne bloque pas les fichiers de ce type.";

// Bulles et messages de la barre d'outils des champs graphes
var CHART_TOOLBAR =
{
	// Bulles des images
	ALTTEXT :
	{
		PIE : "Secteurs...",
		COL : "Histogrammes...",
		CUR : "Courbes...",
		STO : "Boursiers...",
		SAV : "Enregistrer sous...",
		PRI : "Imprimer...",
		LEG: "L\xE9gende",
		GDH : "Quadrillage Horizontal",
		GDV : "Quadrillage Vertical",
		SMO : "Lissage",
		GRA: "D\xE9grad\xE9",
		RAI : "Relief",
		ANT: "Anticr\xE9nelage",
		TRA : "Transparence",
		MIR : "Mire",
		ANI : "Animation",
		INT : "Interactivit\xE9"
	},

	// Textes du menu de la legende
	LEG :
	{
		0 : "Aucune",
		1 : "Droite",
		2 : "Gauche",
		3 : "Haut",
		4 : "Bas"
	},

	// Texte des menus des types
	// Courbes
	PIE :
	{
		0 : "Secteur",
		1: "H\xE9micycle",
		2 : "Donut",
		3 : "Entonnoir"
	},
	// Histogrammes
	COL :
	{
		0: "Histogrammes group\xE9s",
		1: "Histogrammes empil\xE9s",
		2: "Histogrammes horizontaux group\xE9s",
		3: "Histogrammes horizontaux empil\xE9s",
		4: "Waterfall"
	},
	// Courbes
	CUR :
	{
		0 : "Courbe",
		1 : "Nuage de points",
		2 : "Aire",
		3 : "Radar",
		4 : "Bulles"
	},
	// Boursiers
	STO :
	{
		0 : "Chandeliers japonais",
		1 : "BarCharts",
		2 : "Minimum Maximum"
	},
	// Tooltip
	MIR :
	{
		0 : "Mire multiple",
		1 : "Mire",
		2 : "Bulle"
	}
};

// Bulles et messages de la barre d'outils du champ de saisie riche HTML
var HTML_TOOLBAR =
{
	// Bulles des boutons de la barre
	ALTTEXT :
	{
		GRA : "Gras",
		ITA : "Italique",
		SOU: "Soulign\xE9",
		BAR: "Barr\xE9",
		AGA: "Aligner \xE0 gauche",
		ACE : "Centrer",
		ADR: "Aligner \xE0 droite",
		AJU : "Justifier",
		LNU: "Num\xE9rotation",
		LPU : "Puces",
		RMO: "R\xE9duire le retrait",
		RPL : "Augmenter le retrait",
		EXP : "Exposant",
		IND : "Indice",
		COL : "Couleur",
		LNK: "Ins\xE9rer un lien",
		IMG: "Ins\xE9rer une image",
		FNA : "Police",
		FSI : "Taille de la police"
	},
	// Couleurs de la palette
	COFP :
	{
		0: "G\xE9n\xE9ral",
		1: "Titre",
		2: "Sous-titre",
		3: "Note / avertissement"
	},
	COLP :
	{
		0: "G\xE9n\xE9ral",
		1: "Titre",
		2: "Sous-titre",
		3: "Lien (1)",
		4: "Lien (2)",
		5: "Note / avertissement"
	},
	FHE :
	{
		0: "Normal",
		1: "Titre 1",
		2: "Titre 2",
		3: "Titre 3",
		4: "Titre 4",
		5: "Titre 5",
		6: "Titre 6",
		7: "Pr\xE9format\xE9",
		8: "Surlign\xE9"
	}
};

var tabWDErrors =
{
	// Message generiques :
	0: "Erreur inconnue.",
	1: "Erreur dans le code navigateur :\n",
	// Commun entre plusieurs modules
	// WDLanguage.js
	200: "Indice de valeur incorrect : acc\xE8s \xE0 l'indice %1 alors qu'il n'y a que %2 valeur(s).",
	201: "El\xE9ment inexistant dans le tableau associatif.",
	202: "Le tableau associatif poss\xE8de %1 \xE9l\xE9ment(s) r\xE9f\xE9renc\xE9(s) par cette cl\xE9 et vous tentez d'acc\xE9der \xE0 l'\xE9l\xE9ment %2.",
	203: "La lecture d'un \xE9l\xE9ment de tableau associatif avec doublon est interdite par cette syntaxe car plusieurs \xE9l\xE9ments peuvent \xEAtre r\xE9f\xE9renc\xE9s par une m\xEAme cl\xE9.",
	204: "Format invalide.",
	// WDZRNavigateur.js
	300: "L'indice sp\xE9cifi\xE9 %1 est invalide : le champ est vide.",
	301: "L'indice sp\xE9cifi\xE9 %1 est invalide : les valeurs valides sont comprises entre %2 et %3.",
	302: "Colonne <%1> inconnue.",
	303: "La valeur de la constante (%1) est invalide avec cette fonction.",
	// WDSQL.js
	400: "La requ\xEAte <%1> n'existe pas.",
	401: "Il n'y a pas de connexion courante.",
	// WDAJAX.js
	500: "Erreur lors de l'envoi de la requ\xEAte :\n%1",
	// WDUtil.js
	600: "On ne peut pas affecter \xE0 une structure autre chose qu'une structure de m\xEAme d\xE9finition."
};
