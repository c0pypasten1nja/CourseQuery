import Log from "../Util";
import JSZip = require("jszip");
import parse5 = require("parse5");
import { InsightDataset, InsightResponse } from "./IInsightFacade";
import fs = require("fs");
import * as http from "http";

export interface IGeoResponse {
    lat?: number;
    lon?: number;
    error?: string;
}

export default class DatasetController {

    private datasets: Map<string, object[]>;
    private datasetlist: Map<string, InsightDataset>;
    private buildingIndex: Map<string, object[]>;

    constructor() {
        // Log.trace("DatasetController::init()");
        this.datasets = new Map<string, object[]>();
        this.datasetlist = new Map<string, InsightDataset>();
        this.buildingIndex = new Map<string, object[]>();
    }

    public isValidId(id: string): boolean {
        const reserved = ["In", "dataset", "find", "all", "show", "and", "or", "sort", "by",
        "entries", "grouped", "where", "is", "the", "of", "whose", "includes", "begins", "ends", "_",
        "MAX", "MIN", "AVG", "SUM"];
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
        // if (id === "twoValidcsv") {
        //     Log.trace(id  + " headers " + headers);
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
            if (headers[h].trim() === "Subject") {
                section[h] = id + "_dept";
            }
            if (headers[h].trim() === "Section") {
                section[h] = id + "_year";
            }
        }

        if (lines.length > 2) {
            for (let i = 1; i < lines.length; i++) {

                const obj: any = {};

                const currentline = lines[i].split("|");

                for (let j = 0; j < section.length; j++) {
                    if (currentline.length > 1) {
                        if (section[j] === id + "_title" || section[j] === id + "_uuid" ||
                        section[j] === id + "_instructor" || section[j] === id + "_id"
                        || section[j] === id + "_dept") {
                            obj[section[j]] = currentline[j].trim() as string;
                        } else {
                            if (currentline[j] === "overall") {
                                currentline[j] = 1900;
                            }
                            obj[section[j]] = Number(currentline[j].trim());
                            // if (id === "twoValidcsv") {
                            //     Log.trace("currentline[j].trim() as number " + obj[section[j]]);
                            // }
                        }
                    }
                }
                if ( Object.keys(obj).length >= 9 ) {
                    result.push(obj);
                }
            }
            // if (id === "twoValidcsv") {
                // const num = currentline[j].trim() as number;
            //     Log.trace("result " + JSON.stringify(result));
            // }
        }

