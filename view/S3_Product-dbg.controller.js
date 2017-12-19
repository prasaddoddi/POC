/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.require("sap.ca.scfld.md.controller.BaseDetailController");
jQuery.sap.require("cus.sd.salesorder.create.util.ModelUtils");
jQuery.sap.require("cus.sd.salesorder.create.util.Utils");
jQuery.sap.require("sap.ca.ui.message.message");
jQuery.sap.require("jquery.sap.history");
jQuery.sap.require("cus.sd.salesorder.create.util.ServiceHelper");

sap.ca.scfld.md.controller.BaseDetailController.extend("cus.sd.salesorder.create.view.S3_Product", {


onInit : function () {

	sap.ca.scfld.md.controller.BaseDetailController.prototype.onInit.call(this);

	var view = this.getView();

	view.setModel(this.oApplicationFacade.getApplicationModel("soc_cart"), "soc_cart");

    view.setModel(this.oApplicationFacade.getApplicationModel("img"),"img");

	this.oRouter.attachRouteMatched(function(oEvent) {

		if (oEvent.getParameter("name") === "productdetail") {

		    var data = oEvent.getParameter("arguments");

			this.updateModel(data);

			this.updateCartIcon();
			
			//jQuery.sap.history.addVirtualHistory();
		}
	}, this);

},

updateCartIcon : function(){
	var oCartModel = this.getView().getModel("soc_cart");
	this.getView().setModel(this.oApplicationFacade.getApplicationModel("soc_cart"),"soc_cart");
	if (oCartModel) {
		oCartModel.updateBindings();
	}
},

updateModel : function(data) {
	if(typeof data.productID === "undefined")
	{
		this.byId("header").setVisible(false);
		this.byId("oInformationListLeft").setVisible(false);
		this.byId("add").setVisible(false);
		return;
	}

	// show the information list if it has been hidden
	this.byId("oInformationListLeft").setVisible(true);
	this.getView().invalidate();

	// Construct the parameters
	this.productID = data.productID;
	this.salesOrganization = data.salesOrganization;
	this.distributionChannel = data.distributionChannel;
	this.division = data.division;
	this.customer = data.customerID;

	this.oProductModel = new sap.ui.model.json.JSONModel();

	var sParameters = "(ProductID='" + this.productID + "',SalesOrganization='" +
		this.salesOrganization + "',Division='" + this.division + "',CustomerNo='" + 
		this.customer + "',DistributionChannel='" + this.distributionChannel + "')";

	sap.ca.ui.utils.busydialog.requireBusyDialog();

    var that = this;

    var fnSuccess = function(response) {
        var oView = that.getView();
        var oProductData =
        {
            productID :  decodeURIComponent(that.productID),
            productDesc :response.ProductDesc,
            productListPrice :response.NetPrice,
            currency: response.Currency,
            uom : response.UOM,
            UnitofMeasureTxt:response.UOMDesc,
            salesOrganization : that.salesOrganization,
            distributionChannel : that.distributionChannel,
            productAttributes : response.ProductAttributes.results,
            imageFlag: response.ImageFlag
        };
        that.oProductModel.setData(oProductData);
        oView.setModel(that.oProductModel, "product");
        that.byId("header").setVisible(true);
        that.byId("oInformationListLeft").setVisible(true);
        that.byId("add").setVisible(true);
        // Get the product image
        if(response.ImageFlag)
        {
            var urlParameters = cus.sd.salesorder.create.util.ServiceHelper.getUrlParameters(that);
            var urlWithoutParameters = cus.sd.salesorder.create.util.ServiceHelper.getUrlWithoutParameters(that);
            this.metadataUrl = urlWithoutParameters + "/ProductImages('" + that.productID + "')/$value" + urlParameters;
            that.byId("header").setIcon(this.metadataUrl);
        }
        else
        {
            that.byId("header").setIcon(jQuery.sap.getModulePath("cus.sd.salesorder.create") + "/img/home/icon_product.png");
        }
        sap.ca.ui.utils.busydialog.releaseBusyDialog();

    };

    var fnError = function(oError) {
        cus.sd.salesorder.create.util.Utils.dialogErrorMessage(oError.response);
        sap.ca.ui.utils.busydialog.releaseBusyDialog();
   };

    // Get the product details
	this.oApplicationFacade.getODataModel().read("/Products" + sParameters, null, ["$expand=ProductAttributes"],
			true, fnSuccess, fnError);

},

_goToCart : function(){
	// Navigate to cart view
	 this.oRouter.navTo("soCreateCart", {

	});
},

_addProductToCart : function(){
	var oProductData = this.getView().getModel("product").getData();
	var oCartModel = this.oApplicationFacade.getApplicationModel("soc_cart");
	var ImageUrlVar;
	if(oProductData.imageFlag)
	{
        var urlParameters = cus.sd.salesorder.create.util.ServiceHelper.getUrlParameters(this);
        var urlWithoutParameters = cus.sd.salesorder.create.util.ServiceHelper.getUrlWithoutParameters(this);
		ImageUrlVar = urlWithoutParameters + "/ProductImages('" + oProductData.productID + "')/$value" + urlParameters;
	}
	else
	{
		ImageUrlVar = jQuery.sap.getModulePath("cus.sd.salesorder.create") + "/img/home/icon_product.png";
	}

	var nMonth = parseInt(oCartModel.getData().singleRdd.slice(4,6), 10) - 1;
	var dDate = new Date(oCartModel.getData().singleRdd.slice(0,4), nMonth, oCartModel.getData().singleRdd.slice(6,8));

	var productItem = {
			ProductID : oProductData.productID,
			ProductDesc: oProductData.productDesc,
			qty: 1.0,
			UOM: oProductData.uom,
			UnitofMeasureTxt:oProductData.UnitofMeasureTxt,
			RDD: oCartModel.getData().singleRdd,
			NetPrice: oProductData.productListPrice,
			currency: oProductData.currency,
			ImgUrl : ImageUrlVar,
			isVisible : true,
			formatRDD:dDate

	};

	var items = oCartModel.getData().oShoppingCartItems;

	items.push(productItem);

	oCartModel.getData().itemCount = cus.sd.salesorder.create.util.ModelUtils.getCartCount();

	oCartModel.updateBindings();

	cus.sd.salesorder.create.util.ModelUtils.updateCartIcon();

	// create toast message
	var sMessage = this.oApplicationFacade.getResourceBundle().getText("ADDED_ITEM");
   	sap.ca.ui.message.showMessageToast(sMessage);
},

getLength : function(results){
    var length = results ? results.length : 0;
    return this.oApplicationFacade.getResourceBundle().getText("DETAILS_INFORMATION", [length]);
},

_onNavigateBack : function() {
	window.history.go(-1);
}

});