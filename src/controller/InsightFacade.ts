import Log from "../Util";
import { IInsightFacade, InsightDataset, InsightResponse, InsightDatasetKind } from "./IInsightFacade";
import DatasetController from "../controller/DatasetController";
import IConvertedQuery from "../controller/QueryController";
import QueryController from "../controller/QueryController";
import QueryConverter from "../controller/QueryConverter";
import JSZip = require("jszip");
import parse5 = require("parse5");
import fs = require("fs");
import { doesNotReject } from "assert";
import { resolve } from "path";

/**
 * This is the main programmatic entry point for the project.
 */
export default class InsightFacade implements IInsightFacade {

    private static datasetController= new DatasetController();
    private static queryController= new QueryController();

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<InsightResponse> {
        // return Promise.reject({code: -1, body: null});
        return new Promise(async (fulfill, reject) => {
            Log.trace("InsightFacade::addDataset()");
            // tslint:disable-next-line:prefer-const
            let data: any[] = [];
            const dataController = InsightFacade.datasetController;
            let InvalidID = false;
            if (!dataController.isValidId(id) ) {
                Log.trace("Invalid ID!");
                InvalidID = true;
                reject({ code: 400, body: { error: "Invalid ID!" } });
            }

            // tslint:disable-next-line:prefer-const
            let datasetExists =  dataController.datasetExists(id);
            if (datasetExists) {
                // Log.trace("datasetController.datasetExists()!");
                reject({ code: 400, body: { error: "Dataset exists!" } });
            }

            try {

                if (kind === InsightDatasetKind.Courses && !InvalidID && !datasetExists) {

                    const arrayPromise: any[]  = [];

                    JSZip.loadAsync(content, {base64: true}).then(async function (zip: JSZip) {

                        const contentFiles = Object.keys(zip.files);
                        // if (id === "twoValidcsv" || id === "oneValidcsv" || id === "validCvsOthers" ) {
                        //     Log.trace(id + " " + JSON.stringify(contentFiles) + " contentFiles");
                        // }
                        const isFolderCourses = dataController.isFolderCourses(contentFiles);
                        if (!isFolderCourses) {
                            // Log.trace("datasetController.isValidDataset()");
                            reject({ code: 400,
                                body: { error: "courses folder not found!" } });
                        }

                        zip.forEach(async function (relativePath, file: JSZip.JSZipObject) {
                            if (dataController.isCSVfile(file.name) && isFolderCourses) {
                                // Log.trace("datasetController.isCSVfile()");
                                const fileContents = file.async("text");
                                arrayPromise.push(fileContents);
                            }
                        });

                        Promise.all(arrayPromise).then( function (arrayContent) {
                            arrayContent.forEach( function (contentData) {
                                const fileJson =  dataController.csvJSON(contentData, id);
                                // if (id === "twoValidcsv") {
                                //     Log.trace(id + " " + JSON.stringify(fileJson) + " fileJson");
                                //     Log.trace(id + " fileJson " + Object.keys(fileJson).length);
                                // }
                                if (Object.keys(fileJson).length !== 0) {
                                    // Log.trace("fileJson " + Object.keys(fileJson).length);
                                    // data.push(fileJson);
                                    data = data.concat(fileJson);
                                }
                            });

                            // if (id === "twoValidcsv") {
                            //     Log.trace(id + " " + JSON.stringify(data) + " data");
                            //     Log.trace(id + " data " + data.length);
                            // }

                            if (data.length === 0) {
                                // Log.trace("data length " + data.length);
                                reject({ code: 400,
                                    body: { error: "Invalid course section!" } });
                            } else {
                                // Log.trace("data length " + data.length);
                                dataController.saveDataset( id, kind, data);
                                fulfill({ code: 204, body: { result: "dataset saved" } });
                            }
                        });
                    }).catch(function (err) {
                        reject({ code: 400,
                            body: { error: "Failed to load zip file!" } });
                        return;
                    });
                } else if (kind === InsightDatasetKind.Rooms && !InvalidID && !datasetExists) {

                    const arrayFilePromise: any[]  = [];
                    const arrayRoomPromise: any[]  = [];

                    JSZip.loadAsync(content, {base64: true}).then(async function (zip: JSZip) {

                        const indexXml = await zip.file("index.xml").async("text").then().catch((err) => {
                            Log.trace("indexXml.err " + err);
                            reject({ code: 400,
                                body: { error: "index not found!" } });
                        });

                        const paths = dataController.getBuildingsPath(indexXml);

                        for (const path of paths) {

                            const roomfile = await zip.file(path).async("text");
                            // const roomsPromise = await dataController.processRooms(id, roomfile);
                            // Log.trace("roomsPromise " + JSON.stringify(roomsPromise));
                            arrayFilePromise.push(roomfile);
                            // if (Object.keys(roomsPromise).length !== 0) {
                            //     data = data.concat(roomsPromise);
                            //     // data.push(roomsPromise[0]);
                            // }
                        }

                        // if (data.length === 0) {
                        //     // Log.trace("file.name " + file.name);
                        //     Log.trace("data length " + data.length);
                        //     reject({ code: 400,
                        //         body: { error: "Invalid rooms!" } });
                        //     // dataController.saveDataset( id, kind, data);
                        //     // fulfill({ code: 204, body: { result: "dataset saved" } });
                        // } else {
                        //     Log.trace("data length " + data.length);
                        //     dataController.saveDataset( id, kind, data);
                        //     fulfill({ code: 204, body: { result: "dataset saved" } });
                        // }

                        Promise.all(arrayFilePromise).then( function (arrayContent) {
                            arrayContent.forEach( async function (contentData) {
                                const roomsPromise = await dataController.processRooms(id, contentData);
                                // Log.trace("roomsPromise " + JSON.stringify(roomsPromise));

                                if (Object.keys(roomsPromise).length !== 0) {
                                    data = data.concat(roomsPromise);
                                    // data.push(roomsPromise[0]);
                                    // return data;
                                }
                                arrayRoomPromise.push(roomsPromise);
                                Promise.all(arrayRoomPromise).then( function () {
                                    // Log.trace("roomJson " + JSON.stringify(roomJson));
                                    // if (Object.keys(arrayContent).length !== 0) {
                                    //     data = data.concat(roomsPromise);
                                    // }
                                });
                                if (data.length !== 0) {
                                    // Log.trace("file.name " + file.name);
                                    // Log.trace("data length " + data.length);
                                    dataController.saveDataset( id, kind, data);
                                    fulfill({ code: 204, body: { result: "dataset saved" } });
                                    // reject({ code: 400,
                                    //     body: { error: "Invalid rooms!" } });
                                // } else {
                                //     Log.trace("data length " + data.length);
                                //     dataController.saveDataset( id, kind, data);
                                //     fulfill({ code: 204, body: { result: "dataset saved" } });
                                }
                            });
                            // if (data.length === 0) {
                            //     // Log.trace("file.name " + file.name);
                            //     Log.trace("data length " + data.length);
                            //     // reject({ code: 400,
                            //     //     body: { error: "Invalid rooms!" } });
                            // } else {
                            //     Log.trace("data length " + data.length);
                            //     dataController.saveDataset( id, kind, data);
                            //     fulfill({ code: 204, body: { result: "dataset saved" } });
                            // }
                        });

                        // zip.forEach(async function (relativePath, file: JSZip.JSZipObject) {

                        //     if (paths.indexOf(file.name) >= 0) {
                                // Log.trace("file.name " + file.name);
                                // const roomfile = await file.async("text");

                                // const roomsPromise = await dataController.processRooms(id, roomfile);
                                // Log.trace("roomsPromise " + JSON.stringify(roomsPromise));
                                // arrayRoomPromise.push(roomsPromise);
                                // if (Object.keys(roomsPromise).length !== 0) {
                                //     data = data.concat(roomsPromise);
                                    // data.push(roomsPromise[0]);
                            //     }
                            // }
                            // Log.trace("roomJsons " + JSON.stringify(roomJsons));
                            // return Promise.resolve(roomJsons);
                            // if (data.length === 0) {
                            //     Log.trace("file.name " + file.name);
                            //     Log.trace("data length " + data.length);
                                // reject({ code: 400,
                                //     body: { error: "Invalid rooms!" } });
                                // dataController.saveDataset( id, kind, data);
                                // fulfill({ code: 204, body: { result: "dataset saved" } });
                            // } else {
                            //     Log.trace("data length " + data.length);
                            //     dataController.saveDataset( id, kind, data);
                            //     fulfill({ code: 204, body: { result: "dataset saved" } });
                            // }
                        // });

                            // Promise.all(arrayRoomPromise).then( function (arrayContent) {
                            //     // arrayContent.forEach( async function (contentData) {
                            //         // Log.trace("contentData " + JSON.stringify(contentData));
                            //         // const roomJson = await dataController.processRooms(id, contentData);
                            //         // arrayRoomPromise.push(roompromise);
                            //         // Log.trace("roomJson " + JSON.stringify(roomJson));
                            //         // Promise.all(arrayRoomPromise).then( function (arrayRoom) {
                            //         //     arrayRoom.forEach( function (roomData) {
                            //             // Log.trace("roomData " + JSON.stringify(roomData));
                            //         if (Object.keys(arrayContent).length !== 0) {
                            //             // Log.trace("roomData " + Object.keys(roomData).length);
                            // //             // data.push(fileJson);
                            //             // data = data.concat(arrayContent);
                            //             data.push(arrayContent);
                            //         }
                            //     // });

                            //         if (data.length === 0) {
                            //             Log.trace("data length " + data.length);
                            //             // reject({ code: 400,
                            //             //     body: { error: "Invalid rooms!" } });
                            //             // dataController.saveDataset( id, kind, data);
                            //             // fulfill({ code: 204, body: { result: "dataset saved" } });
                            //         } else {
                            //             Log.trace("data length " + data.length);
                            //             dataController.saveDataset( id, kind, data);
                            //             fulfill({ code: 204, body: { result: "dataset saved" } });
                            //         }
                            //         //     });
                            //         // });

                            //     });
                            // });
                }).catch(function (err) {
                    reject({ code: 400,
                        body: { error: "Failed to load zip file!" } });
                    return;
                });

            }
        } catch (err) {
                reject({ code: 400,
                    body: { error: "Failed to load zip file!" } });
            }
        });
    }