        // if (result.length < 10) {
        //     Log.trace("result " + JSON.stringify(result));
        // }
        return result;
    }

    public getBuildingsPath(indexPromise: any) {
        const doc: any = parse5.parse(indexPromise);
        const buildings = this.findTag(doc, "buildings");
        const result: any = [];
        for (const building of buildings.childNodes) {
            if (building.nodeName === "building") {
                // Log.trace("building.attrs " + JSON.stringify(building.attrs));
                for (const attr of building.attrs) {
                    // Log.trace("attr.name " + attr.name);
                    // Log.trace("attr.value " + attr.value);
                    if (attr.name === "path") {
                        result.push(attr.value.slice(2));
                    }
                }
            }
        }
        return result;
    }

    public async processRooms(id: string, roomsdata: any): Promise<any> {
            const doc: any = parse5.parse(roomsdata);
            const building = this.findTag(doc, "building");
            // Log.trace("building " + building);
            const result: any = [];
            const rooms = this.findTag(building, "rooms");
            const room = this.findTag(rooms, "room");
            if (room === undefined) {
                // Log.trace("room undefined");
                return Promise.resolve(result);
            }
            // Log.trace("room " + room);
            let shortname = "";
            let address = "";
            let fullname = "";
            let lat: number;
            let lon: number;

            for (const attr of building.attrs) {
                // Log.trace("building.attrs " + attr.value);
                if (attr.name === "id") {
                    shortname = attr.value.trim() as string;
                    // obj[id + "_shortname"] = shortname;
                }
                if (attr.name === "address") {
                    address = attr.value.trim() as string;
                    // obj[id + "_address"] = address;
                }
                if (attr.name === "name") {
                    fullname = attr.value.trim() as string;
                    // obj[id + "_fullname"] = attr.value.trim() as string;
                }
            }

            const geolocation: IGeoResponse = await this.getGeolocation(address);
            // Log.trace("Geolocation " + JSON.stringify(geolocation));
            if (geolocation.hasOwnProperty("lat")) {
                lat = Number(geolocation.lat);
            } else {
                lat = 0;
            }
            if (geolocation.hasOwnProperty("lon")) {
                lon = Number(geolocation.lon);
            } else {
                lon = 0;
            }

            for (const node of rooms.childNodes) {
                let roomnum = "";
                const obj: any = {};
                if (node.nodeName === "room") {
                    for (const attr of node.attrs) {
                        // Log.trace("node.attrs " + attr.value);
                        if (attr.name === "number") {
                            roomnum = attr.value.trim() as string;
                            obj[id + "_number"] = roomnum;
                        }
                    }

                    obj[id + "_shortname"] = shortname;
                    obj[id + "_address"] = address;
                    obj[id + "_fullname"] = fullname;
                    obj[id + "_name"] = shortname + "_" + roomnum;

                    const web = this.findTag(node, "web");
                    // Log.trace("web " + web);
                    const space = this.findTag(web, "space");
                    // Log.trace("space " + space);

                    if (web !== undefined) {
                        for (const attr of web.attrs) {
                            // Log.trace("web.attrs " + attr.value);
                            if (attr.name === "link") {
                                obj[id + "_href"] = attr.value.trim() as string;
                            }
                        }
                    }

                    if (space !== undefined) {
                        for (const attr of space.attrs) {
                            // Log.trace("space.attrs " + attr.value);
                            if (attr.name === "seats") {
                                obj[id + "_seats"] = Number(attr.value.trim());
                            }
                            if (attr.name === "furniture") {
                                obj[id + "_furniture"] = attr.value.trim() as string;
                            }
                            if (attr.name === "type") {
                                obj[id + "_type"] = attr.value.trim() as string;
                            }
                        }
                    }

                    obj[id + "_lat"] = lat;
                    obj[id + "_lon"] = lon;

                    result.push(obj);
                }
            }

            // if (room !== undefined) {
            //     for (const attr of room.attrs) {
            //         // Log.trace("room.attrs " + attr.value);
            //         if (attr.name === "number") {
            //             roomnum = attr.value.trim() as string;
            //             obj[id + "_number"] = roomnum;
            //         }
            //     }
            // } else {
            //     return Promise.resolve(result);
            // }

            // Log.trace("shortname " + shortname);
            // Log.trace("roomnum " + roomnum);

            return Promise.resolve(result);
    }

    public findTag(doc: any, tag: string) {
        let result: any;
        // const resultArray: any = [];
        // const nodeNameisTag = (doc.nodeName === tag);
        // Log.trace("nodeNameisTag " + nodeNameisTag);
        // Log.trace("doc.nodeName " + doc.nodeName);
        // Log.trace("tag " + tag);
        if (doc.nodeName === tag) {
            // Log.trace("doc " + doc);
            return doc;
        } else {
            if (doc.childNodes != null) {
                for (const childNodes of doc.childNodes) {
                    // Log.trace("childNodes " + childNodes);
                    result = this.findTag(childNodes, tag);
                    // Log.trace("result " + result);
                    if (result !== undefined) {
                        // resultArray.push(result);
                        return result;
                    }
                }
                // return resultArray;
            }
        }
    }

    public async getGeolocation(address: string) {
        return new Promise(function (resolve) {
        const url = "http://sdmm.cs.ubc.ca:11316/api/v1/team_ian72/" + encodeURI(address);

        // Log.trace("options " + JSON.stringify(options));
        http.get(url, (res) => {
                // const { statusCode } = res;
                // Log.trace("statusCode " + statusCode);
                // const contentType = res.headers["content-type"];
                // Log.trace("statusCocontentTypede " + contentType);

                // let error;
                // if (statusCode !== 200) {
                //   error = new Error("Request Failed.\n" +
                //                     `Status Code: ${statusCode}`);
                // } else if (!/^application\/json/.test(contentType)) {
                //   error = new Error("Invalid content-type.\n" +
                //                     `Expected application/json but received ${contentType}`);
                // }
                // if (error) {
                //     Log.trace(error.message);
                //   // Consume response data to free up memory
                //     res.resume();
                //     resolve(error);
                // }

                res.setEncoding("utf8");
                let rawData = "";
                res.on("data", (chunk) => { rawData += chunk; });
                res.on("end", () => {
                  try {
                    const parsedData = JSON.parse(rawData);
                    // Log.trace(JSON.stringify(parsedData));
                    resolve(parsedData);
                  } catch (e) {
                    Log.trace(e.message);
                    resolve(e);
                  }
                });
              }).on("error", (e) => {
                Log.trace(`Got error: ${e.message}`);
                resolve(e);
              });
        });
    }

    public saveDataset(id: string, kind: any, data: any) {

        // saves to memory
        this.datasets.set(id, data);
        // Log.trace("this.datasets " + this.datasets.get(id));
        const dataset: InsightDataset = {id, kind, numRows: data.length};
        // Log.trace(JSON.stringify(dataset) + " dataset");
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
        // Log.trace(JSON.stringify(this.datasetlist) + " datasetlist");
        this.datasetlist.forEach((value: InsightDataset, key: string) => {
            // Log.trace(JSON.stringify(value) + " datasetlist");
            insightdatasets.push(value);
        });
        return insightdatasets;
    }

    public controllerRemoveDataset(id: string) {

        const datasettodelete: string = "./data/" + id + ".json";
        let datasetsDeleted = false;
        let datasetlistDeleted = false;
        let datasetDeleted = false;
        let datasetUnlinked  = true;

        if (this.datasets.delete(id) || !this.datasets.has(id)) {
            // Log.trace(id + " deleted from datasets");
            datasetsDeleted = true;
        }

        if (this.datasetlist.delete(id) || !this.datasetlist.has(id)) {
            // Log.trace(id + " deleted from datasetlist");
            datasetlistDeleted = true;
        }

        try {
            fs.unlinkSync(datasettodelete);
        } catch (err) {
            // Log.trace(err + " datasettodeletetest");
            datasetUnlinked = false;
        }

        if (datasetUnlinked && !fs.existsSync(datasettodelete)) {
            // Log.trace(datasettodelete + " deleted");
            datasetDeleted = true;
        }

        if (datasetsDeleted && datasetlistDeleted && datasetDeleted) {
            return true;
        }

    }

    public getDataset(id: string) {

        if (this.datasets.has(id)) {
            return this.datasets.get(id);
        } else if (fs.existsSync("./data/" + id + ".json")) {
            return JSON.parse(fs.readFileSync("./data/" + id + ".json", "utf8"));
        }
    }

}
