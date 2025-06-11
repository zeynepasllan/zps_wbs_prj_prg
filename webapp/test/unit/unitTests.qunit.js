/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"comaims/zps_wbs_prj_prg/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
