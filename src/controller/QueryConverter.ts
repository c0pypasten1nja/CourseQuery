import Log from "../Util";
import DatasetController from "../controller/DatasetController";

export default class QueryConverter {

    private static datasetController= new DatasetController();

    protected mKeyArrayCourses: { [key: string]: any } =
    {Average: {label: "avg"}, Pass: {label: "pass"},
     Fail: {label: "fail"}, Audit: {label: "audit"},
     Year: {label: "year"}};

    protected mKeyArrayRooms: { [key: string]: any } =
    {Latitude: {label: "lat"}, Longitude: {label: "lon"},
    Seats: {label: "seats"}};

    protected sKeyArrayCourses: { [key: string]: any } =
    {Department: {label: "dept"}, ID: {label: "id"},
    Instructor: {label: "instructor"}, Title: {label: "title"}, UUID: {label: "uuid"}};

    protected sKeyArrayRooms: { [key: string]: any } =
    {"Full Name": {label: "fullname"}, "Short Name": {label: "shortname"},
    "Number": {label: "number"}, "Name": {label: "name"},
    "Address": {label: "address"}, "Type": {label: "type"},
    "Furniture": {label: "furniture"}, "Link": {label: "href"}};

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
        "entries", "is", "the", "of", "whose", "includes", "begins", "ends", "_", "where", "grouped"];

        const numericToken = ["MAX", "MIN", "AVG", "SUM"];

        const queryFilterPreFix = query.indexOf("find ") - 2;
        const queryDataset = query.slice(0, queryFilterPreFix);
        const queryExDataset = query.slice(queryFilterPreFix);
        const queryFirstSemi = queryExDataset.indexOf(";");
        const queryFilter = queryExDataset.slice(2, queryFirstSemi);
        const queryLastChar = query.slice(-1);
        const orderAscPreFix = "sort in ascending order by ";
        const orderAscPreFixPos = queryExDataset.indexOf(orderAscPreFix);
        const orderDscPreFix = "sort in descending order by ";
        const orderDscPreFixPos = queryExDataset.indexOf(orderDscPreFix);
        let queryDisplay: string  = "";
        let qDsplyGrp: string  = "";
        let orderAscKeyArr: any[] = [];
        let orderDscKeyArr: any[] = [];
        const oKeyArr: { [key: string]: any } = {};
        const oKeyArrkeys = [];

        if (queryLastChar !== ".") {
            throw new Error("Query ID!");
        }

        const qCoursesPrefix = "In courses dataset ";
        const qCoursesPrfxlnqth = qCoursesPrefix.length;
        let qCoursesID = "";
        const qRoomsPrefix = "In rooms dataset ";
        const qRoomsPrfxlnqth = qRoomsPrefix.length;
        let qRoomsID = "";
        const dataController = QueryConverter.datasetController;
        const groupedPrfx = " grouped by ";
        const grpPrFxLngth = groupedPrfx.length;
        let grpdKys: any[] = [];
        const grpdKysArr: any[] = [];
        const aggrgtnPrFx = ", where ";

        if (queryDataset.slice(0, qCoursesPrfxlnqth) === qCoursesPrefix &&
        (queryDataset.slice(qCoursesPrfxlnqth).indexOf(groupedPrfx) < 0)) {
            qCoursesID = queryDataset.slice(qCoursesPrfxlnqth);
        } else if (queryDataset.slice(0, qRoomsPrfxlnqth) === qRoomsPrefix &&
        (queryDataset.slice(qRoomsPrfxlnqth).indexOf(groupedPrfx) < 0)) {
            qRoomsID = queryDataset.slice(qRoomsPrfxlnqth);
        } else if (queryDataset.slice(0, qCoursesPrfxlnqth) === qCoursesPrefix &&
        (queryDataset.slice(qCoursesPrfxlnqth).indexOf(groupedPrfx) >= 0)) {
            const qGrp = queryDataset.slice(qCoursesPrfxlnqth);
            // Log.trace("qCoursesID qGrp " + qGrp);
            qCoursesID = qGrp.split(" ")[0];
            grpdKys = qGrp.slice(qCoursesID.length + grpPrFxLngth)
            .split(/ and |, /).map((e: { trim: () => void; }) => e.trim() );
            // Log.trace("grpdKys qGrp " + JSON.stringify(grpdKys));
        } else if (queryDataset.slice(0, qRoomsPrfxlnqth) === qRoomsPrefix &&
        (queryDataset.slice(qRoomsPrfxlnqth).indexOf(groupedPrfx) >= 0)) {
            const qGrp = queryDataset.slice(qRoomsPrfxlnqth);
            // Log.trace("qRoomsID qGrp " + qGrp);
            qRoomsID = qGrp.split(" ")[0];
            grpdKys = qGrp.slice(qRoomsID.length + grpPrFxLngth)
            .split(/ and |, /).map((e: { trim: () => void; }) => e.trim() );
            // Log.trace("grpdKys qGrp " + JSON.stringify(grpdKys));
        } else {
            Log.trace("qCoursesPrefix invalid "
            + queryDataset.slice(0, qCoursesPrfxlnqth));
            Log.trace("qRoomsPrefix invalid "
            + queryDataset.slice(0, qRoomsPrfxlnqth));
            throw new Error("Invalid qCoursesPrefix!");
        }

        if (qCoursesID.length > 0 ) {
            if (!dataController.isValidId(qCoursesID) ||
        !dataController.datasetExists(qCoursesID) ) {
            Log.trace("qCoursesID invalid " + qCoursesID);
            throw new Error("Invalid ID!");
            }
        }

        if (qRoomsID.length > 0 ) {
            if (!dataController.isValidId(qRoomsID) ||
        !dataController.datasetExists(qRoomsID) ) {
            Log.trace("qRoomsID invalid " + qRoomsID);
            throw new Error("Invalid ID!");
            }
        }

        let aggDffArr: any[] = [];

        if ((orderAscPreFixPos >= 0) && (grpdKys.length < 1) && (queryExDataset.indexOf(aggrgtnPrFx) < 0)) {
            queryDisplay = queryExDataset.slice(queryFirstSemi + 2, orderAscPreFixPos - 2);
            // Log.trace("queryDisplay 135 " + queryDisplay);
            orderAscKeyArr = queryExDataset.slice(orderAscPreFixPos + orderAscPreFix.length, queryExDataset.length - 1)
            .split(/ and |, /).map((e: { trim: () => void; }) => e.trim() );
        } else if ((orderAscPreFixPos >= 0) && (grpdKys.length < 1) && (queryExDataset.indexOf(aggrgtnPrFx) > -1)) {
            queryDisplay = queryExDataset.slice(queryFirstSemi + 2, queryExDataset.indexOf(aggrgtnPrFx));
            // Log.trace("queryDisplay 140 " + queryDisplay);
            orderAscKeyArr = queryExDataset.slice(orderAscPreFixPos + orderAscPreFix.length, queryExDataset.length - 1)
            .split(/ and |, /).map((e: { trim: () => void; }) => e.trim() );
        } else if ((orderAscPreFixPos >= 0) && (grpdKys.length > 0) && (queryExDataset.indexOf(aggrgtnPrFx) > -1)) {
            qDsplyGrp = queryExDataset.slice(queryFirstSemi + 2, orderAscPreFixPos - 2);
            // Log.trace("qDsplyGrp " + qDsplyGrp);
            // Log.trace("qDsplyGrp.slice(qDsplyGrp.indexOf(aggrgtnPrFx)) " +
            // qDsplyGrp.slice(qDsplyGrp.indexOf(aggrgtnPrFx) + aggrgtnPrFx.length));
            aggDffArr = qDsplyGrp.slice(qDsplyGrp.indexOf(aggrgtnPrFx) + aggrgtnPrFx.length)
            .split(/ and |, /).map((e: { trim: () => void; }) => e.trim() );
            // Log.trace("aggDffArr " + JSON.stringify(aggDffArr));
            // Log.trace("qDsplyGrp.slice(0, qDsplyGrp.indexOf(aggrgtnPrFx)) "
            // + qDsplyGrp.slice(0, qDsplyGrp.indexOf(aggrgtnPrFx)));
            queryDisplay = qDsplyGrp.slice(0, qDsplyGrp.indexOf(aggrgtnPrFx));
            // Log.trace("queryDisplay 154 " + queryDisplay);
            orderAscKeyArr = queryExDataset.slice(orderAscPreFixPos + orderAscPreFix.length, queryExDataset.length - 1)
            .split(/ and |, /).map((e: { trim: () => void; }) => e.trim() );
        }  else if ((orderAscPreFixPos >= 0) && (grpdKys.length > 0) && (queryExDataset.indexOf(aggrgtnPrFx) < 0)) {
            queryDisplay = queryExDataset.slice(queryFirstSemi + 2, orderAscPreFixPos - 2);
            // Log.trace("queryDisplay 159 " + queryDisplay);
            orderAscKeyArr = queryExDataset.slice(orderAscPreFixPos + orderAscPreFix.length, queryExDataset.length - 1)
            .split(/ and |, /).map((e: { trim: () => void; }) => e.trim() );
        } else if (orderDscPreFixPos >= 0 && (grpdKys.length < 1)) {
            queryDisplay = queryExDataset.slice(queryFirstSemi + 2, orderDscPreFixPos - 2);
            // Log.trace("queryDisplay 163 " + queryDisplay);
            orderDscKeyArr = queryExDataset.slice(orderDscPreFixPos + orderDscPreFix.length, queryExDataset.length - 1)
            .split(/ and |, /).map((e: { trim: () => void; }) => e.trim() );
        }  else if (orderDscPreFixPos >= 0 && (grpdKys.length > 0) && (queryExDataset.indexOf(aggrgtnPrFx) > -1)) {
            qDsplyGrp = queryExDataset.slice(queryFirstSemi + 2, orderDscPreFixPos - 2);
            // Log.trace("qDsplyGrp " + qDsplyGrp);
            // Log.trace("qDsplyGrp.slice(qDsplyGrp.indexOf(aggrgtnPrFx)) " +
            // qDsplyGrp.slice(qDsplyGrp.indexOf(aggrgtnPrFx) + aggrgtnPrFx.length));
            aggDffArr = qDsplyGrp.slice(qDsplyGrp.indexOf(aggrgtnPrFx) + aggrgtnPrFx.length)
            .split(/ and |, /).map((e: { trim: () => void; }) => e.trim() );
            // Log.trace("aggDffArr " + JSON.stringify(aggDffArr));
            // Log.trace("qDsplyGrp.slice(0, qDsplyGrp.indexOf(aggrgtnPrFx))) "
            // + qDsplyGrp.slice(0, qDsplyGrp.indexOf(aggrgtnPrFx)));
            queryDisplay = qDsplyGrp.slice(0, qDsplyGrp.indexOf(aggrgtnPrFx));
            // Log.trace("queryDisplay 178 " + queryDisplay);
            orderDscKeyArr = queryExDataset.slice(orderDscPreFixPos + orderDscPreFix.length, queryExDataset.length - 1)
            .split(/ and |, /).map((e: { trim: () => void; }) => e.trim() );
        }   else if ((orderDscPreFixPos >= 0) && (grpdKys.length > 0) && (queryExDataset.indexOf(aggrgtnPrFx) < 0)) {
            queryDisplay = queryExDataset.slice(queryFirstSemi + 2, orderDscPreFixPos - 2);
            // Log.trace("queryDisplay 183 " + queryDisplay);
            orderDscKeyArr = queryExDataset.slice(orderDscPreFixPos + orderDscPreFix.length, queryExDataset.length - 1)
            .split(/ and |, /).map((e: { trim: () => void; }) => e.trim() );
        } else if ((orderAscPreFixPos < 0) && (orderDscPreFixPos < 0) && (queryExDataset.indexOf(aggrgtnPrFx) > -1)) {
            queryDisplay = queryExDataset.slice(queryFirstSemi + 2, queryExDataset.indexOf(aggrgtnPrFx));
            // Log.trace("queryDisplay 188 " + queryDisplay);
            // Log.trace("queryExDataset.indexOf(aggrgtnPrFx) 189 " + queryExDataset.indexOf(aggrgtnPrFx));
            aggDffArr = queryExDataset.slice(queryExDataset.indexOf(aggrgtnPrFx) + aggrgtnPrFx.length,
            queryExDataset.length - 1)
            .split(/ and |, /).map((e: { trim: () => void; }) => e.trim() );
            Log.trace("aggDffArr 192 " + aggDffArr);
        } else {
            queryDisplay = queryExDataset.slice(queryFirstSemi + 2);
            // Log.trace("queryDisplay 192 " + queryDisplay);
            // Log.trace("queryExDataset.indexOf(aggrgtnPrFx) 193 " + queryExDataset.indexOf(aggrgtnPrFx));
        }

        if (grpdKys.length > 0) {
            for (const grpdKy of grpdKys) {
                // Log.trace("grpdKy " + grpdKy);
                if (this.mKeyArrayCourses.hasOwnProperty(grpdKy.trim()) && (qCoursesID !== "")) {
                    const grpdKyLabel = qCoursesID + "_" + this.mKeyArrayCourses[grpdKy].label;
                    // Log.trace("grpdKyLabel " + grpdKyLabel);
                    grpdKysArr.push(grpdKyLabel);
                } else if (this.sKeyArrayCourses.hasOwnProperty(grpdKy.trim()) && (qCoursesID !== "")) {
                    const grpdKyLabel = qCoursesID + "_" + this.sKeyArrayCourses[grpdKy].label;
                    // Log.trace("grpdKyLabel " + grpdKyLabel);
                    grpdKysArr.push(grpdKyLabel);
                } else if (this.mKeyArrayRooms.hasOwnProperty(grpdKy.trim()) && (qRoomsID !== "")) {
                    const grpdKyLabel = qRoomsID + "_" + this.mKeyArrayRooms[grpdKy].label;
                    // Log.trace("grpdKyLabel " + grpdKyLabel);
                    grpdKysArr.push(grpdKyLabel);
                } else if (this.sKeyArrayRooms.hasOwnProperty(grpdKy.trim()) && (qRoomsID !== "")) {
                    const grpdKyLabel = qRoomsID + "_" + this.sKeyArrayRooms[grpdKy].label;
                    // Log.trace("grpdKyLabel " + grpdKyLabel);
                    grpdKysArr.push(grpdKyLabel);
                } else {
                    throw new Error("Invalid Order Key!");
                }
            }
        }

        const applyArr: any[] = [];
        const aggKeyArr = [];
        const alreadySeen: any = [];

        if (aggDffArr.length > 0) {
            for (const aggDff of aggDffArr) {
                Log.trace("aggDff " + aggDff);
                const aggKey = aggDff.split(" is the ")[0].trim();
                if (reserved.indexOf(aggKey) >= 0) {
                    throw new Error("Invalid query string");
                }
                if (alreadySeen[aggKey]) {
                    Log.trace("alreadySeen[aggDff] " + JSON.stringify(alreadySeen));
                    throw new Error("Invalid query string");
                } else {
                    alreadySeen[aggKey] = true;
                }
                const aggToken = aggDff.split(" is the ")[1].split(" of ")[0].trim();
                const aggTarget = aggDff.split(" of ")[1].trim();
                const a: any = {};
                a[aggKey] = {};
                if (this.mKeyArrayCourses.hasOwnProperty(aggTarget) && (qCoursesID !== "")
                && ((numericToken.indexOf(aggToken) > -1 ) || (aggToken === "COUNT" ))) {
                    const aggTargetLabel = qCoursesID + "_" + this.mKeyArrayCourses[aggTarget].label;
                    // Log.trace("aggTargetLabel " + aggTargetLabel);
                    a[aggKey][aggToken] = aggTargetLabel;
                    aggKeyArr.push(aggKey);
                } else if (this.sKeyArrayCourses.hasOwnProperty(aggTarget) && (qCoursesID !== "")
                && (aggToken === "COUNT" )) {
                    const aggTargetLabel = qCoursesID + "_" + this.sKeyArrayCourses[aggTarget].label;
                    // Log.trace("aggTargetLabel " + aggTargetLabel);
                    a[aggKey][aggToken] = aggTargetLabel;
                    aggKeyArr.push(aggKey);
                } else if (this.mKeyArrayRooms.hasOwnProperty(aggTarget) && (qRoomsID !== "")
                && ((numericToken.indexOf(aggToken) > -1 ) || (aggToken === "COUNT" ))) {
                    const aggTargetLabel = qRoomsID + "_" + this.mKeyArrayRooms[aggTarget].label;
                    // Log.trace("aggTargetLabel " + aggTargetLabel);
                    a[aggKey][aggToken] = aggTargetLabel;
                    aggKeyArr.push(aggKey);
                } else if (this.sKeyArrayRooms.hasOwnProperty(aggTarget) && (qRoomsID !== "")
                && (aggToken === "COUNT" )) {
                    const aggTargetLabel = qRoomsID + "_" + this.sKeyArrayRooms[aggTarget].label;
                    // Log.trace("aggTargetLabel " + aggTargetLabel);
                    a[aggKey][aggToken] = aggTargetLabel;
                    aggKeyArr.push(aggKey);
                } else {
                    throw new Error("Invalid AGGREGATION Key!");
                }
                applyArr.push(a);
            }
            // Log.trace("applyArr " + JSON.stringify(applyArr));
            // Log.trace("aggKeyArr " + JSON.stringify(aggKeyArr));

        }

        if (orderAscKeyArr.length > 0) {
            // Log.trace("orderAscKeyArr.length " + orderAscKeyArr.length);
            // Log.trace("orderAscKeyArr " + orderAscKeyArr);
            oKeyArr.dir = "ASC";
            for (const ascKey of orderAscKeyArr) {
                // Log.trace("ascKey " + ascKey.trim());
                if (this.mKeyArrayCourses.hasOwnProperty(ascKey.trim()) && (qCoursesID !== "")) {
                    const ascKeyLabel = qCoursesID + "_" + this.mKeyArrayCourses[ascKey].label;
                    // Log.trace("ascKeyLabel " + ascKeyLabel);
                    oKeyArrkeys.push(ascKeyLabel);
                } else if (this.sKeyArrayCourses.hasOwnProperty(ascKey.trim()) && (qCoursesID !== "")) {
                    const ascKeyLabel = qCoursesID + "_" + this.sKeyArrayCourses[ascKey].label;
                    // Log.trace("ascKeyLabel " + ascKeyLabel);
                    oKeyArrkeys.push(ascKeyLabel);
                } else if (this.mKeyArrayRooms.hasOwnProperty(ascKey.trim()) && (qRoomsID !== "")) {
                    const ascKeyLabel = qRoomsID + "_" + this.mKeyArrayRooms[ascKey].label;
                    // Log.trace("ascKeyLabel " + ascKeyLabel);
                    oKeyArrkeys.push(ascKeyLabel);
                } else if (this.sKeyArrayRooms.hasOwnProperty(ascKey.trim()) && (qRoomsID !== "")) {
                    const ascKeyLabel = qRoomsID + "_" + this.sKeyArrayRooms[ascKey].label;
                    // Log.trace("ascKeyLabel " + ascKeyLabel);
                    oKeyArrkeys.push(ascKeyLabel);
                } else if (aggKeyArr.indexOf(ascKey.trim()) > -1) {
                    const ascKeyLabel = ascKey;
                    // Log.trace("ascKeyLabel " + ascKeyLabel);
                    oKeyArrkeys.push(ascKeyLabel);
                } else {
                    // Log.trace("aggKeyArr.indexOf(ascKey.trim()) " + aggKeyArr.indexOf(ascKey.trim()));
                    Log.trace("Invalid ascKey " + ascKey);
                    throw new Error("Invalid Order Key!");
                }
            }
            oKeyArr.keys = oKeyArrkeys;
            // Log.trace("oKeyArr " + JSON.stringify(oKeyArr));
        }
        if (orderDscKeyArr.length > 0) {
            // Log.trace("orderDscKeyArr.length " + orderDscKeyArr.length);
            // Log.trace("orderDscKeyArr " + orderDscKeyArr);
            oKeyArr.dir = "DESC";
            for (const dscKey of orderDscKeyArr) {
                // Log.trace("dscKey " + dscKey.trim());
                if (this.mKeyArrayCourses.hasOwnProperty(dscKey.trim()) && (qCoursesID !== "")) {
                    const dscKeyLabel = qCoursesID + "_" + this.mKeyArrayCourses[dscKey].label;
                    // Log.trace("dscKeyLabel " + dscKeyLabel);
                    oKeyArrkeys.push(dscKeyLabel);
                } else if (this.sKeyArrayCourses.hasOwnProperty(dscKey.trim()) && (qCoursesID !== "")) {
                    const dscKeyLabel = qCoursesID + "_" + this.sKeyArrayCourses[dscKey].label;
                    // Log.trace("dscKeyLabel " + dscKeyLabel);
                    oKeyArrkeys.push(dscKeyLabel);
                }  else if (this.mKeyArrayRooms.hasOwnProperty(dscKey.trim()) && (qRoomsID !== "")) {
                    const dscKeyLabel = qRoomsID + "_" + this.mKeyArrayRooms[dscKey].label;
                    // Log.trace("dscKeyLabel " + dscKeyLabel);
                    oKeyArrkeys.push(dscKeyLabel);
                } else if (this.sKeyArrayRooms.hasOwnProperty(dscKey.trim()) && (qRoomsID !== "")) {
                    const dscKeyLabel = qRoomsID + "_" + this.sKeyArrayRooms[dscKey].label;
                    // Log.trace("dscKeyLabel " + dscKeyLabel);
                    oKeyArrkeys.push(dscKeyLabel);
                }  else if (aggKeyArr.indexOf(dscKey.trim()) > -1) {
                    const dscKeyLabel = dscKey;
                    // Log.trace("dscKeyLabel " + dscKeyLabel);
                    oKeyArrkeys.push(dscKeyLabel);
                } else {
                    // Log.trace("aggKeyArr.indexOf(dscKey.trim()) " + aggKeyArr.indexOf(dscKey.trim()));
                    Log.trace("Invalid dscKey " + dscKey);
                    throw new Error("Invalid Order Key!");
                }
            }
            oKeyArr.keys = oKeyArrkeys;
            // Log.trace("oKeyArr " + JSON.stringify(oKeyArr));
        }

        // Log.trace("isValidQuery " + query);
        // Log.trace("queryDataset " + queryDataset);
        // Log.trace("qCoursesID " + qCoursesID);
        // Log.trace("queryFilter " + queryFilter);
        // Log.trace("queryDisplay " + queryDisplay);
        // Log.trace("orderAscKeyArr " + orderAscKeyArr);
        // Log.trace("orderDscKeyArr " + orderDscKeyArr);

        let DATASET: string;
        if (qCoursesID.length > 0 ) {
            DATASET = qCoursesID;
        } else {
            DATASET = qRoomsID;
        }

        const FILTER = this.parseFilter(queryFilter, qCoursesID, qRoomsID);
        const DISPLAY = this.parseDisplay(queryDisplay, qCoursesID, qRoomsID, aggKeyArr, grpdKys);
        const ORDER: any = oKeyArr;
        const GROUP: any = grpdKysArr;
        const APPLY: any = applyArr;

        // Log.trace("FILTER " + JSON.stringify(FILTER));
        // Log.trace("DISPLAY " + DISPLAY);
        // Log.trace("ORDER " + JSON.stringify(ORDER));
        // Log.trace("GROUP " + JSON.stringify(GROUP));
        // Log.trace("APPLY " + JSON.stringify(APPLY));

        // this.ConvertedQuery = {FILTER, DISPLAY, ORDER};
        // Log.trace("ConvertedQuery " + JSON.stringify(this.ConvertedQuery));
        return {DATASET, FILTER, DISPLAY, ORDER, GROUP, APPLY};

    }

    public parseFilter(queryFilter: string, qCoursesID: string, qRoomsID: string) {

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
                Log.trace("parseFilter err 334 " + err);
                throw new Error("Invalid Query!");
            }
        } else {
            Log.trace("parseFilter err 338 "  + queryFilter);
            throw new Error("Invalid Query!");
        }

        // Log.trace("filterCritirea " + filterCritirea);
        // Log.trace("filterLogic " + filterLogic);

        filter = this.parseFilters(filterCritirea, filterLogic, qCoursesID, qRoomsID);

        // Log.trace("filter " + JSON.stringify(filter));

        return filter;

    }

    public parseDisplay(queryDisplay: string, qCoursesID: string, qRoomsID: string, aggKeyArr: any, grpdKys: any) {
        queryDisplay = queryDisplay.toString();
        if (queryDisplay[queryDisplay.length - 1] === ".") {
            queryDisplay = queryDisplay.slice(0, -1);
        }
        const displayKey = queryDisplay.split("show")[1].split(/,| and /).map((e) =>
         e.trim()).filter((e) => e !== "");
        // Log.trace("displayKey " + displayKey);
        // Log.trace("grpdKys " + JSON.stringify(grpdKys));
        let dKey: string = "";
        const dKeyArr: any[] = [];
        for (dKey of displayKey) {
            if ((aggKeyArr.length > 0) || (grpdKys.length > 0)) {
                if ((aggKeyArr.indexOf(dKey) < 0) && (grpdKys.indexOf(dKey) < 0)) {
                    Log.trace("dKey not in aggKeyArr || grpdKysArr " + dKey);
                    Log.trace("aggKeyArr " + aggKeyArr);
                    throw new Error("Invalid Display Key!");
                }
            }
            if (this.mKeyArrayCourses.hasOwnProperty(dKey) && (qCoursesID.length > 0)) {
                const dKeyLabel = qCoursesID + "_" + this.mKeyArrayCourses[dKey].label;
                // Log.trace("dKeyLabel " + dKeyLabel);
                dKeyArr.push(dKeyLabel);
            } else if (this.sKeyArrayCourses.hasOwnProperty(dKey) && (qCoursesID.length > 0)) {
                const dKeyLabel = qCoursesID + "_" + this.sKeyArrayCourses[dKey].label;
                dKeyArr.push(dKeyLabel);
                // Log.trace("dKeyLabel " + dKeyLabel);
            } else if (this.mKeyArrayRooms.hasOwnProperty(dKey) && (qRoomsID.length > 0)) {
                const dKeyLabel = qRoomsID + "_" + this.mKeyArrayRooms[dKey].label;
                // Log.trace("dKeyLabel " + dKeyLabel);
                dKeyArr.push(dKeyLabel);
            }  else if (this.sKeyArrayRooms.hasOwnProperty(dKey) && (qRoomsID.length > 0)) {
                const dKeyLabel = qRoomsID + "_" + this.sKeyArrayRooms[dKey].label;
                dKeyArr.push(dKeyLabel);
                // Log.trace("dKeyLabel " + dKeyLabel);
            } else if (aggKeyArr.indexOf(dKey) > -1) {
                dKeyArr.push(dKey);
            } else {
                Log.trace("dKey Invalid Display Key " + dKey);
                throw new Error("Invalid Display Key!");
            }
        }
        return dKeyArr;
    }

    private parseFilters(filterCritirea: any, logicComparators: any[], qCoursesID: string, qRoomsID: string) {
        const filter: { [key: string]: any[] } = {};
        // Log.trace("logicComparators " + logicComparators);
        // Log.trace("logicComparators.length " + logicComparators.length);
        if (logicComparators.length === 0) {
            // Log.trace("filterCritirea[0] " + filterCritirea[0]);
            return this.parseCritirea(filterCritirea[0], qCoursesID, qRoomsID);
        } else {
            // Log.trace("logicComparatorsTransform "
            // + logicComparators.slice(-1).toString().toUpperCase());
            // Log.trace("filterCritirea.slice(0, -1) " + filterCritirea.slice(0, -1));
            // Log.trace("logicComparators.slice(0, -1) " + logicComparators.slice(0, -1));

            const parseFiltersRe = this.parseFilters(filterCritirea.slice(0, -1),
            logicComparators.slice(0, -1), qCoursesID, qRoomsID);
            // Log.trace("parseFiltersRe " + JSON.stringify(parseFiltersRe));

            // Log.trace("filterCritirea.slice(-1) " + filterCritirea.slice(-1));
            const parseCritireaObj = this.parseCritirea(filterCritirea.slice(-1).toString(), qCoursesID, qRoomsID);
            // Log.trace("parseCritireaObj " + JSON.stringify(parseCritireaObj));

            filter[logicComparators.slice(-1).toString().toUpperCase()] = [parseFiltersRe, parseCritireaObj];

            // Log.trace("parseFilters filter" + JSON.stringify(filter));
        }
        return filter;
    }

    private parseCritirea(filterCritirea: any, qCoursesID: string, qRoomsID: string) {
        const filter: { [key: string]: any } = {};
        let msKey: string;
        if (filterCritirea.indexOf("Full Name") > -1) {
            msKey = "Full Name";
        } else if (filterCritirea.indexOf("Short Name") > -1) {
            msKey = "Short Name";
        } else {
            msKey = filterCritirea.split(" ")[0];
        }
        // Log.trace("filterCritirea " + filterCritirea);
        // Log.trace("mKeyArrayCourses.hasOwnProperty(msKey) " + this.mKeyArrayCourses.hasOwnProperty(msKey));
        // Log.trace("sKeyArrayCourses.hasOwnProperty(msKey) " + this.sKeyArrayCourses.hasOwnProperty(msKey));
        if (this.mKeyArrayCourses.hasOwnProperty(msKey) && (qCoursesID.length > 0)) {
            const mNum = filterCritirea.split(" ").splice(-1);
            // Log.trace("mNum " + mNum);
            const mOpEnd = filterCritirea.length - mNum.toString().length;
            const mOp = filterCritirea.substring(msKey.length + 1, mOpEnd);
            // Log.trace("mOp " + mOp);
            const mOpIndex = this.mOpArrary.hasOwnProperty(mOp);
            // Log.trace("mOpIndex " + mOpIndex);
            if (!isNaN(mNum) && mOpIndex) {
                filter[(this.mOpArrary[mOp].operator)] = {};
                const mKey = qCoursesID + "_" + this.mKeyArrayCourses[msKey].label;
                filter[(this.mOpArrary[mOp].operator)][mKey] = Number(mNum);
                // Log.trace("parseCritirea filter " + JSON.stringify(filter));
                return filter;
            } else {
                throw new Error("Invalid Critirea!");
            }
        } else if (this.sKeyArrayCourses.hasOwnProperty(msKey) && (qCoursesID.length > 0)) {
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
                const sKey = qCoursesID + "_" + this.sKeyArrayCourses[msKey].label;
                filter[(this.sOpArray[sOp].operator)][sKey] = sStrTrim;
                // Log.trace("parseCritirea filter " + JSON.stringify(filter));
                return filter;
            } else {
                throw new Error("Invalid Critirea!");
            }
        } else if (this.mKeyArrayRooms.hasOwnProperty(msKey) && (qRoomsID.length > 0)) {
            const mNum = filterCritirea.split(" ").splice(-1);
            // Log.trace("mNum " + mNum);
            const mOpEnd = filterCritirea.length - mNum.toString().length;
            const mOp = filterCritirea.substring(msKey.length + 1, mOpEnd);
            // Log.trace("mOp " + mOp);
            const mOpIndex = this.mOpArrary.hasOwnProperty(mOp);
            // Log.trace("mOpIndex " + mOpIndex);
            if (!isNaN(mNum) && mOpIndex) {
                filter[(this.mOpArrary[mOp].operator)] = {};
                const mKey = qRoomsID + "_" + this.mKeyArrayRooms[msKey].label;
                filter[(this.mOpArrary[mOp].operator)][mKey] = Number(mNum);
                // Log.trace("parseCritirea filter " + JSON.stringify(filter));
                return filter;
            } else {
                Log.trace("Invalid msKey 502 " + msKey);
                throw new Error("Invalid Critirea!");
            }
        }  else if (this.sKeyArrayRooms.hasOwnProperty(msKey) && (qRoomsID.length > 0)) {
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
                const sKey = qRoomsID + "_" + this.sKeyArrayRooms[msKey].label;
                filter[(this.sOpArray[sOp].operator)][sKey] = sStrTrim;
                // Log.trace("parseCritirea filter " + JSON.stringify(filter));
                return filter;
            } else {
                Log.trace("Invalid msKey 532" + msKey);
                throw new Error("Invalid Critirea!");
            }
        } else {
            Log.trace("Invalid msKey 536" + msKey);
            throw new Error("Invalid Critirea!");
        }
    }
}
