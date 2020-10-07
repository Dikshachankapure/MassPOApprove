sap.ui.define([
	"MassPOApprove/controller/BaseController",
	"sap/m/MessageBox",
	"sap/ui/core/routing/History",
	"sap/ui/model/json/JSONModel",
	"jquery.sap.global",
	"MassPOApprove/model/formatter"
], function(BaseController, MessageBox, History, JSONModel, jquery, formatter) {
	"use strict";

	return BaseController.extend("MassPOApprove.controller.Detail", {
		formatter: formatter,
		onInit: function() {
			var oViewModel;
			var iOriginalBusyDelay;
			this.getRouter().attachRouteMatched(this.onRouteMatched, this);
			var oModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(oModel);
		},

		onNavBack: function() {
			var busyDialog = new sap.m.BusyDialog();
			busyDialog.open();
			this.getRouter().navTo("List");
		},

		onRouteMatched: function(oEvent) {
			var busyDialog = new sap.m.BusyDialog();
			busyDialog.close();
			var oParameters = oEvent.getParameters();

			// When navigating in the Detail page, update the binding context 
			if (oParameters.name !== "Detail") {
				return;
			}
			var oModel = this.getView().getModel();
			var oTable = this.getView().byId("tblDetail");
			var lblPONumber = this.getView().byId("objectHeader");
			var lblVendorCode = this.getView().byId("lblVendorCode");
			var lblDocDate = this.getView().byId("docDate");
			this.PONumber = oParameters.arguments.PONumber;
			this.VendorCode = oParameters.arguments.VendorCode;
			//lblPONumber.setTitle("PO Number: " + this.PONumber);
			//lblVendorCode.setText(this.VendorCode);
			var poNumber = this.PONumber;
			var vendorCode = this.VendorCode;
			var filters = [];
			var POFilter = new sap.ui.model.Filter("PONumber", "EQ", this.PONumber);
			filters.push(POFilter);
			var VednorFilter = new sap.ui.model.Filter("VendorCode", "EQ", this.VendorCode);
			filters.push(VednorFilter);

			this.odataModel = new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZPO_RELEASE_SRV/");

			// insert url parameters
			this.odataModel.read("/POHeaders", {
				urlParameters: {
					$expand: 'POItemSet'
				},
				filters: filters,
				async: false,
				success: function(data) {

					lblPONumber.setTitle("PO Number: " + poNumber);
					lblVendorCode.setText(data.results[0].VendorDesc + "(" + vendorCode + ")");
					//Convert date which is returned by Odata.
					var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
						pattern: "dd-MMM-yyyy"
					});
					lblDocDate.setText("Document Date: " + dateFormat.format(new Date(data.results[0].DocDate)));
					oModel.setData(data.results[0].POItemSet);
					oTable.setModel(oModel);

				},
				error: function(oError) {
					MessageBox.error(jQuery.parseJSON(oError.responseText).error.message.value);
				}
			});
		},
		onApprove: function(data) {

			var busyDialog = new sap.m.BusyDialog();
			var itemsArray = [];
			itemsArray.push({
				PONumber: this.PONumber
			});
			var payload = {
				Approved: true,
				POItemSet: itemsArray
			};
			busyDialog.open(1000);
			this.odataModel.create("/POHeaders", payload, {
				async: true,
				success: function(data) {
					sap.m.MessageToast.show("Purchase Order approved successfully");
					busyDialog.close();
					window.history.go(-1);

				},
				error: function(oErr) {
					var message = $(oErr.response.body).find('message').first().text();
					sap.m.MessageBox.alert(message, {
						title: 'Error',
						icon: sap.m.MessageBox.Icon.ERROR,
						actions: [sap.m.MessageBox.Action.CLOSE]
					});

				}

			});
		},
		handleMatSearch: function(oEvent) {
			var busyDialog = new sap.m.BusyDialog();
			var oModel = this.getView().getModel();
			var oTable = this.getView().byId("tblDetail");
			var lblPONumber = this.getView().byId("objectHeader");
			var lblVendorCode = this.getView().byId("lblVendorCode");
			var poNumber = this.PONumber;
			var vendorCode = this.VendorCode;
			var filters = [];
			var POFilter = new sap.ui.model.Filter("PONumber", "EQ", this.PONumber);
			filters.push(POFilter);
			var VednorFilter = new sap.ui.model.Filter("VendorCode", "EQ", this.VendorCode);
			filters.push(VednorFilter);
			var material = oEvent.getSource().getValue();
			var Material = new sap.ui.model.Filter("MatDesc", "EQ", material);
			filters.push(Material);
			this.odataModel = new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZPO_RELEASE_SRV/");
			busyDialog.open();
			// insert url parameters
			this.odataModel.read("/POHeaders", {
				urlParameters: {
					$expand: 'POItemSet'
				},
				filters: filters,
				async: false,
				success: function(data) {

					lblPONumber.setTitle("PO Number: " + poNumber);
					lblVendorCode.setText(data.results[0].VendorDesc + "(" + vendorCode + ")");

					oModel.setData(data.results[0].POItemSet);
					oTable.setModel(oModel);
					busyDialog.close();

				},
				error: function(oError) {
					MessageBox.error(jQuery.parseJSON(oError.responseText).error.message.value);
				}
			});
		},

		onReject: function(data) {
			var busyDialog = new sap.m.BusyDialog();
			sap.m.MessageBox.show("Are you sure you want to Reject this Purchase Order?", {
				title: "Confirm",
				icon: sap.m.MessageBox.Icon.CONFIRM,
				actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
				onClose: jQuery.proxy(function(action) {
					if (action === "YES") {

						var itemsArray = [];
						itemsArray.push({
							PONumber: this.PONumber
						});
						var payload = {
							Approved: false,
							POItemSet: itemsArray
						};
						this.odataModel.create("/POHeaders", payload, {
							success: function(data) {
								sap.m.MessageToast.show("Purchase Order's are rejected successfully");
								busyDialog.close();
								window.history.go(-1);
							},
							error: function(oErr) {
								var message = $(oErr.response.body).find('message').first().text();
								sap.m.MessageBox.alert(message, {
									title: 'Error',
									icon: sap.m.MessageBox.Icon.ERROR,
									actions: [sap.m.MessageBox.Action.CLOSE]
								});

							}

						});
					}
				}, this)
			});
		}
	});
});