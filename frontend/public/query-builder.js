/**
 * Builds a query string using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query string adhering to the query EBNF
 */
CampusExplorer.buildQuery = function() {
    let convertedQuery = {};
    // TODO: implement!
    const activeTab = document.getElementsByClassName("tab-panel active")[0];
    const dataset = activeTab.getAttribute("data-type");
    const filter = parseFilter(activeTab, dataset);
    const display = parseDisplay(activeTab, dataset);
    const order = parseOrder(activeTab, dataset);
    const group = parseGroup(activeTab, dataset);
    const apply = parseApply(activeTab, dataset);

    console.log("dataset " + dataset);
    console.log("filter " + JSON.stringify(filter));
    console.log("display " + display);
    console.log("order " + JSON.stringify(order));
    console.log("group " + group);
    console.log("apply " + JSON.stringify(apply));

    convertedQuery = { DATASET: dataset, FILTER: filter, DISPLAY: display, ORDER: order, GROUP: group, APPLY: apply };

    return convertedQuery;
};

createCheckedFieldsArr = function(container, dataset) {
    let values = [];
    const checkedFields = container.querySelectorAll("input[checked]");
    console.log(checkedFields);
    for (i = 0; i < checkedFields.length; ++i) {
        console.log(checkedFields[i]);
        let fieldKey = checkedFields[i].value;
        if (checkedFields[i].id != "") {
            kyLabel = dataset + "_" + fieldKey;
        } else {
            kyLabel = fieldKey;
        }

        values.push(kyLabel);
    }

    return values;
};

parseFilter = function(activeTab, dataset) {
    const filterLogic = activeTab.getElementsByClassName("control-group condition-type")[0].querySelector("input[name='conditionType']:checked").value;
    const containers = activeTab.getElementsByClassName("control-group condition");
    let filters = [];
    let filterCritirea = [];

    console.log("filterLogic 53 " + filterLogic);
    for (const container of containers) {
        let filter = {};
        const isNot = container.getElementsByClassName("control not")[0].querySelector("input[checked]");
        let field = container.getElementsByClassName("control fields")[0].querySelector("option[selected]").value;
        let operator = container.getElementsByClassName("control operators")[0].querySelector("option[selected]").value;
        const term = container.getElementsByClassName("control term")[0].querySelector("input").value;
        console.log(term);
        field = dataset + "_" + field;
        console.log(field);
        if ((isNot && filterLogic !== "none") ||
            (!isNot && filterLogic === "none")) {
            operator = "N" + operator;
        }
        console.log(operator);
        if (operator.includes("IS")) {
            filter = {
                [operator]: {
                    [field]: term
                }
            };
        } else {
            filter = {
                [operator]: {
                    [field]: Number(term)
                }
            };
        }

        filterCritirea.push(filter);
    }
    console.log("filterCritirea 84 " + filterCritirea.length);
    if (filterCritirea.length === 1) {
        return filterCritirea[0];
    } else if (filterLogic === "all" && (filterCritirea.length > 1)) {
        filters = { AND: filterCritirea };
    } else if (filterLogic === "any" && (filterCritirea.length > 1)) {
        filters = { OR: filterCritirea };
    }
    console.log("filters 92 " + filters);
    return filters;
    // return createCheckedFieldsArr(container, dataset);
};

parseDisplay = function(activeTab, dataset) {
    const container = activeTab.getElementsByClassName("form-group columns")[0];
    // return container;
    return createCheckedFieldsArr(container, dataset);
};

parseOrder = function(activeTab, dataset) {
    const options = activeTab.getElementsByClassName("control order fields")[0].getElementsByTagName("option");
    // console.log("options 108 " + options);
    const descending = activeTab.getElementsByClassName("control descending")[0].getElementsByTagName("input")[0].checked;
    // console.log("descending 110 " + descending);
    let fields = [];
    let order = {};
    for (const option of options) {
        if (option.selected) {
            const key = dataset + "_" + option.value;
            fields.push(key);
        }
    }
    if (descending) {
        order = { dir: "DESC", keys: fields };
        // console.log("order 118 " + order);
    } else if (fields.length > 1) {
        order = { dir: "ASC", keys: fields };
        // console.log("order 121 " + order);
    }
    return order;
};

parseGroup = function(activeTab, dataset) {
    const container = activeTab.getElementsByClassName("form-group groups")[0];
    // return container;
    return createCheckedFieldsArr(container, dataset);
};

parseApply = function(activeTab, dataset) {
    const transformations = activeTab.getElementsByClassName("control-group transformation");
    let applyArr = [];

    for (transformation of transformations) {
        console.log("transformation 141 " + transformation);
        let term = transformation.getElementsByClassName("control term")[0].getElementsByTagName("input")[0].value;
        let operator = transformation.getElementsByClassName("control operators")[0].querySelector("option[selected]").value;
        let field = transformation.getElementsByClassName("control fields")[0].querySelector("option[selected]").value;
        let key = dataset + "_" + field;
        let apply = {
            [term]: {
                [operator]: [key]
            }
        };
        applyArr.push(apply);
    }

    return applyArr;
};