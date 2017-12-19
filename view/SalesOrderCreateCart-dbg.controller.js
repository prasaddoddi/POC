/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.require("sap.ca.scfld.md.controller.BaseFullscreenController");
jQuery.sap.require("sap.ui.core.mvc.Controller");
jQuery.sap.require("cus.sd.salesorder.create.util.ModelUtils");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("cus.sd.salesorder.create.util.Utils");
jQuery.sap.require("cus.sd.salesorder.create.util.Validator");

sap.ca.scfld.md.controller.BaseFullscreenController.extend("cus.sd.salesorder.create.view.SalesOrderCreateCart" , {
	validator: null,

	onInit : function() {
	  sap.ca.scfld.md.controller.BaseFullscreenController.prototype.onInit.call(this);
	  this.oRouter.attachRouteMatched(function(oEvent) {
			if (oEvent.getParameter("name") === "soCreateCart") {
				this.getView().setModel(this.oApplicationFacade.getApplicationModel("soc_cart"),"soc_cart");
				this.getView().updateBindings();
				this.validator = new cus.sd.salesorder.create.util.Validator();
			}
		}, this);
	},

	removeItem : function(event) {
		var button = event.getSource();

		var listItem = button.getParent();
		var path = listItem.getBindingContext("soc_cart").getPath();
		
		//Removed for fixing cart item count issue with UI5 1.32.*
		//var cartName = "oShoppingCartItems";
		//var extractPath = path.split("/");
		//var itemIndex = path.substr(path.lastIndexOf("/") + 1);
		
		var itemIndex = parseInt(path.substring(path.lastIndexOf('/') +1));
		
		//Removed for fixing cart item count issue with UI5 1.32.*
	/*	var i;
		for(i = 0; i < extractPath.length; i++) {
			if(extractPath[i] === cartName) {
				itemIndex = extractPath[i + 1];
				break;
			}
		}*/
		
		var datePickerCellPosition = 4;
		var datePicker = listItem.getCells()[datePickerCellPosition];
		this.validator.unregisterInvalidControl(datePicker.getId());
		
		// the below is done to avoid the images being re-rendered everytime when list-items gets removed.
		// might not be the best way !
		//mark the to be removed item as null
		//Removed for fixing cart item count issue with UI5 1.32.*
		//listItem.setParent(null);

		//update the model
		cus.sd.salesorder.create.util.ModelUtils.deleteCartItemAtIndex(itemIndex);
		//Removed for fixing cart item count issue with UI5 1.32.*
		//this.getView().byId("SOC_CART_LIST").removeItem(listItem);
	},

	//commented to use Dateinput instead of datepicker.
	setUniformRDD : function(event) {
		var datePicker = event.getSource();
		var sDate = event.getParameter("newYyyymmdd");
		if (sDate === null) {
			datePicker.setValueState("Error");
			this.validator.registerInvalidControl(datePicker.getId());
		} else {
			datePicker.getModel("soc_cart").setProperty("RDD", sDate, datePicker.getBindingContext("soc_cart"));
			datePicker.setValueState("None");
			this.validator.unregisterInvalidControl(datePicker.getId());
		}
	},

//	setUniformRDD : function(event) {
//		cus.sd.salesorder.create.util.ModelUtils.setUniformRddInCartModel();
//	},

	//Commenting to allow Dateinput usage
	setUniformSingleRdd : function(event) {
		var datePicker = event.getSource();
		var sDate = event.getParameter("newYyyymmdd");
		if (sDate === null) {
			datePicker.setValueState("Error");
			this.validator.registerInvalidControl(datePicker.getId());
		} else {
			this.getView().getModel("soc_cart").setProperty("/singleRdd", sDate);
			datePicker.setValueState("None");
			this.validator.unregisterInvalidControl(datePicker.getId());
		}
	},

	onATPCheck : function() {
		//	var bindingContext = this.getView().getBindingContext();
		//	var path = bindingContext.sPath;
		//	path = path.substr(1);
		//  Access the bound data for this page using the path.
		//	var modelData = new sap.ui.model.json.JSONModel();
		//	modelData.setData(bindingContext.getModel().oData[path]);
		//		this.oApplicationFacade.setApplicationModel(modelData,"soc_mainmodel");
		if (this.validator.getInvalidControlsNumber() === 0) {
			this.oRouter.navTo("quickCheckout", {});
		} else {
			sap.m.MessageBox.show(
					this.getView().getModel("i18n").getProperty("MISSING_INVALID"), 
					sap.m.MessageBox.Icon.ERROR, 
					this.getView().getModel("i18n").getProperty("MISSING_TITLE"), 
					[sap.m.MessageBox.Action.OK]
			);
		}
	},

    _onNavigateHome : function() {
    	// Go back to customers page
//	   	 this.oRouter.navTo("master", {
//	
//	   	});;
    	window.history.go(-1);
    },

	onNumberEnter : function(oEvent){
		var textValue = oEvent.getParameters().newValue;

		if(textValue.indexOf("-") !== -1){  // replace -ve values
			var restrictedValue = textValue.replace("-","");
			oEvent.getSource().setValue(restrictedValue);
		}
		if ( !this.isNumberFieldValid(textValue) ){
			oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
			this.validator.registerInvalidControl(oEvent.getSource().getId());
		}
		else{
			oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
			this.validator.unregisterInvalidControl(oEvent.getSource().getId());
		}
		
	},
	
	 getHeaderFooterOptions : function() {
	        var aButtonList = [];

	            aButtonList.push({
	                    sI18nBtnTxt : "CHECKOUT",
	                    onBtnPressed : jQuery.proxy(this.onATPCheck, this)
	                });

	        return {
	        	sI18NFullscreenTitle  : "CART",
	            buttonList : aButtonList,
	            onBack : jQuery.proxy(this._onNavigateHome, this),
	            bSuppressBookmarkButton :true
	        };
	    },
		isNumberFieldValid : function(testNumber){
		      var noSpaces = testNumber.replace(/ +/,'');  //Remove leading spaces
		      var isNum = /^\d+$/.test(noSpaces); // test for numbers only and return true or false
		      return isNum; 
		}
	

});