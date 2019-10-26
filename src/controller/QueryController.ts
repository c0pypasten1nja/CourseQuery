import DatasetController from "../controller/DatasetController";
import Log from "../Util";
import fs = require("fs");
import {Decimal} from "decimal.js";

export interface IConvertedQuery {

    DATASET: string;
    FILTER: {};
    DISPLAY: string|string[];
    ORDER?: any;
    GROUP?: any;
    APPLY?: any;
}

export default class QueryController {

    private static datasetController= new DatasetController();
    private convertedQuery: IConvertedQuery;

    public query(convertedQuery: IConvertedQuery) {

        const dataController = QueryController.datasetController;
        const datasetToQuery = dataController.getDataset(convertedQuery.DATASET);
        const DATASET = convertedQuery.DATASET;
        // Log.trace("datasetToQuery " + DATASET);
        const groupArr = convertedQuery.GROUP;
        const applyArr = convertedQuery.APPLY;
        const displayArr = convertedQuery.DISPLAY;
        // let dataGroup: any;
        let results: any = [];

        // if ((DATASET !== "courses") && (DATASET !== "rooms")) {
        //     Log.trace("datasetToQuery " + JSON.stringify(datasetToQuery));
        // }

        let dataFiltered: any;
        if (Object.keys(convertedQuery.FILTER).length > 0) {
            dataFiltered = this.applyFilter(convertedQuery.FILTER, datasetToQuery);
        } else {
            dataFiltered = datasetToQuery;
        }
        // if (dataFiltered.length < 10) {
        //     Log.trace("dataFiltered " + JSON.stringify(dataFiltered));
        // }

        // Log.trace("Object.keys(convertedQuery.GROUP).length " + Object.keys(convertedQuery.GROUP).length);
        // Log.trace("Object.keys(convertedQuery.GROUP).length " + (Object.keys(convertedQuery.GROUP).length > 0));
        // Log.trace("dataFiltered.length " + dataFiltered.length);
        if ( (dataFiltered.length > 0) && (Object.keys(convertedQuery.GROUP).length < 1) ) {
            let datasetToDisplay = this.applyDisplay(displayArr, dataFiltered);
            // Log.trace("dataFiltered.length " + dataFiltered.length);
            // if (datasetToDisplay.length < 10) {
            //     Log.trace("datasetToDisplay preOrder " + JSON.stringify(datasetToDisplay));
            // }
            // Log.trace("convertedQuery.ORDER " + Object.keys(convertedQuery.ORDER).length);
            if (Object.keys(convertedQuery.ORDER).length > 0) {

                // if (datasetToDisplay.length < 10) {
                //     Log.trace("datasetToDisplay preOrder " + JSON.stringify(datasetToDisplay));
                // }
                datasetToDisplay = this.applyOrder(convertedQuery.ORDER.keys, datasetToDisplay);
                if (convertedQuery.ORDER.dir === "DESC") {
                    datasetToDisplay.reverse();
                }
            }
            // if (datasetToDisplay.length < 10) {
            //     Log.trace("datasetToDisplay postOrder " + JSON.stringify(datasetToDisplay));
            // }

            results = datasetToDisplay;
        }

        if (Object.keys(convertedQuery.GROUP).length > 0) {
            // if ((DATASET !== "courses") && (DATASET !== "rooms")) {
            //     Log.trace("groupArr " + JSON.stringify(groupArr));
            // }
            let dataGroup = this.applyGroup(groupArr, dataFiltered, DATASET);
            // if ((DATASET !== "courses") && (DATASET !== "rooms")) {
            //     Log.trace("dataGroup " + JSON.stringify(dataGroup));
            //     Log.trace("Object.keys(applyArr).length " + Object.keys(applyArr).length);
            // }
            if (Object.keys(applyArr).length > 0) {
                dataGroup = this.applyAgg(applyArr, dataGroup, DATASET);
            }
            // dataGroup = this.applyGroup(groupArr, dataFiltered, DATASET);
            // if ((DATASET !== "courses") && (DATASET !== "rooms")) {
            //     Log.trace("dataGroup " + JSON.stringify(dataGroup));
            // }
            if ( Object.keys(dataGroup).length > 0 ) {
                // Log.trace("Object.keys(dataGroup).length " + Object.keys(dataGroup).length);
                let dataGrpToDisplay = this.applyGrpDisplay(displayArr, dataGroup, DATASET);
                if (Object.keys(convertedQuery.ORDER).length > 0) {
                    // if ((convertedQuery.DATASET !== "courses") && (convertedQuery.DATASET !== "rooms")) {
                    //     Log.trace("datasetToDisplay preOrder " + JSON.stringify(dataGrpToDisplay));
                    // }
                    dataGrpToDisplay = this.applyOrder(convertedQuery.ORDER.keys, dataGrpToDisplay);
                    if (convertedQuery.ORDER.dir === "DESC") {
                        dataGrpToDisplay.reverse();
                    }
                }
                // if ((convertedQuery.DATASET !== "courses") && (convertedQuery.DATASET !== "rooms")) {
                //     Log.trace("datasetToDisplay postOrder " + JSON.stringify(dataGrpToDisplay));
                // }
                results = dataGrpToDisplay;
            }
        }

        // if ((convertedQuery.DATASET !== "courses") && (convertedQuery.DATASET !== "rooms")) {
        //     Log.trace("results " + JSON.stringify(results));
        // }

        return results;
    }

