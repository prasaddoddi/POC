/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.controller("cus.sd.salesorder.create.Main", {

	onInit : function() {
        jQuery.sap.require("sap.ca.scfld.md.Startup");		


    	var oModelImages = new sap.ui.model.json.JSONModel();
    	var oModulePath = jQuery.sap.getModulePath("cus.sd.salesorder.create");
    	oModelImages.loadData(oModulePath + "/img/img.json");

		sap.ca.scfld.md.Startup.init("cus.sd.salesorder.create", this);

		var oApplicationImplementation = sap.ca.scfld.md.app.Application.getImpl();
		var oApplicationFacade = oApplicationImplementation.oConfiguration.oApplicationFacade;
		oApplicationFacade.setApplicationModel("img", oModelImages);
	}

});