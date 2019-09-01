import DatasetController from "../controller/DatasetController";
import Log from "../Util";
import fs = require("fs");

export default class QueryController {

    private static datasetController= new DatasetController();

    public isValidQuery(query: string): boolean {

        const reserved = ["In", "dataset", "find", "all", "show", "and", "or", "sort", "by",
        "entries", "is", "the", "of", "whose", "includes", "begins", "ends", "_"];

        if ( (query === "") || (typeof(query) !== "string") || (query === null) || (query.indexOf(",") < 0) ||
        (query.indexOf(";") < 0) || (query.indexOf(".") < 0) ) {
            return false;
        }
        const queryFirstComma = query.indexOf(",");
        const queryDataset = query.slice(0, queryFirstComma);
        const queryExDataset = query.slice(queryFirstComma);
        const queryFirstSemi = queryExDataset.indexOf(";");
        const queryFilter = queryExDataset.slice(2, queryFirstSemi);
        const orderAscPreFix = "sort in ascending order by ";
        const orderPreFixPos = queryExDataset.indexOf(orderAscPreFix);
        let queryDisplay: string  = "";
        let queryOrder: string  = "";
        let filter: string  = "";

        if (orderPreFixPos < 0) {
            queryDisplay = queryExDataset.slice(queryFirstSemi + 2);
        } else {
            queryDisplay = queryExDataset.slice(queryFirstSemi + 2, orderPreFixPos);
            queryOrder = queryExDataset.slice(orderPreFixPos);
        }

        const queryDatasetCoursesPrefix = "In courses dataset ";
        const queryDatasetCoursesInput = queryDataset.slice(queryDatasetCoursesPrefix.length);
        const queryFilterAllPrefix = "find all entries";
        const queryFilterCritireaPrefix = "find entries whose ";
        let queryFilterCritirea: string  = "";
        let filterCritirea: string | any[] | string[] = [];

        if (queryFilter === queryFilterAllPrefix) {
            filter = queryFilterAllPrefix;
        } else if (queryFilter.slice(0, queryFilterCritireaPrefix.length) === queryFilterCritireaPrefix) {
            filter = queryFilterCritireaPrefix;
            queryFilterCritirea = queryFilter.slice(queryFilterCritireaPrefix.length);
            filterCritirea = queryFilterCritirea.split(" and ").join(",").split(" or ").join(" , ").split(" , ");
        }

        Log.trace("isValidQuery " + query);
        Log.trace("queryDataset " + queryDataset);
        Log.trace("queryDatasetCoursesInput " + queryDatasetCoursesInput);
        Log.trace("queryFilter " + queryFilter);
        Log.trace("queryDisplay " + queryDisplay);
        Log.trace("queryOrder " + queryOrder);
        Log.trace("filter " + filter);
        Log.trace("filterCritirea " + filterCritirea);

        if ( (queryDataset.indexOf(queryDataset) < 0) || (reserved.indexOf(queryDatasetCoursesInput) >= 0)
        || (filter !== queryFilterAllPrefix || queryFilterCritireaPrefix) ) {
            return false;
        } else {
            return true;
        }

    }
}
