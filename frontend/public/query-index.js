/**
 * This hooks together all the CampusExplorer methods and binds them to clicks on the submit button in the UI.
 *
 * The sequence is as follows:
 * 1.) Click on submit button in the reference UI
 * 2.) Query string is extracted from UI using global document object (CampusExplorer.buildQuery)
 * 3.) Query string is sent to the POST /query endpoint using global XMLHttpRequest object (CampusExplorer.sendQuery)
 * 4.) Result is rendered in the reference UI by calling CampusExplorer.renderResult with the response from the endpoint as argument
 */

// TODO: implement!

function processCampusExplorer() {
    let query = CampusExplorer.buildQuery();
    console.log("query 15 " + JSON.stringify(query));
    CampusExplorer.sendQuery(query).then((response) => {
        console.log("response 17 " + JSON.stringify(response.body));
        CampusExplorer.renderResult(response.body);
    }).catch((err) => {
        CampusExplorer.renderResult(err);
    });

};

document.getElementById("submit-button").addEventListener("click", processCampusExplorer);