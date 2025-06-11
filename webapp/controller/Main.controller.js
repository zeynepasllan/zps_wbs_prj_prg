sap.ui.define([
    "./BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
    "sap/ui/core/BusyIndicator",
    "sap/gantt/simple/Relationship",
    "sap/m/MessageBox"
],
    function (BaseController, Filter, FilterOperator, Fragment, BusyIndicator, Relationship, MessageBox) {
        "use strict";
        var oContextMenu = new sap.m.Menu({
            items: [
                new sap.m.MenuItem({
                    text: "Delete"
                })
            ],
            itemSelected: function (oEvent) {
                var oItem = oEvent.getParameter("item");
                var oParent = oItem.getParent();
                var oShape = oContextMenu.selectedShape;
                var sShapeId = oShape.getShapeId();
                var oDataModel = oShape.getModel();
                let sEncodedKey = encodeURIComponent(sShapeId)
                if (oItem.getText() === "Delete") {
                    BusyIndicator.show(0);
                    oDataModel.remove("/RelationshipsSet('" + sEncodedKey + "')", {
                        refreshAfterChange: false,
                        success: function (oData, response) {
                            BusyIndicator.hide();
                        },
                        error: function (response) {
                            console.log(sShapeId);
                            BusyIndicator.hide();
                        }
                    });

                }
                oContextMenu.close();
            },
            closed: function (oEvent) {

            }
        });

        return BaseController.extend("com.aims.zpswbsprjprg.controller.Main", {
            onInit: function () {
                let oViewModel = new sap.ui.model.json.JSONModel({
                    alert: false,
                    Today: this.convertDateToTimestamp(new Date()),
                    StartTimeHorizon: this.convertDateToTimestamp(new Date(new Date().setMonth(new Date().getMonth() - 12))),
                    EndTimeHorizon: this.convertDateToTimestamp(new Date(new Date().setMonth(new Date().getMonth() + 12)))
                });

                this.getView().setModel(oViewModel, "oViewModel");
                this.getRouter().getRoute("RouteMain").attachPatternMatched(this.handleRouteMatched, this);
            },
            handleRouteMatched: function (oEvent) {
                this.getView().getModel().setDeferredGroups(["createOpp"]);
                this.getView().getModel().createEntry("/ProjectElemsDetailSet", {
                    properties: {
                        StartDatetime: null,
                        EndDatetime: null
                        // LongText: ""
                    },
                    groupId: "create",
                    success: function (oData) { },
                    error: function (oError) { },
                });
            },

            onAfterRendering: function () {

                this.getView().byId("gantt1").setSelectionPanelSize("40%");
                // var oTableGantt = this.getView().byId("gantt1");
                // this.oAlertCheckbox = new sap.m.CheckBox('alert', {
                //     text: 'Alert',
                //     enabled: true,
                //     select: this.onAlertClicked.bind(this)
                // });
                // oTableGantt.addEventDelegate({
                //     onAfterRendering: function () {
                //         var oGanttOverflowToolbar = oTableGantt.getChartOverflowToolbar();
                //         if (oGanttOverflowToolbar) {
                //             oGanttOverflowToolbar.addContent(this.oAlertCheckbox);
                //         }
                //     }.bind(this)
                // });
            },

            onAlertClicked: function () {
                var bAnimate = sap.ui.getCore().byId("alert").getSelected();
                this.getView().getModel("oViewModel").setProperty("/alert", bAnimate);
            },

            onShapeDrop: function (oEvent) {
                let oTableGantt = this.getView().byId("gantt1");
                let oDataModel = oTableGantt.getModel();
                let oNewDateTime = oEvent.getParameter("newDateTime");
                let oDraggedShapeDates = oEvent.getParameter("draggedShapeDates");
                let sLastDraggedShapeUid = oEvent.getParameter("lastDraggedShapeUid");
                let oOldStartDateTime = oDraggedShapeDates[sLastDraggedShapeUid].time;
                let oOldEndDateTime = oDraggedShapeDates[sLastDraggedShapeUid].endTime;
                let iMoveWidthInMs = oNewDateTime.getTime() - oOldStartDateTime.getTime();
                if (oTableGantt.getGhostAlignment() === sap.gantt.dragdrop.GhostAlignment.End) {
                    iMoveWidthInMs = oNewDateTime.getTime() - oOldEndDateTime.getTime();
                }

                let getBindingContextPath = function (sShapeUid) {
                    let oParsedUid = sap.gantt.misc.Utility.parseUid(sShapeUid);
                    return oParsedUid.shapeDataName;
                };

                Object.keys(oDraggedShapeDates).forEach(function (sShapeUid) {
                    let sPath = getBindingContextPath(sShapeUid);
                    let oOldDateTime = oDraggedShapeDates[sShapeUid].time;
                    let oOldEndDateTime = oDraggedShapeDates[sShapeUid].endTime;
                    let oNewDateTime = new Date(oOldDateTime.getTime() + iMoveWidthInMs);
                    let oNewEndDateTime = new Date(oOldEndDateTime.getTime() + iMoveWidthInMs);
                    oDataModel.setProperty(sPath + "/StartDatetime", oNewDateTime, true);
                    oDataModel.setProperty(sPath + "/EndDatetime", oNewEndDateTime, true);
                });
            },

            onShapeResize: function (oEvent) {
                let oShape = oEvent.getParameter("shape");
                let aNewTime = oEvent.getParameter("newTime");
                let sBindingPath = oShape.getBindingContext().getPath();
                let oTableGantt = this.getView().byId("gantt1");
                let oDataModel = oTableGantt.getModel();
                oDataModel.setProperty(sBindingPath + "/StartDatetime", aNewTime[0], true);
                oDataModel.setProperty(sBindingPath + "/EndDatetime", aNewTime[1], true);
            },

            onShapeContextMenu: function (oEvent) {
                let oShape = oEvent.getParameter("shape");
                let iPageX = oEvent.getParameter("pageX");
                let iPageY = oEvent.getParameter("pageY");

                if (oShape instanceof Relationship) {
                    oContextMenu.selectedShape = oShape;

                    let oPlaceHolder = new sap.m.Label();
                    let oPopup = new sap.ui.core.Popup(oPlaceHolder, false, true, false);
                    let eDock = sap.ui.core.Popup.Dock;
                    let sOffset = (iPageX + 1) + " " + (iPageY + 1);
                    oPopup.open(0, eDock.BeginTop, eDock.LeftTop, null, sOffset);
                    oContextMenu.openBy(oPlaceHolder);
                }
            },

            onShapePress: function (oEvent) {
                let oShape = oEvent.getParameter('shape');
                let oGantt = this.getView().byId("gantt1");
                let oContainer = oGantt.getParent();
                if (oShape) {
                    oContainer.setStatusMessage(oShape.getTitle());
                } else {
                    oContainer.setStatusMessage("");
                }
            },

            onShapeConnect: function (oEvent) {
                let sProjectId = this.getView().byId("idProjectInput").getValue();
                let sPYPId = this.getView().byId("idPYPInput").getValue();
                let oTableGantt = this.getView().byId("gantt1");
                let sFromShapeUid = oEvent.getParameter("fromShapeUid");
                let sToShapeUid = oEvent.getParameter("toShapeUid");
                let iType = oEvent.getParameter("type");

                let fnParseUid = sap.gantt.misc.Utility.parseUid;
                let oDataModel = oTableGantt.getModel();

                let oParsedUid = fnParseUid(sFromShapeUid);
                let sShapeId = oParsedUid.shapeId;
                let sRowId = fnParseUid(oParsedUid.rowUid).rowId;

                let sFromPath = "/ProjectElemsDetailSet('" + sRowId + "')";
                let sToPath = "/ProjectElemsDetailSet('" + fnParseUid(sToShapeUid).shapeId + "')";


                let sFromRelationType = oTableGantt.getModel().getProperty(sFromPath + "/RelationType");
                let sToRelationType = oTableGantt.getModel().getProperty(sToPath + "/RelationType");


                if (sFromRelationType !== sToRelationType || !sFromRelationType || !sToRelationType) {
                    MessageBox.error("Relationship can not be created!");
                    return;
                }

                BusyIndicator.show(0);

                let mParameters = {
                    context: oDataModel.getContext("/ProjectElemsDetailSet('" + sRowId + "')"),
                    success: function (oData) {
                        oDataModel.read("/ProjectElemsDetailSet('" + sRowId + "')", {
                            urlParameters: {
                                "$expand": "Relationships"
                            },
                            headers: {
                                "ProjectId": sProjectId,
                                "WbsId": sPYPId
                            }
                        });

                        BusyIndicator.hide();
                        console.log(sFromRelationType);
                        console.log(sToRelationType);
                    },
                    error: function (oError) {
                        BusyIndicator.hide();
                        console.log(sFromRelationType);
                        console.log(sToRelationType);
                    },
                    refreshAfterChange: false
                };

                // this.getView().byId("gantt1").getModel().getProperty(oEvent.getParameter("shape").getBindingContext().getPath() + "/ParentObjectId")

                // let sRelationshipID = "rls-temp-" + new Date().getTime();
                let sRelationshipID = "rls-temp-" + sRowId + "/" + fnParseUid(sToShapeUid).shapeId;
                let sRelationID = "rls-" + sRowId + "/" + fnParseUid(sToShapeUid).shapeId;
                let oNewRelationship = {
                    "ObjectId": sRelationshipID,
                    "RelationId": sRelationID,
                    "ParentObjectId": sRowId,
                    "PredecTaskId": sShapeId,
                    "SuccTaskId": fnParseUid(sToShapeUid).shapeId,
                    "RelationType": iType
                };

                oDataModel.create('/RelationshipsSet', oNewRelationship, mParameters);
                oDataModel.refresh(true);
                // oDataModel.submitChanges();

            },

            handleExpandShape: function (oEvent) {
                let oTableGantt = this.getView().byId("gantt1");
                let oTable = oTableGantt.getTable();
                let aSelectedRows = oTable.getSelectedIndices();
                oTable.expand(aSelectedRows);
            },

            handleCollapseShape: function (oEvent) {
                let oTableGantt = this.getView().byId("gantt1");
                let oTable = oTableGantt.getTable();
                let aSelectedRows = oTable.getSelectedIndices();
                oTable.collapse(aSelectedRows);
            },

            onGanttSidePanel: function (oEvent) {
                oEvent.getParameters().updateSidePanelState.enable();
            },

            checkStatus: function (sStartDate, sEndDate) {
                let iDaysDiff = (sEndDate - sStartDate) / (24 * 60 * 60 * 1000),
                    bMoreThanFourWeeks = iDaysDiff > (7 * 4);
                return bMoreThanFourWeeks;
            },

            onValueHelpRequestProjectId: function () {
                let oView = this.getView();
                if (!this._projectVHDialog) {
                    this._projectVHDialog = Fragment.load({
                        id: oView.getId(),
                        name: "com.aims.zpswbsprjprg.view.fragments.ProjectVH",
                        controller: this
                    }).then(function (oValueHelpDialog) {
                        oView.addDependent(oValueHelpDialog);
                        return oValueHelpDialog;
                    });
                }
                this._projectVHDialog.then(function (oValueHelpDialog) {
                    oValueHelpDialog.open();
                }.bind(this));
            },

            onProjectSearch: function (oEvent) {
                let aFilter = [];
                let sValue = oEvent.getParameter("value");
                let oFilterId = new Filter("ProjectId", FilterOperator.Contains, sValue);
                aFilter.push(oFilterId);
                // let oFilterDesc = new Filter("ProjectDescription", FilterOperator.Contains, sValue);
                // aFilter.push(oFilterDesc);
                let oBinding = oEvent.getParameter("itemsBinding");
                oBinding.filter(aFilter);
            },

            onProjectDialogClose: function (oEvent) {
                let aContexts = oEvent.getParameter("selectedContexts");
                if (aContexts && aContexts.length) {
                    this.getView().byId("idProjectInput").setValue(aContexts[0].getObject().ProjectId);
                    this.getView().getModel("oViewModel").setProperty("/SelectedProject", aContexts[0].getObject().ProjectId);

                } else {

                }
                oEvent.getSource().getBinding("items").filter([]);
            },

            onValueHelpRequestPYP: function (oEvent) {
                let oView = this.getView();
                if (!this._pypVHDialog) {
                    this._pypVHDialog = Fragment.load({
                        id: oView.getId(),
                        name: "com.aims.zpswbsprjprg.view.fragments.PYPVH",
                        controller: this
                    }).then(function (oValueHelpDialog) {
                        oView.addDependent(oValueHelpDialog);
                        return oValueHelpDialog;
                    });
                }
                this._pypVHDialog.then(function (oValueHelpDialog) {
                    oValueHelpDialog.open();
                }.bind(this));
            },

            onPYPDialogClose: function (oEvent) {
                let aContexts = oEvent.getParameter("selectedContexts");
                if (aContexts && aContexts.length) {
                    this.getView().byId("idPYPInput").setValue(aContexts[0].getObject().Wbs);
                    this.getView().getModel("oViewModel").setProperty("/SelectedPYP", aContexts[0].getObject().Wbs);

                } else {

                }
                oEvent.getSource().getBinding("items").filter([]);
            },

            onPYPSearch: function (oEvent) {
                let aFilter = [];
                let sValue = oEvent.getParameter("value");
                let oFilterId = new Filter("Wbs", FilterOperator.Contains, sValue);
                aFilter.push(oFilterId);
                // let oFilterDesc = new Filter("WbsDescription", FilterOperator.Contains, sValue);
                // aFilter.push(oFilterDesc);
                let oBinding = oEvent.getParameter("itemsBinding");
                oBinding.filter(aFilter);
            },

            onSearch: function () {
                this.getData();
            },

            getData: function () {
                let oView = this.getView();
                let oTableGantt = oView.byId("gantt1");
                let oTreeGant = oView.byId("treeGantt");
                let oModel = oTableGantt.getModel();

                let sProjectId = oView.byId("idProjectInput").getValue();
                let sPYPId = oView.byId("idPYPInput").getValue();

                let aFilters = [];

                if (sProjectId) {
                    aFilters.push(new Filter("ProjectId", FilterOperator.EQ, sProjectId));
                }

                if (sPYPId) {
                    aFilters.push(new Filter("WbsId", FilterOperator.EQ, sPYPId));
                }

                oTableGantt.getTable().unbindRows(); 
                
   
                let oNewODataModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZPS_WBS_PRJ_PRG_SRV/", {
                    useBatch: true, 
                    defaultBindingMode: sap.ui.model.BindingMode.TwoWay,
                    defaultOperationMode:sap.ui.model.odata.OperationMode.Server
                });
                oView.setModel(oNewODataModel); 
                oModel.refresh(true);
                oTableGantt.getTable()._getScrollExtension().scrollVertically(0);

                oTableGantt.getTable().bindRows({
                    path: "/ProjectElemsDetailSet",
                    filters: aFilters,
                    parameters: {
                        operationMode: "Server",
                        rootLevel: 0,
                        numberOfExpandedLevels: 3,
                        expand: "Relationships",
                        treeAnnotationProperties: {
                            hierarchyNodeFor: "ObjectId",
                            hierarchyParentNodeFor: "ParentObjectId",
                            hierarchyLevelFor: "HierarchyNodeLevel",
                            hierarchyDrillStateFor: "Drilldownstate",
                            hierarchyNodeDescendantCountFor: "Magnitude"
                        }
                    }
                });
            },

            onSaveButtonPress: function (oEvent) {
                debugger;
                let oDataModel = this.getView().getModel();
                let that = this;
                let oEntry = {};
                oEntry = {
                    ObjectId: oEvent.getSource().getParent().getRowBindingContext().getObject().ObjectId,
                    ParentObjectId: oEvent.getSource().getParent().getRowBindingContext().getObject().ParentObjectId,
                    // Magnitude: oEvent.getSource().getParent().getRowBindingContext().getObject().Magnitude,
                    // HierarchyNodeLevel: oEvent.getSource().getParent().getRowBindingContext().getObject().HierarchyNodeLevel,
                    // Drilldownstate: oEvent.getSource().getParent().getRowBindingContext().getObject().Drilldownstate,
                    // Start: oEvent.getSource().getParent().getRowBindingContext().getObject().Start,
                    // End: oEvent.getSource().getParent().getRowBindingContext().getObject().End,
                    // StartDatetime: oEvent.getSource().getParent().getRowBindingContext().getObject().StartDatetime,
                    // EndDatetime: oEvent.getSource().getParent().getRowBindingContext().getObject().EndDatetime,
                    // Percent: oEvent.getSource().getParent().getRowBindingContext().getObject().Percent,
                    // Explanation: oEvent.getSource().getParent().getRowBindingContext().getObject().Explanation,
                    // LongText: oEvent.getSource().getParent().getRowBindingContext().getObject().LongText,
                    ObjectName: oEvent.getSource().getParent().getRowBindingContext().getObject().ObjectName,
                    Pspid: oEvent.getSource().getParent().getRowBindingContext().getObject().Pspid,
                    Posid: oEvent.getSource().getParent().getRowBindingContext().getObject().Posid, 
                    Aplzl: oEvent.getSource().getParent().getRowBindingContext().getObject().Aplzl,
                    // Edit: oEvent.getSource().getParent().getRowBindingContext().getObject().ObjectId,
                    // RelationType: oEvent.getSource().getParent().getRowBindingContext().getObject().ObjectId,
                    // Color: oEvent.getSource().getParent().getRowBindingContext().getObject().ObjectId,

                },
                    BusyIndicator.show(0); 
                oDataModel.create("/ApproveChangeSet", oEntry, {
                    success: function (oData, oResp) {
                        debugger;
                        BusyIndicator.hide(0);
                        let responseMessage = JSON.parse(oResp["headers"]["sap-message"]);
                        MessageBox.show(responseMessage.message, {
                            icon: responseMessage.severity === "success" ? MessageBox.Icon.SUCCESS : MessageBox.Icon.ERROR,
                            actions: [MessageBox.Action.OK],
                            title: responseMessage.severity === "success" ? "Success" : "Error",
                            onClose: function () {
                                that.getData();
                            }
                        });

                    }.bind(this),
                    error: function () {
                        BusyIndicator.hide(0);
                    }
                });
            },

            getColorByObjectName: function (sObjectName) {
                if (!sObjectName) {
                    return "#0092D1"; // Default color
                }

                // Object Name'e göre renk belirle
                if (sObjectName.toUpperCase().includes("INITIAL-DATES")) {
                    return "red";
                } else if (sObjectName.toUpperCase().includes("MATERIAL-ON-SITE")) {
                    return "orange";
                }

                return "#0092D1"; // Varsayılan renk
            }

        });
    });
