/**
 * Receives a query string as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query string
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */
CampusExplorer.sendQuery = function(query) {
    return new Promise(function(fulfill, reject) {
        // TODO: implement!
        // console.log("CampusExplorer.sendQuery not implemented yet.");
        const xhttp = new XMLHttpRequest();
        xhttp.open("POST", "/query", true);
        xhttp.send(query);
        xhttp.onload = function() {
            console.log("responseText 15 " + JSON.stringify(xhttp.responseText));
            fulfill(JSON.parse(xhttp.responseText));
        };
        xhttp.onerror = function() {
            console.log("responseText 19 " + JSON.parse(xhttp.responseText));
            reject(JSON.parse(xhttp.responseText));
        }

    });
}