    public removeDataset(id: string): Promise<InsightResponse> {

        const dataController = InsightFacade.datasetController;
        // Log.trace("removeDataset " + id);
        if (!dataController.isValidId(id) || !dataController.datasetExists(id)) {
            // Log.trace("Invalid ID!");
            return Promise.reject({ code: 404, body: { error: "Invalid ID!" } });
        } else if (dataController.controllerRemoveDataset(id)) {
            // Log.trace("controllerRemoveDataset()");
            return Promise.resolve({ code: 204, body: { result: "dataset removed" }});
        } else {
            return Promise.reject({ code: 404, body: { error: "Failed to remove dataset!" } });
        }
    }

    public performQuery(query: string): Promise<InsightResponse> {
        let convertQuery: QueryConverter;
        const queryController = InsightFacade.queryController;
        // if (queryController.inValidString(query)) {
        //     return Promise.reject({ code: 400, body: { error: "Invalid query!" } });
        // }
        try {
            convertQuery = new QueryConverter();
            const convertedQuery = convertQuery.convertQuery(query);
            // Log.trace("convertedQuery " + JSON.stringify(convertedQuery));
            const result = queryController.query(convertedQuery);
            return Promise.resolve({ code: 200, body: { result }});
        } catch (err) {
            // Log.trace("performQuery " + err);
            return Promise.reject({ code: 400, body: { error: "Invalid query!" } });
        }
        // return Promise.reject({ code: -1, body: null });
    }

    public listDatasets(): Promise<InsightResponse> {
        const dataController = InsightFacade.datasetController;
        const insightdatasets = dataController.controllerListDataset();
        // Log.trace("insightsucessbody " + insightdatasets);
        const insightsucessbody = {result: insightdatasets};
        // Log.trace("insightsucessbody " + JSON.stringify(insightsucessbody));
        return Promise.resolve({ code: 200, body: insightsucessbody });
    }
}
