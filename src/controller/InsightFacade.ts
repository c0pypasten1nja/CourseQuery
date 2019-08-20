import Log from "../Util";
import { IInsightFacade, InsightDataset, InsightResponse, InsightDatasetKind } from "./IInsightFacade";
import DatasetController from "../controller/DatasetController";
import JSZip = require("jszip");
import fs = require("fs");

/**
 * This is the main programmatic entry point for the project.
 */
export default class InsightFacade implements IInsightFacade {

    private static datasetController= new DatasetController();

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<InsightResponse> {
        // return Promise.reject({code: -1, body: null});
        return new Promise(async (fulfill, reject) => {
            Log.trace("InsightFacade::addDataset()");
            // tslint:disable-next-line:prefer-const
            let data: object[] = [];
            const dataController = InsightFacade.datasetController;
            const reserved = ["In", "dataset", "find", "all", "show", "and", "or", "sort", "by",
            "entries", "is", "the", "of", "whose", "includes", "begins", "ends", "_"];
            let InvalidID = false;
            if ((id === "") || (typeof(id) !== "string") || (id === null) || (/\_/.test(id)) ||
            (reserved.indexOf(id) >= 0) || (/\s/.test(id)) ) {
                Log.trace("Invalid ID!");
                InvalidID = true;
                reject({ code: 400, body: { error: "Invalid ID!" } });
            }
            Log.trace("reserved " + id + " " + reserved.indexOf(id) + " " + (reserved.indexOf(id) >= 0));

            // tslint:disable-next-line:prefer-const
            let datasetExists =  dataController.datasetExists(id);
            if (datasetExists) {
                Log.trace("datasetController.datasetExists()!");
                reject({ code: 400, body: { error: "Dataset exists!" } });
            }

            try {

                if (kind === InsightDatasetKind.Courses && !InvalidID && !datasetExists) {

                    const arrayPromise: Array<Promise<any>> = [];

                    JSZip.loadAsync(content, {base64: true}).then(async function (zip: JSZip) {

                        const contentFiles = await Object.keys(zip.files);
                        const isFolderCourses = dataController.isFolderCourses(contentFiles);
                        if (!isFolderCourses) {
                            Log.trace("datasetController.isValidDataset()");
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

                        Promise.all(arrayPromise).then(async function (arrayContent: string[]) {

                            for (content of arrayContent) {
                                const fileJson = await dataController.csvJSON(content, id);
                                if (Object.keys(fileJson).length !== 0) {
                                    // Log.trace("fileJson " + Object.keys(fileJson).length);
                                    data.push(fileJson[0]);
                                }
                            }

                            if (data.length === 0) {
                                Log.trace("data length " + data.length);
                                reject({ code: 400,
                                    body: { error: "Invalid course section!" } });
                            } else {
                                Log.trace("data length " + data.length);
                                dataController.saveDataset( id, kind, data);
                                fulfill({ code: 204, body: { result: "dataset saved" } });
                            }
                        });
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
        return Promise.reject({ code: -1, body: null });
    }

    public performQuery(query: string): Promise<InsightResponse> {
        return Promise.reject({ code: -1, body: null });
    }

    public listDatasets(): Promise<InsightResponse> {
        const dataController = InsightFacade.datasetController;
        const insightdatasets = dataController.controllerListDataset();
        const insightsucessbody = {result: insightdatasets};
        // Log.trace("insightsucessbody " + insightsucessbody);
        return Promise.resolve({ code: 200, body: insightsucessbody });
    }
}
