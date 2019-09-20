import Log from "../Util";
import DatasetController from "../controller/DatasetController";

export default class QueryConverter {

    private static datasetController= new DatasetController();

    protected mKeyArray: { [key: string]: any } =
    {Average: {label: "avg"}, Pass: {label: "pass"},
     Fail: {label: "fail"}, Audit: {label: "audit"}};

    protected sKeyArray: { [key: string]: any } =
    {Department: {label: "dept"}, ID: {label: "id"},
    Instructor: {label: "instructor"}, Title: {label: "title"}, UUID: {label: "uuid"}};

    protected mOpArrary: { [key: string]: any } =
    {"is greater than ": {operator: "GT"}, "is not greater than ": {operator: "NGT"},
    "is less than ": {operator: "LT"}, "is not less than ": {operator: "NLT"},
    "is equal to ": {operator: "EQ"}, "is not equal to ": {operator: "NEQ"}};

    protected sOpArray: { [key: string]: any } = {"is ": {operator: "IS"}, "is not ": {operator: "ISN"},
    "includes ": {operator: "INC"}, "does not include ": {operator: "DNI"},
    "begins with ": {operator: "BW"}, "does not begin with ": {operator: "NBW"},
    "ends with ": {operator: "EW"}, "does not end with ": {operator: "NEW"}};

    // protected ConvertedQuery: IConvertedQuery;

    // constructor(query: string) {

    //     this.convertQuery(query);
    // }

    public convertQuery(query: string) {

        const reserved = ["In", "dataset", "find", "all", "show", "and", "or", "sort", "by",
        "entries", "is", "the", "of", "whose", "includes", "begins", "ends", "_"];

        const queryFirstComma = query.indexOf(",");
        const queryDataset = query.slice(0, queryFirstComma);
        const queryExDataset = query.slice(queryFirstComma);
        const queryFirstSemi = queryExDataset.indexOf(";");
        const queryFilter = queryExDataset.slice(2, queryFirstSemi);
        const queryLastChar = query.slice(-1);
        const orderAscPreFix = "sort in ascending order by ";
        const orderAscPreFixPos = queryExDataset.indexOf(orderAscPreFix);
        const orderDscPreFix = "sort in descending order by ";
        const orderDscPreFixPos = queryExDataset.indexOf(orderDscPreFix);
        let queryDisplay: string  = "";
        let orderAscKeyArr: any[] = [];
        let orderDscKeyArr: any[] = [];
        const oKeyArr: { [key: string]: any } = {};
        const oKeyArrkeys = [];

        if (queryLastChar !== ".") {
            throw new Error("Query ID!");
        }

        if (orderAscPreFixPos >= 0) {
            queryDisplay = queryExDataset.slice(queryFirstSemi + 2, orderAscPreFixPos - 2);
            orderAscKeyArr = queryExDataset.slice(orderAscPreFixPos + orderAscPreFix.length, queryExDataset.length - 1)
            .split(/ and |, /).map((e: { trim: () => void; }) => e.trim() );
        } else if (orderDscPreFixPos >= 0) {
            queryDisplay = queryExDataset.slice(queryFirstSemi + 2, orderDscPreFixPos - 2);
            orderDscKeyArr = queryExDataset.slice(orderDscPreFixPos + orderDscPreFix.length, queryExDataset.length - 1)
            .split(/ and |, /).map((e: { trim: () => void; }) => e.trim() );
        } else {
            queryDisplay = queryExDataset.slice(queryFirstSemi + 2);
        }

        const queryDatasetCoursesPrefix = "In courses dataset ";
        const qCoursesID = queryDataset.slice(queryDatasetCoursesPrefix.length);
        const dataController = QueryConverter.datasetController;

        if (queryDataset.slice(0, queryDatasetCoursesPrefix.length) !== queryDatasetCoursesPrefix) {
            // Log.trace("queryDatasetCoursesPrefix invalid "
            // + queryDataset.slice(0, queryDatasetCoursesPrefix.length));
            throw new Error("Invalid queryDatasetCoursesPrefix!");
        }

        if (!dataController.isValidId(qCoursesID) ||
        !dataController.datasetExists(qCoursesID)) {
            // Log.trace("qCoursesID invalid " + qCoursesID);
            throw new Error("Invalid ID!");
        }

        if (orderAscKeyArr.length > 0) {
            // Log.trace("orderAscKeyArr " + orderAscKeyArr);
            oKeyArr.dir = "ASC";
            for (const ascKey of orderAscKeyArr) {
                // Log.trace("ascKey " + ascKey.trim());
                if (this.mKeyArray.hasOwnProperty(ascKey.trim())) {
                    const ascKeyLabel = qCoursesID + "_" + this.mKeyArray[ascKey].label;
                    // Log.trace("ascKeyLabel " + ascKeyLabel);
                    oKeyArrkeys.push(ascKeyLabel);
                } else if (this.sKeyArray.hasOwnProperty(ascKey.trim())) {
                    const ascKeyLabel = qCoursesID + "_" + this.sKeyArray[ascKey].label;
                    // Log.trace("ascKeyLabel " + ascKeyLabel);
                    oKeyArrkeys.push(ascKeyLabel);
                } else {
                    throw new Error("Invalid Order Key!");
                }
            }
            oKeyArr.keys = oKeyArrkeys;
        }
        if (orderDscKeyArr.length > 0) {
            // Log.trace("orderDscKeyArr " + orderDscKeyArr);
            oKeyArr.dir = "DESC";
            for (const dscKey of orderDscKeyArr) {
                // Log.trace("dscKey " + dscKey.trim());
                if (this.mKeyArray.hasOwnProperty(dscKey.trim())) {
                    const dscKeyLabel = qCoursesID + "_" + this.mKeyArray[dscKey].label;
                    // Log.trace("dscKeyLabel " + dscKeyLabel);
                    oKeyArrkeys.push(dscKeyLabel);
                } else if (this.sKeyArray.hasOwnProperty(dscKey.trim())) {
                    const dscKeyLabel = qCoursesID + "_" + this.sKeyArray[dscKey].label;
                    // Log.trace("dscKeyLabel " + dscKeyLabel);
                    oKeyArrkeys.push(dscKeyLabel);
                } else {
                    throw new Error("Invalid Order Key!");
                }
            }
            oKeyArr.keys = oKeyArrkeys;
        }

        // Log.trace("isValidQuery " + query);
        // Log.trace("queryDataset " + queryDataset);
        // Log.trace("qCoursesID " + qCoursesID);
        // Log.trace("queryFilter " + queryFilter);
        // Log.trace("queryDisplay " + queryDisplay);
        // Log.trace("orderAscKeyArr " + orderAscKeyArr);
        // Log.trace("orderDscKeyArr " + orderDscKeyArr);

        const DATASET = qCoursesID;
        const FILTER = this.parseFilter(queryFilter, qCoursesID);
        const DISPLAY = this.parseDisplay(queryDisplay, qCoursesID);
        const ORDER: any = oKeyArr;

        // Log.trace("FILTER " + JSON.stringify(FILTER));
        // Log.trace("DISPLAY " + DISPLAY);
        // Log.trace("ORDER " + JSON.stringify(ORDER));

        // this.ConvertedQuery = {FILTER, DISPLAY, ORDER};
        // Log.trace("ConvertedQuery " + JSON.stringify(this.ConvertedQuery));
        return {DATASET, FILTER, DISPLAY, ORDER};

    }

