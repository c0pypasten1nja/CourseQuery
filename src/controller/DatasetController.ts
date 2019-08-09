import Log from "../Util";
import JSZip = require("jszip");
import { InsightDataset } from "./IInsightFacade";
import fs = require("fs");

export default class DatasetController {

    private datasets: Map<string, InsightDataset>;

    constructor() {
        Log.trace("DatasetController::init()");
        this.datasets = new Map<string, InsightDataset>();
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
        const result = [];
        const headers = lines[0].split("|");
        const section = [];

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

        if (lines.length > 1) {
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
                result.push(obj);
            }
        }
        return result;
    }

    public saveDataset(id: string, data: any) {

        if (!fs.existsSync("./data")) {
            fs.mkdirSync("./data");
        }
        // saves to disk
        fs.writeFile("./data/" + id, JSON.stringify(data), (err) => {
            if (err) { throw err; }
        });
        // saves to memory
        this.datasets.set(id, data);
    }
}