    private applyFilter(queryFilter: any, datasetToQuery: any) {

        const key: string = Object.keys(queryFilter)[0];
        const values: any = Object.values(queryFilter)[0];
        const valuesKey: string = Object.keys(values)[0];
        const valuesValue: any = Object.values(values)[0];

        let results: any;
        // Log.trace("applyFilter");
        // Log.trace("applyFilter key " + key);
        // Log.trace("applyFilter values " + JSON.stringify(values));
        // Log.trace("applyFilter values.key " + JSON.stringify(Object.keys(values)));
        // Log.trace("applyFilter values.values " + JSON.stringify(Object.values(values)));

        if (key === "AND") {
            // Log.trace("AND values[0] " + JSON.stringify(values[0]));
            // Log.trace("AND values[1] " + JSON.stringify(values[1]));
            const temp = this.applyFilter(values[0], datasetToQuery);
            results = this.applyFilter(values[1], temp);
        } else if (key === "OR") {
            // Log.trace("OR values[0] " + JSON.stringify(values[0]));
            // Log.trace("OR values[1] " + JSON.stringify(values[1]));
            const temp = this.applyFilter(values[0], datasetToQuery);
            results = temp.concat(this.applyFilter(values[1], datasetToQuery));
        } else if (key === "GT") {
            results = datasetToQuery.filter((dTQ: any) => dTQ[valuesKey] > valuesValue);
        } else if (key === "NLT") {
            results = datasetToQuery.filter((dTQ: any) => dTQ[valuesKey] >= valuesValue);
        } else if (key === "LT") {
            results = datasetToQuery.filter((dTQ: any) => dTQ[valuesKey] < valuesValue);
        } else if (key === "NGT") {
            results = datasetToQuery.filter((dTQ: any) => dTQ[valuesKey] <= valuesValue);
        } else if ((key === "EQ") || (key === "IS")) {
            results = datasetToQuery.filter((dTQ: any) => dTQ[valuesKey] === valuesValue);
        } else if ((key === "NEQ") || (key === "ISN")) {
            results = datasetToQuery.filter((dTQ: any) => dTQ[valuesKey] !== valuesValue);
        } else if (key === "INC") {
            results = datasetToQuery.filter((dTQ: any) => (dTQ[valuesKey].indexOf(valuesValue) >= 0));
        } else if (key === "DNI") {
            results = datasetToQuery.filter((dTQ: any) => (dTQ[valuesKey].indexOf(valuesValue) === -1));
        }  else if (key === "BW") {
            // Log.trace("dTQ[values] " + datasetToQuery[values]);
            // Log.trace("values " + values);
            results = datasetToQuery.filter((dTQ: any) => (dTQ[valuesKey].startsWith(valuesValue)));
        } else if (key === "NBW") {
            // Log.trace("dTQ[values] " + JSON.stringify(datasetToQuery[values]));
            // Log.trace("values " + JSON.stringify(values));
            results = datasetToQuery.filter((dTQ: any) => (!dTQ[valuesKey].startsWith(valuesValue)));
        } else if (key === "EW") {
            // Log.trace("dTQ[values] " + JSON.stringify(datasetToQuery[values]));
            // Log.trace("values " + JSON.stringify(values));
            results = datasetToQuery.filter((dTQ: any) => (dTQ[valuesKey].endsWith(valuesValue)));
        } else if (key === "NEW") {
            // Log.trace("dTQ[values] " + JSON.stringify(datasetToQuery[values]));
            // Log.trace("values " + JSON.stringify(values));
            results = datasetToQuery.filter((dTQ: any) => (!dTQ[valuesKey].endsWith(valuesValue)));
        } else {
            Log.trace("Invalid Query 122");
            throw new Error("Invalid Query!");
        }

        // if (results.length < 20) {
        //     Log.trace("results " + JSON.stringify(results));
        // }
        return results;
    }

