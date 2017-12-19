/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.require("sap.ca.scfld.md.controller.BaseFullscreenController");
jQuery.sap.require("sap.ui.core.mvc.Controller");
jQuery.sap.require("cus.sd.salesorder.create.util.Utils");
jQuery.sap.require("cus.sd.salesorder.create.util.ServiceHelper");

sap.ca.scfld.md.controller.BaseFullscreenController.extend("cus.sd.salesorder.create.view.SalesOrderCartDetails", {

	_oBusyDialog : null,
    onInit : function() {
        this._view = this.getView();

        sap.ca.scfld.md.controller.BaseDetailController.prototype.onInit.call(this);

        this._oBusyDialog = new sap.m.BusyDialog();
        this.oRouter.attachRouteMatched(function(oEvent) {
            if (oEvent.getParameter("name") === "soCartDetails") {
                this.reloadData();
            }
        }, this);

    },

    reloadData : function() {

        this.oCartModel = this.oApplicationFacade.getApplicationModel("soc_cart");

        this._view = this.getView();

        this.oSOCartModel = this.oApplicationFacade.getODataModel();

        this.getView().setModel(this.oCartModel, "soc_cart");

        var customerNumber = this.oCartModel.getData().CustomerNumber;

        var salesOrganization = this.oCartModel.getData().SalesOrganization;

        var distributionChannel = this.oCartModel.getData().DistributionChannel;

        var division = this.oCartModel.getData().Division;

    	//var that = this;
    	var oParam = [ "$expand=PartnerAddressSet" ];

        function fnSuccess(response) {

            this.addresses = response.PartnerAddressSet.results;
            var cartModelData = this.oCartModel.getData();

            cartModelData.ShipToIncoTerms = response.ShipToIncoTerms;
            cartModelData.ShipToCarrier = response.ShipToCarrier;
            cartModelData.PartnerAddressSet = response.PartnerAddressSet.results;
            cartModelData.ShippingInstructions = cartModelData.ShippingInstructions ? cartModelData.ShippingInstructions : response.ShipToInstructions;
            cartModelData.NotesToReceiver = cartModelData.NotesToReceiver ? cartModelData.NotesToReceiver : response.ShipToReceiverNotes;

            if (this.addresses && this.addresses.length > 0 && typeof cartModelData.PartnerID === "undefined") {
                this._updateAddress(0);
            }

            this.oCartModel.updateBindings();

        }

        function fnError(oError) {
        	cus.sd.salesorder.create.util.Utils.dialogErrorMessage(oError.response);
        }

        this.oSOCartModel.read("/Customers(CustomerID='" + customerNumber + "',SalesOrganization='" + salesOrganization + "',DistributionChannel='" +
                distributionChannel + "',Division='" + division + "')/", null, oParam, true, jQuery.proxy(fnSuccess, this), jQuery.proxy(fnError, this));

    },

    onNavigateHome : function() {
        // Go back to the customers
        cus.sd.salesorder.create.util.ModelUtils.navToCustomers();
    },

    _onNavigateBack : function() {
    	window.history.go(-1);
    },

    onAddressSelect : function() {

        var selectedPartnerID = this.byId("AddressSelect").getSelectedItem().getKey();
        // var selectedPartnerName =
        // this.byId("AddressSelect").getSelectedItem().getValue();
        var i;
        for ( i = 0; i < this.addresses.length; i++) {
            var partnerID = this.addresses[i].PartnerID;
            if (partnerID === selectedPartnerID) {
                this._updateAddress(i);

                break;
            }

        }

    },

    simulateSalesOrderCreate : function() {

        var oSOJson = {};
		var serviceURL = cus.sd.salesorder.create.util.ServiceHelper.getServiceUrl(this);
        this.oSOCartModel = new sap.ui.model.odata.ODataModel(serviceURL, false);
        //var cartSModel = this.oApplicationFacade.getApplicationModel("soc_cart");
        var items = this.oApplicationFacade.getApplicationModel("soc_cart").getData().oShoppingCartItems;
    	var that = this;
        if (items.length > 0) {

            // this.oCartModel.getData().PurchaseOrder = "";
            if (typeof this.oCartModel.getData().PurchaseOrder === "undefined") {
                this.oCartModel.getData().PurchaseOrder = "";
            }
            if (typeof this.oCartModel.getData().NotesToReceiver === "undefined") {
                this.oCartModel.getData().NotesToReceiver = "";
            }
            if (typeof this.oCartModel.getData().ShippingInstructions === "undefined") {
                this.oCartModel.getData().ShippingInstructions = "";
            }

            // Add items to model, not required by the call

            // oSOJson.SingleShipment =
            // this.oCartModel.getData().SingleShipment;
            oSOJson.SalesOrderSimulation = true;
            oSOJson.SalesOrderNumber = "0";
            oSOJson.PO = this.oCartModel.getData().PurchaseOrder;
            oSOJson.RequestedDate = parseInt(this.oCartModel.getData().singleRdd, 10);
            oSOJson.CustomerID = this.oCartModel.getData().CustomerNumber;
            oSOJson.SalesOrganization = this.oCartModel.getData().SalesOrganization;
            oSOJson.DistributionChannel = this.oCartModel.getData().DistributionChannel;
            oSOJson.Division = this.oCartModel.getData().Division;
            oSOJson.OrderItemSet = [];
            // nItemCount
            // FIXME: count how many line items first ==>
            items = this.oCartModel.getData().oShoppingCartItems;

            var itemNumberFormat = sap.ui.core.format.NumberFormat.getIntegerInstance({
                minIntegerDigits : 6,
                maxIntegerDigits : 6
            });
            var j = 0;
            var i;
            for ( i = 0; i < items.length; i++) { // length of the oCartModel for products
                if (items[i].isVisible === true) {
                    var oChild = {};
                    oChild.Quantity = items[i].qty;
                    oChild.UnitofMeasure = items[i].UOM;
                    // oChild.NetAmount = items[i].NetAmount;
                    oChild.RequestedDeliveryDate = parseInt(items[i].RDD, 10);
                    // oChild.EstimatedDeliveryDate =
                    // items[i].EstimatedDeliveryDate;
                    // oChild.AvailableQuantity =
                    // items[i].AvailableQuantity;
                    // oChild.FinalPrice = items[i].FinalPrice;
                    oChild.Product = items[i].Product;
                    oChild.SalesOrderNumber = items[i].SalesOrderNumber;
                    //FIXME : generate line item number
                    oChild.ItemNumber = itemNumberFormat.format(10 * (i + 1));
                    oChild.Currency = items[i].Currency;

                    oChild.ProductName = items[i].ProductName;

                    oSOJson.OrderItemSet[j] = oChild;
                    j++;
                }
            }
            this._oBusyDialog.open();
           this.oSOCartModel.create("/SalesOrders", oSOJson, {
        		   success:function(oData, response) {
        	   		that._oBusyDialog.close();
                       cus.sd.salesorder.create.util.ModelUtils.updateCartModelFromSimulationResponse(response);

                   },
                   error:function fnError(oError) {
                	that._oBusyDialog.close();
                   	var errorTitle = that.oApplicationFacade.getResourceBundle().getText("ERROR");
                   	cus.sd.salesorder.create.util.Utils.dialogErrorMessage(oError.response,errorTitle);
                   }, async: true} );

        }

    },



    onNavigateReview : function() {
        //var purchaseOrder = this.oCartModel.getData().PurchaseOrder;

        this.oCartModel.getData().PurchaseOrder = this._view.byId("PUR_ORDER").getValue();

        this.oCartModel.getData().ShippingInstructions = this._view.byId("ship").getValue();

        this.oCartModel.getData().NotesToReceiver = this._view.byId("notes").getValue();

        this.oCartModel.getData().PhoneNumber = this._view.byId("phoneNum").getText();

        // Run the simulation first.
        this.simulateSalesOrderCreate();

        this.oRouter.navTo("soReviewCart", {});
    },

    _updateAddress : function(indexNumber) {
        this._view.byId("addresses1").setText(this.addresses[indexNumber].ShipToAddress1);
        this._view.byId("addresses2").setText(this.addresses[indexNumber].ShipToAddress2);
        this._view.byId("city").setText(this.addresses[indexNumber].ShipToCity);
        this._view.byId("state").setText(this.addresses[indexNumber].ShipToRegionName);
        this._view.byId("country").setText(this.addresses[indexNumber].ShipToCountryName);
        this._view.byId("zip").setText(this.addresses[indexNumber].ShipToPostalCode);
        this._view.byId("phoneNum").setText(this.addresses[indexNumber].ShipToTelephone);

        var address2Text = this.addresses[indexNumber].ShipToAddress2;

        var showAddress2 = ((typeof address2Text === "undefined") || (!address2Text.trim())) ? false : true;

        this._view.byId("addresses2").setVisible(showAddress2);

        // set the values for the model (next screen will need it)
        this.oCartModel.getData().PartnerName2 = this.addresses[indexNumber].PartnerName2;
        this.oCartModel.getData().PartnerID = this.addresses[indexNumber].PartnerID;
        this.oCartModel.getData().FormattedAddress1 = this.addresses[indexNumber].FormattedAddress1;
        this.oCartModel.getData().FormattedAddress2 = this.addresses[indexNumber].FormattedAddress2;
        this.oCartModel.getData().FormattedAddress3 = this.addresses[indexNumber].FormattedAddress3;
        this.oCartModel.getData().FormattedAddress4 = this.addresses[indexNumber].FormattedAddress4;
        this.oCartModel.getData().FormattedAddress5 = this.addresses[indexNumber].FormattedAddress5;
        this.oCartModel.getData().FormattedAddress6 = this.addresses[indexNumber].FormattedAddress6;
        this.oCartModel.getData().FormattedAddress7 = this.addresses[indexNumber].FormattedAddress7;
        this.oCartModel.getData().FormattedAddress8 = this.addresses[indexNumber].FormattedAddress8;
        this.oCartModel.getData().FormattedAddress9 = this.addresses[indexNumber].FormattedAddress9;

    },
    
    getHeaderFooterOptions : function() {
        var aButtonList = [];

            aButtonList.push({
                    sI18nBtnTxt : "REVIEW_ORDER",
                    onBtnPressed : jQuery.proxy(this.onNavigateReview, this)
                });

        return {
        	sI18NFullscreenTitle  : "CART_DETAILS_TITLE",
            buttonList : aButtonList,
            onBack : this._onNavigateBack,
            bSuppressBookmarkButton :true
        };
    }    

});
