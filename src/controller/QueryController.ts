import DatasetController from "../controller/DatasetController";
import Log from "../Util";
import fs = require("fs");

export interface IConvertedQuery {

    DATASET: string;
    FILTER: {};
    DISPLAY: string|string[];
    ORDER?: any;
}

export default class QueryController {

    private static datasetController= new DatasetController();
    private convertedQuery: IConvertedQuery;

    public query(convertedQuery: IConvertedQuery) {

        const dataController = QueryController.datasetController;
        const datasetToQuery = dataController.getDataset(convertedQuery.DATASET);
        // if (convertedQuery.DATASET !== "courses") {
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

        const displayArr = convertedQuery.DISPLAY;
        // Log.trace("dataFiltered.length " + dataFiltered.length);
        if (dataFiltered.length > 0) {
            let datasetToDisplay = this.applyDisplay(displayArr, dataFiltered);

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

            return datasetToDisplay;
        } else {
            return dataFiltered;
        }
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
        const numKeys = ["avg", "pass", "fail", "audit"];
        for (const okey of orderKeys) {
            const okeySplit = okey.split("_")[1];
            // Log.trace("okeySplit " + JSON.stringify(okeySplit));
            if (numKeys.indexOf(okeySplit) > -1) {
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
}