    private applyDisplay(displayArr: any, dataFiltered: any) {

        // Log.trace("displayArr " + displayArr);
        const results: any = [];

        for (const section of dataFiltered) {
            const column: any = {};
            for (const skey in section) {
                if (displayArr.indexOf(skey) >= 0) {
                    column[skey] = section[skey];
                }
            }
            results.push(column);
        }
        return results;
    }

    private applyOrder(orderKeys: any, datasetToDisplay: any) {
        // Log.trace("applyOrder");
        orderKeys = orderKeys.reverse();
        const numKeys = ["avg", "pass", "fail", "audit", "lat", "lon", "seats"];
        for (const okey of orderKeys) {
            let okeySplit: any;
            let isAgrrKey: boolean = false;
            if (okey.includes("_")) {
                okeySplit = okey.split("_")[1];
            } else {
                isAgrrKey = true;
            }
            // Log.trace("okeySplit " + JSON.stringify(okeySplit));
            if ((numKeys.indexOf(okeySplit) > -1) && isAgrrKey) {
                // Log.trace("numSort");
                datasetToDisplay.sort(function (a: any, b: any) {
                    return a[okey] - b[okey];
                });
                // if (datasetToDisplay.length < 10) {
                //     Log.trace("numSort datasetToDisplay " + JSON.stringify(datasetToDisplay));
                // }
            } else {
                // Log.trace("aplhaSort");
                datasetToDisplay.sort(function (a: any, b: any) {
                    if (a[okey] < b[okey]) {return -1; }
                    if (a[okey] > b[okey]) {return 1; }
                    return 0;
                });
            //     if (datasetToDisplay.length < 10) {
            //         Log.trace("aplhaSort datasetToDisplay " + JSON.stringify(datasetToDisplay));
            //     }
            }
        }
        return datasetToDisplay;
    }

    private applyGroup(groupArr: any, dataFiltered: any, DATASET: any) {
        const applyGrpRslts: any = {};
        // if ((DATASET !== "courses") && (DATASET !== "rooms")) {
        //     Log.trace("groupArr " + JSON.stringify(groupArr));
        //     }
        for (const section of dataFiltered) {
            const keyArray: any = [];
            for (const grpkey of groupArr) {
                keyArray.push(grpkey + " " + section[grpkey]);
                // if ((DATASET !== "courses") && (DATASET !== "rooms")) {
                // Log.trace("grpkey " + grpkey);
                // }
            }
            const key = keyArray.join(";");
            // if ((DATASET !== "courses") && (DATASET !== "rooms")) {
            //     Log.trace("key " + key);
            //     }
            if (applyGrpRslts[key]) {
                applyGrpRslts[key].push(section);
                // if ((DATASET !== "courses") && (DATASET !== "rooms")) {
                // Log.trace("applyGrpRslts " + JSON.stringify(applyGrpRslts));
                // }
            } else {
                applyGrpRslts[key] = [section];
                // if ((DATASET !== "courses") && (DATASET !== "rooms")) {
                // Log.trace("applyGrpRslts " + JSON.stringify(applyGrpRslts));
                // }
            }
        }
        // Log.trace("applyGroup results " + JSON.stringify(results));
        return applyGrpRslts;
    }

