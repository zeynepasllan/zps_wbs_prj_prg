sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/ui/core/Fragment"
], function (Controller, History, Fragment) {
	"use strict";

	return Controller.extend("com.aims.zpswbsprjprg.controller.BaseController", {
		/**
		 * Convenience method for accessing the router in every controller of the application.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function () {
			return this.getOwnerComponent().getRouter();
		},

		/**
		 * Convenience method for getting the view model by name in every controller of the application.
		 * @public
		 * @param {string} sName the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function (sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model in every controller of the application.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Convenience method for getting the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		/**
		 * Event handler for navigating back.
		 * It there is a history entry we go one step back in the browser history
		 * If not, it will replace the current entry of the browser history with the list route.
		 * @public
		 */
		onNavBack: function () {
			var sPreviousHash = History.getInstance().getPreviousHash();

			if (sPreviousHash !== undefined) {
				// eslint-disable-next-line sap-no-history-manipulation
				history.go(-1);
			} else {
				this.getRouter().navTo("list", {}, true);
			}
		},

		clearMessagePopover: function () {
			//Message manager clear
			sap.ui.getCore().getMessageManager().removeAllMessages();
		},

		_removeDuplicates: function () {

			let oMessageManager = sap.ui.getCore().getMessageManager(),
				oMessages = oMessageManager.getMessageModel().getData(),
				aMessageTexts = oMessages.map(oItem => oItem.message),
				messageData = this.getView().getModel("message").getData(),
				aMessages = [];

			aMessageTexts = [...new Set(aMessageTexts)];

			let fnFilterDuplicates = (oMessage) => {
				if (aMessageTexts.includes(oMessage.message)) {
					aMessageTexts.splice(aMessageTexts.indexOf(oMessage.message), 1);
					return oMessage;
				} else {
					return false;
				}
			};

			aMessages = oMessages.filter(fnFilterDuplicates);
			oMessageManager.getMessageModel().setData(aMessages);
			oMessageManager.getMessageModel().refresh();

			for (var x of messageData) {
				if (x.type === 'Error') {
					this.byId("buttonMessagePopover").setIcon("sap-icon://error");
					this.byId("buttonMessagePopoverDetail").setIcon("sap-icon://error");
					return;
				} else if (x.type === 'Success') {
					this.byId("buttonMessagePopover").setIcon("sap-icon://message-success");
					this.byId("buttonMessagePopoverDetail").setIcon("sap-icon://message-success");
				} else {
					this.byId("buttonMessagePopover").setIcon("sap-icon://alert");
					this.byId("buttonMessagePopoverDetail").setIcon("sap-icon://alert");
				}
			}
		},

		// _getMessagePopover: function () {
		// 	// Create popover lazily (singleton)
		// 	if (!this._oMessagePopover) {
		// 		this._oMessagePopover = sap.ui.xmlfragment(this.getView().getId(), "com.solviads.xm.expensemanagement.view.fragments.MessagePopover", this);
		// 		this.getView().addDependent(this._oMessagePopover);
		// 	}
		// 	return this._oMessagePopover;
		// 	this._removeDuplicates();
		// },

		_getMessagePopover: function () {
			var oView = this.getView();

			// create popover lazily (singleton)
			if (!this._oMessagePopover) {
				this._oMessagePopover = Fragment.load({
					id: oView.getId(),
					name: ""
				}).then(function (oMessagePopover) {
					oView.addDependent(oMessagePopover);
					return oMessagePopover;
				});
			}
			return this._oMessagePopover;
		},

		onButtonMessagePopoverPress: function (oEvent) {
			this._getMessagePopover().openBy(oEvent.getSource());
		},

		showMessagePopover: function () {
			let oButton = this.byId("idMessagePopover");

			setTimeout(function () {
				this._getMessagePopover().then(function (oMessagePopover) {
					oMessagePopover.openBy(oButton);
				});

			}.bind(this), 100);
		},

		onMessagePopoverPress: function (oEvent) {
			var oSourceControl = oEvent.getSource();
			this._getMessagePopover().then(function (oMessagePopover) {
				oMessagePopover.openBy(oSourceControl);
			});
		},

		onButtonMessagePopoverFragmentPress: function (oEvent) {
			var oMessagesButton = oEvent.getSource();

			if (!this._oMessagePopoverFragment) {
				this._oMessagePopoverFragment = new sap.m.MessagePopover({
					items: {
						path: "messageMdl>/",
						template: new sap.m.MessagePopoverItem({
							description: "{messageMdl>description}",
							type: "{messageMdl>type}",
							title: "{messageMdl>message}"
						})
					},
					afterClose: (oEvent) => {
						debugger;
						$.sap.array = [];
						this.getView().getModel("messageMdl").setData([]);
						this.getView().getModel("messageMdl").refresh();
						sap.ui.getCore().getMessageManager().removeAllMessages();
					}
				});

				oMessagesButton.addDependent(this._oMessagePopoverFragment);
			}

			this._oMessagePopoverFragment.toggle(oMessagesButton);
		},

		_addMessagesToArray: function (aMessages) {
			let oMessageManager = sap.ui.getCore().getMessageManager(),
				oMessages = oMessageManager.getMessageModel().getData();

			//for (var a = 0; a < oMessages.length; a++) {
			oMessages.push(new sap.ui.core.message.Message({
				message: JSON.parse(aMessages["headers"]["sap-message"]).message,
				type: JSON.parse(aMessages["headers"]["sap-message"]).severity,
				persistent: false
			}));
			//}
		},

		_removeDuplicateMessagesFromArray: function (aMessages) {
			let oMessage = [],
				bMessages = [],
				aMessage = [],
				aMessageTexts = aMessages.map(oItem => oItem.message),
				messageData;

			aMessageTexts = [...new Set(aMessageTexts)];

			let fnFilterDuplicates = (oMessage) => {
				if (aMessageTexts.includes(oMessage.message)) {
					aMessageTexts.splice(aMessageTexts.indexOf(oMessage.message), 1);
					return oMessage;
				} else {
					return false;
				}
			};

			debugger;
			aMessage = aMessages.filter(fnFilterDuplicates);
			this.getView().getModel("messageMdl").setData(aMessage);
			this.getView().getModel("messageMdl").refresh();
			messageData = aMessage;
			sap.ui.getCore().getMessageManager().removeAllMessages();

		},


		onDateCreateFormat: function (date) {
			var d = new Date(date), month = '' + (d.getMonth() + 1), day = '' + d.getDate(), year = d.getFullYear(); if (month.length < 2) month = '0' + month; if (day.length < 2) day = '0' + day; return [year, month, day].join('-') + "T00:00:00";
		},

		onFormatSapDate: function (fValue) {
			/** use with change datepicker format */
			/** convert '26.05.1987' to Tue May 26 1987 03:00:00 GMT+0300 (GMT+03:00) */
			if (fValue === undefined || fValue === '00000000' || (typeof fValue == 'string' && fValue.indexOf(".") <= -1)) {
				return "";
			}
			var formattedString = fValue.split(".")[2] + '.' + fValue.split(".")[1] + '.' + fValue.split(".")[0]; //'1987.05.26'
			var formattedDate = new Date(formattedString); //Tue May 26 1987 00:00:00 GMT+0000 (GMT+03:00)

			var formattedDateUTC = formattedDate.getTime() - formattedDate.getTimezoneOffset() * 60 * 1000; //for timezone issue
			var newDate = new Date(formattedDateUTC);
			return newDate;
		},

		onFormatDateTimetoDate: function (date) {

			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({

				pattern: "dd.MM.yyyy"

			});

			var shortDate = dateFormat.format(date);
			return shortDate;

		},

		createNewGuid: function (len) {

			var buf = [],
				chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
				charlen = chars.length,
				length = len || 32;

			for (var i = 0; i < length; i++) {

				buf[i] = chars.charAt(Math.floor(Math.random() * charlen));

			}
			return buf.join('');
		},

		openMessageViewDialog: function () {
			var that = this;
			var oView = this.getView();
			if (!this.oDialogMessageView) {
				this.oDialogMessageView = Fragment.load({
					id: oView.getId(),
					name: "com.aims",
					controller: this
				}).then(function (oDialog) {
					oView.addDependent(oDialog);
					return oDialog;
				});
			}
			this.oDialogMessageView.then(function (oDialog) {
				oDialog.open();
			});
		},

		onCloseMessageViewDialog: function (oEvent) {
			oEvent.getSource().getParent().close();
		},

		formatDate: function (sDate) {
			if (sDate === null || sDate === "" || sDate === "/Date(0)/") {
				return null;
			}
			if (sDate instanceof Date && !isNaN(new Date(sDate))) {
				return sDate;
			}

			var oDateMatch = sDate.match(/\/Date\((\d+)\)\//);
			if (oDateMatch) {
				var iTimestamp = parseInt(oDateMatch[1], 10);
				if (iTimestamp < 1e12) {
					iTimestamp *= 1000;
				}

				var oDate = new Date(iTimestamp);
				return oDate;
			}
			return null;
		},

		convertDateToTimestamp: function (dateString) {
			var date = new Date(dateString);
			return date.getFullYear().toString() +
				("0" + (date.getMonth() + 1)).slice(-2) +
				("0" + date.getDate()).slice(-2) +
				("0" + date.getHours()).slice(-2) +
				("0" + date.getMinutes()).slice(-2) +
				("0" + date.getSeconds()).slice(-2);
		},
		onCreate: function (sSet, oData, oModel) {
            return new Promise(function (fnSuccess, fnReject) {
                const mParameters = {
                    success: fnSuccess,
                    error: fnReject
                };
                oModel.create(sSet, oData, mParameters);
            });
        },
		showBusy: function () {
			sap.ui.core.BusyIndicator.show(0);
		},
		hideBusy: function () {
			sap.ui.core.BusyIndicator.hide();
		},


	});

});