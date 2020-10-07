sap.ui.define([
	"MassPOApprove/controller/BaseController",
	"sap/m/MessageBox",
	"sap/ui/model/Filter",
	"sap/ui/core/Fragment",
	"sap/ui/core/routing/History",
	"sap/ui/model/json/JSONModel",
	"jquery.sap.global",
	"MassPOApprove/model/formatter",
	"sap/ui/model/FilterOperator"
], function(BaseController, MessageBox, Filter, Fragment, History, JSONModel, jQuery, formatter) {
	"use strict";

	return BaseController.extend("MassPOApprove.controller.List", {
		formatter: formatter,

		onInit: function() {

			var oViewModel = new sap.ui.model.json.JSONModel();
			this.getRouter().attachRouteMatched(this.onRouteMatched, this);
			var oView = this.getView();
			oView.setModel(oViewModel, "oViewModel");
			var oTable = oView.byId("table");
			this.ODataModel = new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZPO_RELEASE_SRV/");
			var odropbx = oView.byId("doctyp");
			var docModel = odropbx.getModel("oViewModel");
			this.ODataModel.read("/DocumentTypes", {
				async: false,
				success: function(data) {
					docModel.setData(data);
					odropbx.setModel(docModel);
				},
				error: function(oError) {}
			});
		},
		onRouteMatched: function(oEvent) {
			var busyDialog = new sap.m.BusyDialog();
			busyDialog.close();
			var that = this;
			that.dataLoad();
		},

		handleDocTypeSearch: function(oEvent) {
			var selectedItem = this.byId("doctyp").getSelectedKey();
			var oViewModel = new sap.ui.model.json.JSONModel();
			var oView = this.getView();
			oView.setModel(oViewModel, "oViewModel");
			var oTable = oView.byId("table");
			var filters = [];
			var docFilter = new sap.ui.model.Filter("DocTypeId", "EQ", selectedItem);
			filters.push(docFilter);
			this.oDataModel = new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZPO_RELEASE_SRV/");
			sap.ui.core.BusyIndicator.show(50);
			// insert url parameters
			this.oDataModel.read("/POHeaders", {
				urlParameters: {
					$expand: 'POItemSet'
				},
				filters: filters,
				async: true,
				success: function(data, response) {
					var values = {
						results: []
					};
					var item = {};
					var poItems = [];
					var poItem = {};
					for (var i = 0; i < data.results.length; i++) {

						item = {};
						item["Approved"] = data.results[i].Approved;
						item["PONumber"] = data.results[i].PONumber;
						item["VendorCode"] = data.results[i].VendorCode;
						item["VendorDesc"] = data.results[i].VendorDesc;

						for (var j = 0; j < data.results[i].POItemSet.results.length; j++) {
							poItem = {};
							poItem["AvaliableQty"] = data.results[i].POItemSet.results[j].AvaliableQty;
							poItem["CurrentPrice"] = data.results[i].POItemSet.results[j].CurrentPrice;
							poItem["Item"] = data.results[i].POItemSet.results[j].Item;
							poItem["MaterialCode"] = data.results[i].POItemSet.results[j].MaterialCode;
							poItem["MaterialDesc"] = data.results[i].POItemSet.results[j].MaterialDesc;
							poItem["OrderQty"] = data.results[i].POItemSet.results[j].OrderQty;
							poItem["PONumber"] = data.results[i].POItemSet.results[j].PONumber;
							poItem["Plant"] = data.results[i].POItemSet.results[j].Plant;
							poItem["PlantName"] = data.results[i].POItemSet.results[j].PlantName;
							poItem["PreviousPrice"] = data.results[i].POItemSet.results[j].PreviousPrice;
							poItem["QtyUnit"] = data.results[i].POItemSet.results[j].QtyUnit;
							poItem["PriceUnit"] = data.results[i].POItemSet.results[j].PriceUnit;
							poItem["DeliveryDate"] = data.results[i].POItemSet.results[j].DeliveryDate;
							poItems.push(poItem);
						}
						item["POItemSet"] = poItems;
						poItems = [];
						values.results.push(item);

					}
					var oModel = new sap.ui.model.json.JSONModel();
					oModel.setData(values);
					oTable.setModel(oModel);
					sap.ui.core.BusyIndicator.hide();
				},

				error: function(oError) {
					sap.m.MessageToast.show(oError);
				}

			});
		},
		onApprove: function(evt) {
			var busyDialog = new sap.m.BusyDialog();
			busyDialog.open(1000);
			var oView = this.getView();
			var table = oView.byId("table");
			var selectedItems = table.getSelectedItems();

			if (selectedItems.length === 0) {
				sap.m.MessageBox.show('Please select at least one item !', {
					icon: sap.m.MessageBox.Icon.WARNING,
					actions: [sap.m.MessageBox.Action.OK],
					title: 'Warning'

				});
			}
			var itemsArray = [];
			for (var i = 0; i < selectedItems.length; i++) {
				var cells = selectedItems[i].getCells();
				var po = cells[0].getHeaderText();
				itemsArray.push({
					PONumber: po.slice(0, 10)
				});
			}
			var payload = {
				Approved: true,
				POItemSet: itemsArray
			};
			var that = this;
			busyDialog.open(1000);
			this.ODataModel.create("/POHeaders", payload, {
				success: function(data) {
						sap.m.MessageToast.show("Purchase Order's are approved successfully");
									that.dataLoad();
										busyDialog.close();
				},
				error: function(oErr) {
					var message = $(oErr.response.body).find('message').first().text();
					sap.m.MessageBox.show(message, {
						title: 'Error',
						icon: sap.m.MessageBox.Icon.ERROR,
						actions: [sap.m.MessageBox.Action.CLOSE]
					});

				}

			});

		},

		onReject: function(evt) {
			var busyDialog = new sap.m.BusyDialog();
			busyDialog.open(50);
			var oView = this.getView();
			var table = oView.byId("table");
			var selectedItems = table.getSelectedItems();

			if (selectedItems.length === 0) {
				sap.m.MessageBox.show('Please select at least one item !', {
					icon: sap.m.MessageBox.Icon.WARNING,
					actions: [sap.m.MessageBox.Action.OK],
					title: 'Warning'

				});
			}

			sap.m.MessageBox.show("Are you sure you want to Reject this Purchase Order?", {
				title: "Confirm",
				icon: sap.m.MessageBox.Icon.CONFIRM,
				actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
				onClose: jQuery.proxy(function(action) {
					if (action === "YES") {
						var itemsArray = [];
						for (var i = 0; i < selectedItems.length; i++) {
							var cells = selectedItems[i].getCells();
							var po = cells[0].getHeaderText();
							itemsArray.push({
								PONumber: po.slice(0, 10)
							});
						}
						var payload = {
							Approved: false,
							POItemSet: itemsArray
						};
						var that = this;

						this.ODataModel.create("/POHeaders", payload, {
							success: function(data) {
									sap.m.MessageToast.show("Purchase Order's are rejected successfully");
									that.dataLoad();
										busyDialog.close();
							},
							error: function(oErr) {
								var message = $(oErr.response.body).find('message').first().text();
								sap.m.MessageToast.show(message, {
									title: 'Error',
									icon: sap.m.MessageBox.Icon.ERROR,
									actions: [sap.m.MessageBox.Action.CLOSE]
								});

							}
						});
					}
				}, this)
			});
		},
		dataLoad: function(oEvent) {
			var oView = this.getView();
			var oTable = oView.byId("table");
			this.ODataModel = new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZPO_RELEASE_SRV/");
			this.ODataModel.read("/POHeaders", {
				urlParameters: {
					$expand: 'POItemSet'
				},
				async: false,
				success: function(data) {

					var values = {
						results: []
					};
					var item = {};
					var poItems = [];
					var poItem = {};
					for (var i = 0; i < data.results.length; i++) {

						item = {};
						item["Approved"] = data.results[i].Approved;
						item["PONumber"] = data.results[i].PONumber;
						item["VendorCode"] = data.results[i].VendorCode;
						item["VendorDesc"] = data.results[i].VendorDesc;

						for (var j = 0; j < data.results[i].POItemSet.results.length; j++) {
							poItem = {};
							poItem["AvaliableQty"] = data.results[i].POItemSet.results[j].AvaliableQty;
							poItem["CurrentPrice"] = data.results[i].POItemSet.results[j].CurrentPrice;
							poItem["Item"] = data.results[i].POItemSet.results[j].Item;
							poItem["MaterialCode"] = data.results[i].POItemSet.results[j].MaterialCode;
							poItem["MaterialDesc"] = data.results[i].POItemSet.results[j].MaterialDesc;
							poItem["OrderQty"] = data.results[i].POItemSet.results[j].OrderQty;
							poItem["PONumber"] = data.results[i].POItemSet.results[j].PONumber;
							poItem["Plant"] = data.results[i].POItemSet.results[j].Plant;
							poItem["PlantName"] = data.results[i].POItemSet.results[j].PlantName;
							poItem["PreviousPrice"] = data.results[i].POItemSet.results[j].PreviousPrice;
							poItem["QtyUnit"] = data.results[i].POItemSet.results[j].QtyUnit;
							poItem["PriceUnit"] = data.results[i].POItemSet.results[j].PriceUnit;
							poItem["DeliveryDate"] = data.results[i].POItemSet.results[j].DeliveryDate;
							poItems.push(poItem);
						}
						item["POItemSet"] = poItems;
						poItems = [];
						values.results.push(item);

					}
					var oModel = new sap.ui.model.json.JSONModel();
					oModel.setData(values);
					oTable.setModel(oModel);
				},
				error: function(oError) {
					sap.m.MessageToast.show(oError);
				}
			});

		},

		onPress: function(oEvent) {
			//	var busyDialog = new sap.m.BusyDialog();
			//busyDialog.open(50);
			this.getRouter().navTo("Detail", {
				PONumber: oEvent.oSource.getBindingContext().getProperty("PONumber"),
				VendorCode: oEvent.oSource.getBindingContext().getProperty("VendorCode")
			});
		},
		handlePOSearch: function(oEvent) {
			/*		debugger;
					var sValue = oEvent.getSource().getValue();
									// 	var searchString = this.getView().byId("searchField").getValue();
					var oFilter = new Filter("PONumber", sap.ui.model.FilterOperator.Contains, sValue); //new Filter("ProjectName", "EQ", searchString);
					var oBinding = this.getView().byId("table").getBinding("items");
					oBinding.filter([oFilter]);*/
			sap.ui.core.BusyIndicator.show(10);
			var filters = [];
			var sQuery = oEvent.getSource().getValue();
			if (sQuery && sQuery.length > 0) {
				var filter = new sap.ui.model.Filter("PONumber", sap.ui.model.FilterOperator.Contains, sQuery);
				filters.push(filter);
			}
			// update list binding
			var list = this.getView().byId("table");
			var binding = list.getBinding("items");
			binding.filter(filters);
			sap.ui.core.BusyIndicator.hide();
		}
	});
});