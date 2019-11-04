/**
 * Builds a query string using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query string adhering to the query EBNF
 */
CampusExplorer.buildQuery = function() {
    let query = "";
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

    if (dataset === "courses") {
        query += "In courses dataset courses";
    } else {
        query += "In rooms dataset rooms";
    }

    if (group.length === 1) {
        query += " grouped by " + group[0];
    }
    if (group.length > 1) {
        query += " grouped by " + group[0];
        for (i = 1; i < group.length; ++i) {
            query += " and " + group[i];
        }
    }

    query += filter;

    if (display.length === 1) {
        query += "; show " + display[0];
    }
    if (display.length > 1) {
        query += "; show " + display[0];
        for (i = 1; i < display.length; ++i) {
            query += " and " + display[i];
        }
    }

    if (apply.length === 1) {
        query += ", where " + apply[0];
    }
    if (apply.length > 1) {
        query += ", where " + apply[0];
        for (i = 1; i < apply.length; ++i) {
            query += " and " + apply[i];
        }
    }

    query += order + ".";

    return query;
};

valueToLabel = function(fieldKey) {
    const keyLabels = {
        "address": "Address",
        "audit": "Audit",
        "avg": "Average",
        "dept": "Department",
        "EQ": "equal to",
        "fail": "Fail",
        "fullname": "Full Name",
        "furniture": "Furniture",
        "GT": "greater than",
        "href": "Link",
        "id": "ID",
        "instructor": "Instructor",
        "IS": null,
        "lat": "Latitude",
        "lon": "Longitude",
        "LT": "less than",
        "name": "Name",
        "number": "Number",
        "pass": "Pass",
        "seats": "Seats",
        "shortname": "Short Name",
        "title": "Title",
        "type": "Type",
        "uuid": "UUID",
        "year": "Year"
    }
    return keyLabels[fieldKey];
}

createCheckedFieldsArr = function(container, dataset) {
    let values = [];
    const checkedFields = container.querySelectorAll("input[checked]");
    console.log(checkedFields);
    for (i = 0; i < checkedFields.length; ++i) {
        console.log(checkedFields[i]);
        let fieldKey = checkedFields[i].value;
        if (checkedFields[i].id != "") {
            kyLabel = valueToLabel(fieldKey);
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
    let filters = ", find all entries";
    let filterCritirea = [];

    console.log("filterLogic 53 " + filterLogic);
    for (const container of containers) {
        let filter = "";
        const isNot = container.getElementsByClassName("control not")[0].querySelector("input[checked]");
        let field = container.getElementsByClassName("control fields")[0].querySelector("option[selected]").value;
        let operator = container.getElementsByClassName("control operators")[0].querySelector("option[selected]").value;
        let keyLabel = valueToLabel(field);
        let opLabel = valueToLabel(operator);
        let term = container.getElementsByClassName("control term")[0].querySelector("input").value;
        console.log(term);
        console.log(keyLabel);
        console.log(opLabel);
        if ((isNot && filterLogic !== "none") ||
            (!isNot && filterLogic === "none")) {
            if (opLabel !== null) {
                filter = keyLabel + " is not " + opLabel + " " + term;
            } else {
                filter = keyLabel + " is not \"" + term + "\"";
            }
        } else {
            if (opLabel !== null) {
                filter = keyLabel + " is " + opLabel + " " + term;
            } else {
                filter = keyLabel + " is \"" + term + "\"";
            }
        }

        filterCritirea.push(filter);
    }
    console.log("filterCritirea 84 " + filterCritirea.length);
    if (filterCritirea.length === 1) {
        return ", find entries whose " + filterCritirea[0];
    } else if ((filterLogic === "all" || filterLogic === "none") && (filterCritirea.length > 1)) {
        filters = ", find entries whose " + filterCritirea[0];
        for (i = 1; i < filterCritirea.length; ++i) {
            filters += " and " + filterCritirea[i];
        }
    } else if (filterLogic === "any" && (filterCritirea.length > 1)) {
        filters = ", find entries whose " + filterCritirea[0];
        for (i = 1; i < filterCritirea.length; ++i) {
            filters += " or " + filterCritirea[i];
        }
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
    let order = "";
    for (const option of options) {
        if (option.selected) {
            let keyLabel = valueToLabel(option.value);
            fields.push(keyLabel);
        }
    }
    if (descending) {
        if (fields.length === 1) {
            order = "; sort in descending order by " + fields[0];
        }
        if (fields.length > 1) {
            order = "; sort in descending order by " + fields[0];
            for (i = 1; i < fields.length; ++i) {
                order += " and " + fields[i];
            }
        }
        // console.log("order 118 " + order);
    } else if (fields.length === 1) {
        order = "; sort in ascending order by " + fields[0];
        // console.log("order 121 " + order);
    } else if (fields.length > 1) {
        order = "; sort in ascending order by " + fields[0];
        for (i = 1; i < fields.length; ++i) {
            order += " and " + fields[i];
        }
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
        let keyLabel = valueToLabel(field);
        let apply = term + " is the " + operator + " of " + keyLabel;
        applyArr.push(apply);
    }

    return applyArr;
};