    public parseFilter(queryFilter: string, qCoursesID: string) {

        let filter = {};
        const queryFilterAllPrefix = "find all entries";
        const queryFilterCritireaPrefix = "find entries whose ";
        let queryFilterCritirea: string  = "";
        let filterCritirea: any = [];
        let filterLogic: any[] = [];

        if (queryFilter === queryFilterAllPrefix) {
            return filter;
        } else if (queryFilter.slice(0, queryFilterCritireaPrefix.length) === queryFilterCritireaPrefix) {
            queryFilterCritirea = queryFilter.slice(queryFilterCritireaPrefix.length);
            try {
                filterCritirea = queryFilterCritirea.split(/ and | or /).map((e: { trim: () => void; }) => e.trim() );
                filterLogic =
                (queryFilterCritirea.match(/ and | or /g) || []).map((e: { trim: () => void; }) => e.trim());
            } catch (err) {
                throw new Error("Invalid Query!");
            }
        } else {
            throw new Error("Invalid Query!");
        }

        // Log.trace("filterCritirea " + filterCritirea);
        // Log.trace("filterLogic " + filterLogic);

        filter = this.parseFilters(filterCritirea, filterLogic, qCoursesID);

        // Log.trace("filter " + JSON.stringify(filter));

        return filter;

    }

    public parseDisplay(queryDisplay: string, qCoursesID: string) {
        queryDisplay = queryDisplay.toString();
        if (queryDisplay[queryDisplay.length - 1] === ".") {
            queryDisplay = queryDisplay.slice(0, -1);
        }
        const displayKey = queryDisplay.split("show")[1].split(/,| and /).map((e) =>
         e.trim()).filter((e) => e !== "");
        // Log.trace("displayKey " + displayKey);
        let dKey: string = "";
        const dKeyArr: any[] = [];
        for (dKey of displayKey) {
            if (this.mKeyArray.hasOwnProperty(dKey)) {
                const dKeyLabel = qCoursesID + "_" + this.mKeyArray[dKey].label;
                // Log.trace("dKeyLabel " + dKeyLabel);
                dKeyArr.push(dKeyLabel);
            } else if (this.sKeyArray.hasOwnProperty(dKey)) {
                const dKeyLabel = qCoursesID + "_" + this.sKeyArray[dKey].label;
                dKeyArr.push(dKeyLabel);
                // Log.trace("dKeyLabel " + dKeyLabel);
            } else {
                throw new Error("Invalid Display Key!");
            }
        }
        return dKeyArr;
    }

