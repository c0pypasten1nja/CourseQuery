import Log from "../Util";
import { IInsightFacade, InsightDataset, InsightResponse, InsightDatasetKind } from "./IInsightFacade";
import DatasetController from "../controller/DatasetController";
import JSZip = require("jszip");

/**
 * This is the main programmatic entry point for the project.
 */
export default class InsightFacade implements IInsightFacade {

    private static datasetController: DatasetController;

    constructor() {
        Log.trace("InsightFacade::init()");
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<InsightResponse> {
        // return Promise.reject({code: -1, body: null});
        return new Promise(async function (fulfill, reject) {
            Log.trace("InsightFacade::addDataset()");
            // tslint:disable-next-line:prefer-const
            let data: object[] = [];
            const datasetController = InsightFacade.datasetController;

            if (datasetController.datasetExists(id)) {
                Log.trace("datasetController.datasetExists() error: dataset exists!");
                return Promise.reject({ code: 400, body: { error: "Dataset exists!" } });
            }

            try {
                const jsZip = new JSZip();
                const loadContent = await jsZip.loadAsync(content, { base64: true });
                const contentFiles = await Object.keys(loadContent.files);

                if (!datasetController.isFolderCourses(contentFiles)) {
                    Log.trace("datasetController.isValidDataset()");
                    return Promise.reject({ code: 400, body: { error: "Should not add folder not called courses!" } });
                }

                if (kind === InsightDatasetKind.Courses) {

                    for (const fileName of contentFiles) {

                        if (datasetController.isCSVfile(fileName)) {
                            const fileJson = await datasetController.csvJSON(fileName, id);
                            data.push(fileJson);
                        }
                    }
                    if (data.length === 0) {
                        return Promise.reject({ code: 400,
                            body: { error: "Should not add dataset with zero valid course section" } });
                    }
                }

                const dataset: InsightDataset = {id, kind, numRows: data.length};
                const datasetSaved = this.datasetController.saveDataset(id, dataset);
                if (datasetSaved) {
                    return  fulfill({ code: 204, body: { result: "dataset saved" } });
                }
            } catch (err) {
                return reject({ code: 400, body: { error: "Failed to load zip file!" } });
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
        return Promise.reject({ code: -1, body: null });
    }
}