    private applyGrpDisplay(displayArr: any, dataGroup: any, DATASET: any) {
        // if ((DATASET !== "courses") && (DATASET !== "rooms")) {
        //     Log.trace("displayArr " + displayArr);
        //     Log.trace("group " + JSON.stringify(dataGroup));
        //     Log.trace("DATASET " + DATASET);
        // }
        const applyGrpDsplyRslts: any = [];

        for (const group in dataGroup) {
            // if ((DATASET !== "courses") && (DATASET !== "rooms")) {
            // Log.trace("group " + JSON.stringify(group));
            // }
            const grpKey = group.split(";");
            const column: any = {};
            for (const gkey of grpKey) {
                // if ((DATASET !== "courses") && (DATASET !== "rooms")) {
                //     Log.trace("dkey " + gkey);
                //     }
                for (const dkey of displayArr) {
                    // if ((DATASET !== "courses") && (DATASET !== "rooms")) {
                    //     Log.trace("dkey " + dkey);
                    //     Log.trace("dkey " + dkey);
                    //     }
                    if (gkey.includes(dkey)) {
                        if (dkey.includes("_")) {
                            column[dkey] = gkey.split(dkey)[1].trim();
                        } else {
                            column[dkey] = Number (gkey.split(dkey)[1].trim());
                        }
                    }
                    // if ((DATASET !== "courses") && (DATASET !== "rooms")) {
                    //     Log.trace("column " + JSON.stringify(column));
                    //     }
                }
            }
            applyGrpDsplyRslts.push(column);
        }
        // if ((DATASET !== "courses") && (DATASET !== "rooms")) {
        //     Log.trace("applyGrpDsplyRslts " + JSON.stringify(applyGrpDsplyRslts));
        //     }
        return applyGrpDsplyRslts;
    }

    private applyAgg(applyArr: any, dataGroup: any, DATASET: any) {
        const aggResults: any = {};
        for (const group in dataGroup) {
            // const column: any = {};
            let newGroup = group;
            // if ((DATASET !== "courses") && (DATASET !== "rooms")) {
            //     Log.trace("group " + JSON.stringify(group));
                // Log.trace("newGroup " + JSON.stringify(newGroup));
                // Log.trace("dataGroup[data] " + JSON.stringify(dataGroup[data]));
                // Log.trace("Object.keys(data) " + JSON.stringify(Object.keys(data)));
                // Log.trace("Object.values(data) " + JSON.stringify(Object.values(data)));
                // }
            // for (const d of data) {
            //     if ((DATASET !== "courses") && (DATASET !== "rooms")) {
            //         Log.trace("d " + JSON.stringify(d));
            //         Log.trace("Object.keys(d) " + JSON.stringify(Object.keys(d)));
            //         Log.trace("Object.values(d) " + JSON.stringify(Object.values(d)));
            //         }
            // }
            for (const agg of applyArr) {
                // if ((DATASET !== "courses") && (DATASET !== "rooms")) {
                //     Log.trace("agg " + JSON.stringify(agg));
                //     }
                const aggKey: any = Object.keys(agg)[0];
                const aggVal: any = Object.values(agg)[0];
                const token: any = Object.keys(aggVal)[0];
                const key: any = Object.values(aggVal)[0];
                let value: any;
                // if ((DATASET !== "courses") && (DATASET !== "rooms")) {
                //     Log.trace("aggKey " + aggKey);
                //     Log.trace("aggVal " + JSON.stringify(aggVal));
                //     Log.trace("token " + token);
                //     Log.trace("key " + key);
                //     Log.trace("dataGroup[group] " + JSON.stringify(dataGroup[group]));
                //     }

                switch (token) {
                    case "MAX":
                        value = this.applyMax(key, dataGroup[group]);
                        break;
                    case "MIN":
                        value = this.applyMin(key, dataGroup[group]);
                        break;
                    case "AVG":
                        value = this.applyAVG(key, dataGroup[group], DATASET);
                        break;
                    case "SUM":
                        value = this.applySUM(key, dataGroup[group]);
                        break;
                    case "COUNT":
                        value = this.applyCOUNT(key, dataGroup[group], DATASET);
                        break;
                }
                // if ((DATASET !== "courses") && (DATASET !== "rooms")) {
                //     Log.trace("value " + value);
                // }
                newGroup += ";" + aggKey + " " + value;
                // if ((DATASET !== "courses") && (DATASET !== "rooms")) {
                //     Log.trace("newGroup " + newGroup);
                // }
            }
            // column[newGroup] = " ";
            // if ((DATASET !== "courses") && (DATASET !== "rooms")) {
            //     Log.trace("column " + JSON.stringify(column));
            // }
            aggResults[newGroup] = " ";
            // if ((DATASET !== "courses") && (DATASET !== "rooms")) {
            //     Log.trace("aggResults " + JSON.stringify(aggResults));
            // }
        }
        // if ((DATASET !== "courses") && (DATASET !== "rooms")) {
        //     Log.trace("aggResults " + JSON.stringify(aggResults));
        // }
        return aggResults;
    }

