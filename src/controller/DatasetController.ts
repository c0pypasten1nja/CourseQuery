import Log from "../Util";
import JSZip = require("jszip");
import { InsightDataset, InsightResponse } from "./IInsightFacade";
import fs = require("fs");

export default class DatasetController {

    private datasets: Map<string, object[]>;
    private datasetlist: Map<string, InsightDataset>;

    constructor() {
        Log.trace("DatasetController::init()");
        this.datasets = new Map<string, object[]>();
        this.datasetlist = new Map<string, InsightDataset>();
    }

    public isValidId(id: string): boolean {
        const reserved = ["In", "dataset", "find", "all", "show", "and", "or", "sort", "by",
        "entries", "is", "the", "of", "whose", "includes", "begins", "ends", "_"];
        if ((id === "") || (typeof(id) !== "string") || (id === null) || (/\_/.test(id)) ||
        (reserved.indexOf(id) >= 0) || (/\s/.test(id)) ) {
            return false;
        } else {
            return true;
        }
    }

    public datasetExists(id: string): boolean {
        if (this.datasets.has(id) || fs.existsSync("./data/" + id + ".json")) {
            return true;
        } else {
            return false;
        }
    }

    public isFolderCourses(contentFiles: any): boolean {

        if (contentFiles.includes("courses/")) {
            return true;
        } else {
            return false;
        }
    }

    public isCSVfile(fileName: any): boolean {

        if (fileName.substring(fileName.length - 4) === ".csv") {
            return true;
        } else {
            return false;
        }
    }

    public csvJSON(csv: any, id: string) {
        const lines = csv.split("\n");
        const result: any = [];
        const headers = lines[0].split("|");
        const section = [];
        // Log.trace("csvJSON " + id + " " + lines);
        // Log.trace("csvJSON " + id + " " + lines.length);
        // if (lines.length === 2) {
        //     Log.trace("csvJSON " + id + " " + lines[0]);
        //     Log.trace("csvJSON " + id + " " + lines[1]);
        // }
        for (let h = 0; h < headers.length; h++) {
            if (headers[h] === "Title") {
                section[h] = id + "_title";
            }
            if (headers[h] === "id") {
                section[h] = id + "_uuid";
            }
            if (headers[h] === "Professor") {
                section[h] = id + "_instructor";
            }
            if (headers[h] === "Audit") {
                section[h] = id + "_audit";
            }
            if (headers[h] === "Year") {
                section[h] = id + "_year";
            }
            if (headers[h] === "Course") {
                section[h] = id + "_id";
            }
            if (headers[h] === "Pass") {
                section[h] = id + "_pass";
            }
            if (headers[h] === "Fail") {
                section[h] = id + "_fail";
            }
            if (headers[h] === "Avg") {
                section[h] = id + "_avg";
            }
            if (headers[h] === "Subject") {
                section[h] = id + "_dept";
            }
            if (headers[h] === "Section") {
                section[h] = id + "_year";
            }
        }

        if (lines.length > 2) {
            for (let i = 1; i < lines.length; i++) {

                const obj: Record<string, string | number> = {};

                const currentline = lines[i].split("|");

                for (let j = 0; j < section.length; j++) {
                    // tslint:disable-next-line:max-line-length
                    if (section[j] === id + "_title" || id + "_uuid" || id + "_instructor" || id + "_id" || id + "_dept") {
                        obj[section[j]] = currentline[j] as string;
                    } else {
                        if (currentline[j] === "overall") {
                            currentline[j] = 1900;
                        }
                        obj[section[j]] = currentline[j] as number;
                    }
                }

                if ( Object.keys(obj).length >= 9 ) {

                    result.push(obj);
                    return result;
                }
            }
        }
        return result;
    }

    public saveDataset(id: string, kind: any, data: any) {

        // saves to memory
        this.datasets.set(id, data);
        const dataset: InsightDataset = {id, kind, numRows: data.length};
        this.datasetlist.set(id, dataset);

        try {
            if (!fs.existsSync("./data")) {
                fs.mkdirSync("./data");
            }
            // saves to disk
            fs.writeFile("./data/" + id + ".json", JSON.stringify(data), (err) => {
                if (err) {
                    throw err;
                }
            });
        } catch (err) {
            return false;
        }
    }

    public controllerListDataset() {
        const insightdatasets: InsightDataset[] = [];

        this.datasetlist.forEach((value: InsightDataset, key: string) => {

            insightdatasets.push(value);
        });
        return insightdatasets;
    }

    public controllerRemoveDataset(id: string) {

        const datasettodelete: string = "./data/" + id + ".json";
        let datasetsDeleted = false;
        let datasetlistDeleted = false;
        let datasetDeleted = false;

        if (this.datasets.delete(id) || !this.datasets.has(id)) {
            Log.trace(id + " deleted from datasets");
            datasetsDeleted = true;
        }

        if (this.datasetlist.delete(id) || !this.datasetlist.has(id)) {
            Log.trace(id + " deleted from datasetlist");
            datasetlistDeleted = true;
        }

        if (fs.unlinkSync(datasettodelete) || !fs.existsSync(datasettodelete)) {
            Log.trace(datasettodelete + " deleted");
            datasetDeleted = true;
        }

        if (datasetsDeleted && datasetlistDeleted && datasetDeleted) {
            return true;
        }

    }

}