    private parseFilters(filterCritirea: any, logicComparators: any[], qCoursesID: string) {
        const filter: { [key: string]: any[] } = {};
        // Log.trace("logicComparators " + logicComparators);
        // Log.trace("logicComparators.length " + logicComparators.length);
        if (logicComparators.length === 0) {
            // Log.trace("filterCritirea[0] " + filterCritirea[0]);
            return this.parseCritirea(filterCritirea[0], qCoursesID);
        } else {
            // Log.trace("logicComparatorsTransform "
            // + logicComparators.slice(-1).toString().toUpperCase());
            // Log.trace("filterCritirea.slice(0, -1) " + filterCritirea.slice(0, -1));
            // Log.trace("logicComparators.slice(0, -1) " + logicComparators.slice(0, -1));

            const parseFiltersRe = this.parseFilters(filterCritirea.slice(0, -1),
            logicComparators.slice(0, -1), qCoursesID);
            // Log.trace("parseFiltersRe " + JSON.stringify(parseFiltersRe));

            // Log.trace("filterCritirea.slice(-1) " + filterCritirea.slice(-1));
            const parseCritireaObj = this.parseCritirea(filterCritirea.slice(-1).toString(), qCoursesID);
            // Log.trace("parseCritireaObj " + JSON.stringify(parseCritireaObj));

            filter[logicComparators.slice(-1).toString().toUpperCase()] = [parseFiltersRe, parseCritireaObj];

            // Log.trace("parseFilters filter" + JSON.stringify(filter));
        }
        return filter;
    }

    private parseCritirea(filterCritirea: any, qCoursesID: string) {
        const filter: { [key: string]: any } = {};
        const msKey = filterCritirea.split(" ")[0];
        // Log.trace("msKey " + msKey);
        // Log.trace("mKeyArray.hasOwnProperty(msKey) " + this.mKeyArray.hasOwnProperty(msKey));
        // Log.trace("sKeyArray.hasOwnProperty(msKey) " + this.sKeyArray.hasOwnProperty(msKey));
        if (this.mKeyArray.hasOwnProperty(msKey)) {
            const mNum = filterCritirea.split(" ").splice(-1);
            // Log.trace("mNum " + mNum);
            const mOpEnd = filterCritirea.length - mNum.toString().length;
            const mOp = filterCritirea.substring(msKey.length + 1, mOpEnd);
            // Log.trace("mOp " + mOp);
            const mOpIndex = this.mOpArrary.hasOwnProperty(mOp);
            // Log.trace("mOpIndex " + mOpIndex);
            if (!isNaN(mNum) && mOpIndex) {
                filter[(this.mOpArrary[mOp].operator)] = {};
                const mKey = qCoursesID + "_" + this.mKeyArray[msKey].label;
                filter[(this.mOpArrary[mOp].operator)][mKey] = Number(mNum);
                // Log.trace("parseCritirea filter " + JSON.stringify(filter));
                return filter;
            } else {
                throw new Error("Invalid Critirea!");
            }
        } else if (this.sKeyArray.hasOwnProperty(msKey)) {
            // const sStrObj = filterCritirea.split(" ").splice(-1);
            // const sStr = sStrObj.toString();
            const sStr = filterCritirea.substring(
                filterCritirea.indexOf("\""),
                filterCritirea.lastIndexOf("\"") + 1);
            // Log.trace("filterCritirea " + filterCritirea);
            // Log.trace("sStr " + sStr);
            const sStrTrim = sStr.slice(1, -1);
            const isValidString = ((sStr.charAt(0) === "\"") && (sStr.slice(-1) === "\"")
            && (sStrTrim.indexOf("*") < 0)  && (sStrTrim.indexOf("\"") < 0));
            // Log.trace("sStr !== \"\" " + (sStrTrim !== ""));
            // Log.trace("sStr !== NULL " + (sStrTrim !== null));
            // Log.trace("sStr.length " + sStrTrim.length + (sStrTrim.length > 0));
            // Log.trace("isValidString " + isValidString);
            const sOpEnd = filterCritirea.length - sStr.length;
            const sOp = filterCritirea.substring(msKey.length + 1, sOpEnd);
            // Log.trace("sOp " + sOp);
            const sOpIndex = this.sOpArray.hasOwnProperty(sOp);
            // Log.trace("sOpIndex " + sOpIndex);
            if (isValidString && sOpIndex) {
                filter[(this.sOpArray[sOp].operator)] = {};
                const sKey = qCoursesID + "_" + this.sKeyArray[msKey].label;
                filter[(this.sOpArray[sOp].operator)][sKey] = sStrTrim;
                // Log.trace("parseCritirea filter " + JSON.stringify(filter));
                return filter;
            } else {
                throw new Error("Invalid Critirea!");
            }
        } else {
            throw new Error("Invalid Critirea!");
        }
    }
}