    private applyMax(key: any, data: any) {
        let max = Number.MIN_SAFE_INTEGER;
        for (const section of data) {
            const value = section[key];
            // if (typeof value !== "number") {
            //     throw new InsightError("MAX can only be applied to a numeric");
            // }
            if (value > max) {
                max = value;
            }
        }
        return max;
    }

    private applyMin(key: any, data: any) {
        let min = Number.MAX_SAFE_INTEGER;
        for (const section of data) {
            const value = section[key];
            // if (typeof value !== "number") {
            //     throw new InsightError("MAX can only be applied to a numeric");
            // }
            if (value < min) {
                min = value;
            }
        }
        return min;
    }

    private applyAVG(key: any, data: any, DATASET: any) {
        let total = new Decimal(0);
        for (const section of data) {
            const value = section[key];
            // if (typeof value !== "number") {
            //     throw new InsightError("MAX can only be applied to a numeric");
            // }
            total = Decimal.add(total, value);
        }
        let avg = total.toNumber() / data.length;
        // if ((DATASET !== "courses") && (DATASET !== "rooms")) {
        //     Log.trace("total " + total);
        //     Log.trace("data.length " + data.length);
        //     Log.trace("avg " + avg);
        //     }
        avg = Number(avg.toFixed(2));
        return avg;
    }

    private applySUM(key: any, data: any) {
        let total = new Decimal(0);
        for (const section of data) {
            const value = section[key];
            // if (typeof value !== "number") {
            //     throw new InsightError("MAX can only be applied to a numeric");
            // }
            total = Decimal.add(total, value);
        }
        const sum = Number(total.toFixed(2));
        return sum;
    }

    private applyCOUNT(key: any, data: any, DATASET: any) {
        let count = 0;
        const temp: any = [];
        for (const section of data) {
            const value = section[key];
            // if ((DATASET !== "courses") && (DATASET !== "rooms")) {
            //     Log.trace("section " + JSON.stringify(section));
            //     Log.trace("value " + value);
            // }
            // if (typeof value !== "number") {
            //     throw new InsightError("MAX can only be applied to a numeric");
            // }
            if (!temp.includes(value)) {
                temp.push(value);
                // if ((DATASET !== "courses") && (DATASET !== "rooms")) {
                //     Log.trace("temp " + JSON.stringify(temp));
                // }
                count ++;
            }
        }
        return count;
    }

}
