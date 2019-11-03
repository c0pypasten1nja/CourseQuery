import Log from "../Util";
import { IInsightFacade, InsightResponse, InsightDatasetKind } from "./IInsightFacade";
import DatasetController from "../controller/DatasetController";
import QueryController from "../controller/QueryController";
import QueryConverter from "../controller/QueryConverter";
import JSZip = require("jszip");

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
                                if (Object.keys(fileJson).length !== 0) {
                                    // Log.trace("fileJson " + Object.keys(fileJson).length);
                                    data = data.concat(fileJson);
                                }
                            });

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
                    }).catch(function () {
                        reject({ code: 400,
                            body: { error: "Failed to load zip file!" } });
                        return;
                    });
                } else if (kind === InsightDatasetKind.Rooms && !InvalidID && !datasetExists) {

                    const arrayFilePromise: any[]  = [];

                    JSZip.loadAsync(content, {base64: true}).then(async function (zip: JSZip) {

                        const indexXml = await zip.file("index.xml").async("text").then().catch((err) => {
                            Log.trace("indexXml.err " + err);
                            reject({ code: 400,
                                body: { error: "index not found!" } });
                        });

                        const paths = dataController.getBuildingsPath(indexXml);

                        for (const path of paths) {
                            const roomfile = await zip.file(path).async("text");
                            arrayFilePromise.push(roomfile);
                        }

                        Promise.all(arrayFilePromise).then( function (arrayContent) {
                            let itemsProcessed = 0;
                            // Log.trace("arrayContent length 144 " + arrayContent.length);
                            arrayContent.forEach( async function (contentData) {
                                const roomsPromise = await dataController.processRooms(id, contentData);
                                // Log.trace("roomsPromise " + JSON.stringify(roomsPromise));
                                itemsProcessed++;
                                if (Object.keys(roomsPromise).length !== 0) {
                                    data = data.concat(roomsPromise);
                                }
                                if (data.length !== 0) {
                                    // Log.trace("file.name " + file.name);
                                    // Log.trace("data length 179 " + data.length);
                                    dataController.saveDataset( id, kind, data);
                                }
                                if (itemsProcessed === arrayContent.length) {
                                    // Log.trace("arrayContent length 170 " + arrayContent.length);
                                    fulfill({ code: 204, body: { result: "dataset saved" } });
                                }
                            });
                        });
                }).catch(function () {
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

    public performQuery(query: any): Promise<InsightResponse> {
        let convertQuery: QueryConverter;
        const queryController = InsightFacade.queryController;
        let convertedQuery: any;
        // if (queryController.inValidString(query)) {
        //     return Promise.reject({ code: 400, body: { error: "Invalid query!" } });
        // }
        try {
            if (typeof query === "string") {
                // Log.trace("query 294 " + query);
                convertQuery = new QueryConverter();
                convertedQuery = convertQuery.convertQuery(query);
                // Log.trace("convertedQuery 297 " + JSON.stringify(convertedQuery));
            } else {
                convertedQuery = query;
                // Log.trace("convertedQuery 299" + JSON.stringify(convertedQuery));
            }
            const result = queryController.query(convertedQuery);
            return Promise.resolve({ code: 200, body: { result }});
        } catch (err) {
            Log.trace("performQuery " + err);
            return Promise.resolve({ code: 400, body: { error: "Invalid query!" } });
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
