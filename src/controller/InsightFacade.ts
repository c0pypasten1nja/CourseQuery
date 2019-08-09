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
        Log.trace("InsightFacadeImpl::init()");
    }

    public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<InsightResponse> {
        // return Promise.reject({code: -1, body: null});
            Log.trace("InsightFacade::addDataset()");
            // tslint:disable-next-line:prefer-const
            let data: object[] = [];
            const datasetController = InsightFacade.datasetController;

            // tslint:disable-next-line:prefer-const
            let datasetExists =  datasetController.datasetExists(id);
            if (datasetExists) {
                Log.trace("datasetController.datasetExists() error: dataset exists!");
                return Promise.reject({ code: 400, body: { error: "Dataset exists!" } });
            }

            try {
                const jsZip = new JSZip();
                const loadContent = await jsZip.loadAsync(content, { base64: true });
                const contentFiles = await Object.keys(loadContent.files);

                // tslint:disable-next-line:prefer-const
                let isFolderCourses = datasetController.isFolderCourses(contentFiles);
                if (!isFolderCourses) {
                    Log.trace("datasetController.isValidDataset()");
                    return Promise.reject({ code: 400,
                        body: { error: "Should not add folder not called courses!" } });
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
            } catch (err) {
                return Promise.reject({ code: 400,
                    body: { error: "Failed to load zip file!" } });
            }
            const dataset: InsightDataset = {id, kind, numRows: data.length};
            // tslint:disable-next-line:prefer-const
            let saveDataset = datasetController.saveDataset(id, dataset);
            if (saveDataset) {
                return Promise.resolve({ code: 204, body: { result: "dataset saved" } });
            }
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
