import { expect } from "chai";

import { InsightResponse, InsightResponseSuccessBody, InsightDatasetKind } from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";

// This should match the JSON schema described in test/query.schema.json
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any;  // make any to allow testing structurally invalid queries
    response: InsightResponse;
    filename: string;  // This is injected when reading the file
}

describe("InsightFacade list 0 Dataset", function () {

    let insightFacade: InsightFacade;

    before(async function () {
        Log.test(`Before: ${this.test.parent.title}`);

        try {
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        } finally {
            expect(insightFacade).to.be.instanceOf(InsightFacade);
        }
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    it("Should list 0 datasets", async () => {
        const expectedCode: number = 200;
        const expectedLength = 0;
        let response: InsightResponse;
        try {
            response = await insightFacade.listDatasets();
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
            expect((response.body as InsightResponseSuccessBody).result.length).to.equal(expectedLength);
        }
    });

});

describe("InsightFacade Add/Remove Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the Before All hook.
    const datasetsToLoad: { [id: string]: string } = {
        oneValidcsv: "./test/data/oneValidcsv.zip",
    };

    let insightFacade: InsightFacade;
    let datasets: { [id: string]: string };

    before(async function () {
        Log.test(`Before: ${this.test.parent.title}`);

        try {
            const loadDatasetPromises: Array<Promise<Buffer>> = [];
            for (const [id, path] of Object.entries(datasetsToLoad)) {
                loadDatasetPromises.push(TestUtil.readFileAsync(path));
            }
            const loadedDatasets = (await Promise.all(loadDatasetPromises)).map((buf, i) => {
                return { [Object.keys(datasetsToLoad)[i]]: buf.toString("base64") };
            });
            datasets = Object.assign({}, ...loadedDatasets);
            expect(Object.keys(datasets)).to.have.length.greaterThan(0);
        } catch (err) {
            expect.fail("", "", `Failed to read one or more datasets. ${JSON.stringify(err)}`);
        }

        try {
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        } finally {
            expect(insightFacade).to.be.instanceOf(InsightFacade);
        }
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    it("Should add dataset with one valid csv", async () => {
        const id: string = "oneValidcsv";
        const expectedCode: number = 204;
        let response: InsightResponse;

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
        }
    });
});

describe("InsightFacade list Dataset", function () {
    const datasetsToList: { [id: string]: string } = {
        oneValidcsv: "./test/data/oneValidcsv.zip",
    };
    let insightFacade: InsightFacade;
    let datasets: { [id: string]: string };

    before(async function () {
        Log.test(`Before: ${this.test.parent.title}`);

        try {
            const loadDatasetPromises: Array<Promise<Buffer>> = [];
            for (const [id, path] of Object.entries(datasetsToList)) {
                loadDatasetPromises.push(TestUtil.readFileAsync(path));
            }
            const loadedDatasets = (await Promise.all(loadDatasetPromises)).map((buf, i) => {
                return { [Object.keys(datasetsToList)[i]]: buf.toString("base64") };
            });
            datasets = Object.assign({}, ...loadedDatasets);
            expect(Object.keys(datasets)).to.have.length.greaterThan(0);
        } catch (err) {
            expect.fail("", "", `Failed to read one or more datasets. ${JSON.stringify(err)}`);
        }

        try {
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        } finally {
            expect(insightFacade).to.be.instanceOf(InsightFacade);
        }
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    it("Should list added datasets and its type", async () => {
        const expectedCode: number = 200;
        const expectedResult = [{
            id: "oneValidcsv",
            kind: InsightDatasetKind.Courses,
            numRows: 4,
        }];
        let response: InsightResponse;
        try {
            response = await insightFacade.listDatasets();
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
            // expect((response.body as InsightResponseSuccessBody).result).to.equal(expectedResult);
        }
    });
});

describe("InsightFacade Add/Remove Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the Before All hook.
    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        courses7z: "./test/data/courses7z.7z",
        coursesTar: "./test/data/coursesTar.tar",
        coursesGz: "./test/data/coursesGz.gz",
        notCalledCourses: "./test/data/notCalledCourses.zip",
        woFiles: "./test/data/woFiles.zip",
        coursesNotCSV: "./test/data/coursesNotCSV.zip",
        zeroSection: "./test/data/zeroSection.zip",
        oneValidcsv: "./test/data/oneValidcsv.zip",
        twoValidcsv: "./test/data/twoValidcsv.zip",
        threeValidcsv: "./test/data/threeValidcsv.zip",
        randomFileGarbage: "./test/data/randomFileGarbage.zip",
        noFolder: "./test/data/noFolder.zip",
        spacetime: "./test/data/space time.zip",
        under_score: "./test/data/under_score.zip",
        dataset: "./test/data/dataset.zip",
        ends: "./test/data/ends.zip",
        is: "./test/data/is.zip",
        oneSection: "./test/data/oneSection.zip",
        oneZeroSection: "./test/data/oneZeroSection.zip",
        validCvsOthers: "./test/data/validCvsOthers.zip",
        _: "./test/data/_.zip",
        rooms: "./test/data/rooms.zip",
        minorRooms: "./test/data/minorRooms.zip",
    };

    let insightFacade: InsightFacade;
    let datasets: { [id: string]: string };

    before(async function () {
        Log.test(`Before: ${this.test.parent.title}`);

        try {
            const loadDatasetPromises: Array<Promise<Buffer>> = [];
            for (const [id, path] of Object.entries(datasetsToLoad)) {
                loadDatasetPromises.push(TestUtil.readFileAsync(path));
            }
            const loadedDatasets = (await Promise.all(loadDatasetPromises)).map((buf, i) => {
                return { [Object.keys(datasetsToLoad)[i]]: buf.toString("base64") };
            });
            datasets = Object.assign({}, ...loadedDatasets);
            expect(Object.keys(datasets)).to.have.length.greaterThan(0);
        } catch (err) {
            expect.fail("", "", `Failed to read one or more datasets. ${JSON.stringify(err)}`);
        }

        try {
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        } finally {
            expect(insightFacade).to.be.instanceOf(InsightFacade);
        }
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    it("Should add a valid dataset", async () => {
        const id: string = "courses";
        const expectedCode: number = 204;
        let response: InsightResponse;

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
        }
    });

    // it("Should add a second valid dataset", async () => {
    //     const id1: string = "courses";
    //     const id2: string = "coursesD1";
    //     const expectedCode: number = 204;
    //     let response: InsightResponse;

    //     try {
    //         response = await insightFacade.addDataset(id1, datasets[id1], InsightDatasetKind.Courses);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response.code).to.equal(expectedCode);
    //     }

    //     try {
    //         response = await insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response.code).to.equal(expectedCode);
    //     }
    // });

    // it("Should not add first invalid dataset", async () => {
    //     const id1: string = "coursesNotCSV";
    //     const id2: string = "coursesD1";
    //     const expectedCode1: number = 400;
    //     const expectedCode2: number = 204;
    //     let response: InsightResponse;

    //     try {
    //         response = await insightFacade.addDataset(id1, datasets[id1], InsightDatasetKind.Courses);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response.code).to.equal(expectedCode1);
    //         expect(response.body).to.contain({error: "Should not add courses not in CSV format"});
    //     }

    //     try {
    //         response = await insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response.code).to.equal(expectedCode2);
    //     }
    // });

    // it("Should not add second invalid dataset", async () => {
    //     const id1: string = "courses";
    //     const id2: string = "notZip";
    //     const expectedCode1: number = 204;
    //     const expectedCode2: number = 400;
    //     let response: InsightResponse;

    //     try {
    //         response = await insightFacade.addDataset(id1, datasets[id1], InsightDatasetKind.Courses);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response.code).to.equal(expectedCode1);
    //     }

    //     try {
    //         response = await insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response.code).to.equal(expectedCode2);
    //         expect(response.body).to.contain({error: "Failed to load zip file!"});
    //     }
    // });

    it("Should not add same dataset twice same instance", async () => {
        const id: string = "courses";
        const expectedCode: number = 400;
        let response: InsightResponse;

        try {
            await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
            expect(response.body).to.contain({error: "Dataset exists!"});
        }
    });

    it("Should not add same dataset twice new instance", async () => {
        const newInsightFacade = new InsightFacade();
        const id: string = "courses";
        const expectedCode: number = 400;
        let response: InsightResponse;

        try {
            response = await newInsightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
        }
    });

    it("Should remove the courses dataset", async () => {
        const id: string = "courses";
        const expectedCode: number = 204;
        let response: InsightResponse;

        try {
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
        }
    });

    it("subsequent queries for removed id should fail unless a new addDataset happens first", async () => {
        const expectedCode: number = 400;
        let response: InsightResponse;

        try {
            // tslint:disable-next-line:max-line-length
            response = await insightFacade.performQuery("In courses dataset courses, find entries whose Average is greater than 98; show UUID.");
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
            expect(response.body).to.contain({error: "Invalid query!"});
        }
    });

    it("in new instance, subsequent queries for removed id should fail", async () => {
        const newInsightFacade = new InsightFacade();
        const expectedCode: number = 400;
        let response: InsightResponse;

        try {
            // tslint:disable-next-line:max-line-length
            response = await newInsightFacade.performQuery("In courses dataset courses, find entries whose Average is greater than 98; show UUID.");
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
            expect(response.body).to.contain({error: "Invalid query!"});
        }
    });

    it("Should be able to add dataset after it was removed", async () => {
        const id: string = "courses";
        const expectedCode: number = 204;
        let response: InsightResponse;

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
        }
    });

    it("Should add valid dataset with 2 courses one section", async () => {
        const id: string = "oneZeroSection";
        const expectedCode: number = 204;
        let response: InsightResponse;

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
        }
    });

    it("Should not remove dataset if id empty", async () => {
        const id: string = "";
        const expectedCode: number = 404;
        let response: InsightResponse;

        try {
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
        }
    });

    it("Should not remove dataset if not found", async () => {
        const id: string = "notFound";
        const expectedCode: number = 404;
        let response: InsightResponse;

        try {
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
        }
    });

    it("Should not add non zip dataset", async () => {
        const id1: string = "courses7z";
        const id2: string = "coursesTar";
        const expectedCode: number = 400;
        let response: InsightResponse;

        try {
            response = await insightFacade.addDataset(id1, datasets[id1], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
            expect(response.body).to.contain({error: "Failed to load zip file!"});
        }

        try {
            response = await insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
            expect(response.body).to.contain({error: "Failed to load zip file!"});
        }
    });

    it("Should not add dataset name contain spaces", async () => {
        const id: string = "space time";
        const expectedCode: number = 400;
        let response: InsightResponse;

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
            expect(response.body).to.contain({error: "Invalid ID!"});
        }
    });

    it("Should not add dataset name contain underscore", async () => {
        const id: string = "under_score";
        const expectedCode: number = 400;
        let response: InsightResponse;

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
            expect(response.body).to.contain({error: "Invalid ID!"});
        }
    });

    it("Should not add dataset name equal RESERVED strings", async () => {
        const id: string = "dataset";
        const expectedCode: number = 400;
        let response: InsightResponse;

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
            expect(response.body).to.contain({error: "Invalid ID!"});
        }
    });

    it("Should not add zip with no folder", async () => {
        const id: string = "noFolder";
        const expectedCode: number = 400;
        let response: InsightResponse;

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
            expect(response.body).to.contain({error: "courses folder not found!"});
        }
    });

    it("Should not add non zip dataset", async () => {
        const id: string = "coursesGz";
        const expectedCode: number = 400;
        let response: InsightResponse;

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
            expect(response.body).to.contain({error: "Failed to load zip file!"});
        }
    });

    it("Should not add folder not called courses", async () => {
        const id: string = "notCalledCourses";
        const expectedCode: number = 400;
        let response: InsightResponse;

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
            expect(response.body).to.contain({error: "courses folder not found!"});
        }
    });

    it("Should not add zip without files", async () => {
        const id: string = "woFiles";
        const expectedCode: number = 400;
        let response: InsightResponse;

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
            expect(response.body).to.contain({error: "Invalid course section!"});
        }
    });

    it("Should not add courses not in CSV format", async () => {
        const id: string = "coursesNotCSV";
        const expectedCode: number = 400;
        let response: InsightResponse;

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
            expect(response.body).to.contain({error: "Invalid course section!"});
        }
    });

    it("Should not add dataset with zero valid course section", async () => {
        const id: string = "zeroSection";
        const expectedCode: number = 400;
        let response: InsightResponse;

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
            expect(response.body).to.contain({error: "Invalid course section!"});
        }
    });

    it("Should not add dataset with invalid contents", async () => {
        const id: string = "randomFileGarbage";
        const expectedCode: number = 400;
        let response: InsightResponse;

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
            expect(response.body).to.contain({error: "Invalid course section!"});
        }
    });

    it("Should not add dataset with id undefined", async () => {
        const id: string = undefined;
        const expectedCode: number = 400;
        let response: InsightResponse;

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
            expect(response.body).to.contain({error: "Invalid ID!"});
        }
    });

    it("Should not add dataset if id empty", async () => {
        const id: string = "";
        const expectedCode: number = 400;
        let response: InsightResponse;

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
            expect(response.body).to.contain({error: "Invalid ID!"});
        }
    });

    it("Should not add dataset if id contain spaces, underscores or equal to RESERVED strings", async () => {
        const id: string = "with space";
        const expectedCode: number = 400;
        let response: InsightResponse;

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
            expect(response.body).to.contain({error: "Invalid ID!"});
        }
    });

    it("Should not add dataset if id contain spaces, underscores or equal to RESERVED strings", async () => {
        const id: string = "under_score";
        const expectedCode: number = 400;
        let response: InsightResponse;

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
            expect(response.body).to.contain({error: "Invalid ID!"});
        }
    });

    it("Should not add dataset if id contain spaces, underscores or equal to RESERVED strings", async () => {
        const id: string = "_";
        const expectedCode: number = 400;
        let response: InsightResponse;

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
            expect(response.body).to.contain({error: "Invalid ID!"});
        }
    });

    it("Should not add dataset if id contain spaces, underscores or equal to RESERVED strings", async () => {
        const id: string = "dataset";
        const expectedCode: number = 400;
        let response: InsightResponse;

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
            expect(response.body).to.contain({error: "Invalid ID!"});
        }
    });

    it("Should not add dataset if id contain spaces, underscores or equal to RESERVED strings", async () => {
        const id: string = "ends";
        const expectedCode: number = 400;
        let response: InsightResponse;

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
            expect(response.body).to.contain({error: "Invalid ID!"});
        }
    });

    it("Should not add dataset if id contain spaces, underscores or equal to RESERVED strings", async () => {
        const id: string = "is";
        const expectedCode: number = 400;
        let response: InsightResponse;

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
            expect(response.body).to.contain({error: "Invalid ID!"});
        }
    });

    it("Should not add dataset if not found", async () => {
        const id: string = "notfound";
        const expectedCode: number = 400;
        let response: InsightResponse;

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
            expect(response.body).to.contain({error: "Failed to load zip file!"});
        }
    });

    it("subsequent queries for added oneValidcsv should pass", async () => {
        const expectedCode: number = 200;
        let response: InsightResponse;

        try {
            // tslint:disable-next-line:max-line-length
            response = await insightFacade.performQuery("In courses dataset oneValidcsv, find all entries; show Department and ID and Average.");
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
        }
    });

    it("Should add valid dataset with one section", async () => {
        const id: string = "oneSection";
        const expectedCode: number = 204;
        let response: InsightResponse;

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
        }
    });

    it("Should add zip with valid csv and other files", async () => {
        const id: string = "validCvsOthers";
        const expectedCode: number = 204;
        let response: InsightResponse;

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
        }
    });

    it("Should add valid dataset with 2 CSVs", async () => {
        const id: string = "twoValidcsv";
        const expectedCode: number = 204;
        let response: InsightResponse;

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
        }
    });

    it("Should add valid dataset with 3 CSVs", async () => {
        const id: string = "threeValidcsv";
        const expectedCode: number = 204;
        let response: InsightResponse;

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
        }
    });

    it("Should add valid minorRooms dataset", async () => {
        const id: string = "minorRooms";
        const expectedCode: number = 204;
        let response: InsightResponse;

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
        }
    });

    it("Should add valid rooms dataset", async () => {
        const id: string = "rooms";
        const expectedCode: number = 204;
        let response: InsightResponse;

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
        }
    });

    it("subsequent queries for added oneSection should pass", async () => {
        const expectedCode: number = 200;
        let response: InsightResponse;

        try {
            // tslint:disable-next-line:max-line-length
            response = await insightFacade.performQuery("In courses dataset oneSection, find all entries; show Department and ID and Average.");
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
        }
    });

    it("subsequent queries for added oneZeroSection should pass", async () => {
        const expectedCode: number = 200;
        let response: InsightResponse;

        try {
            // tslint:disable-next-line:max-line-length
            response = await insightFacade.performQuery("In courses dataset oneZeroSection, find all entries; show Department and ID and Average.");
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
        }
    });

    it("subsequent queries for added validCvsOthers should pass", async () => {
        const expectedCode: number = 200;
        let response: InsightResponse;

        try {
            // tslint:disable-next-line:max-line-length
            response = await insightFacade.performQuery("In courses dataset validCvsOthers, find all entries; show Department and ID and Average.");
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
        }
    });

    it("subsequent queries for added id should pass", async () => {
        const expectedCode: number = 200;
        let response: InsightResponse;

        try {
            // tslint:disable-next-line:max-line-length
            response = await insightFacade.performQuery("In courses dataset courses, find entries whose Average is greater than 98; show UUID.");
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
        }
    });

    it("in new instance, subsequent queries for added id should pass", async () => {
        const newInsightFacade = new InsightFacade();
        const expectedCode: number = 200;
        let response: InsightResponse;

        try {
            // tslint:disable-next-line:max-line-length
            response = await newInsightFacade.performQuery("In courses dataset courses, find entries whose Average is greater than 98; show UUID.");
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
        }
    });

    it("in new instance, should remove the courses dataset from previous instance", async () => {
        const newInsightFacade = new InsightFacade();
        const id: string = "courses";
        const expectedCode: number = 204;
        let response: InsightResponse;

        try {
            response = await newInsightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
        }
    });

    // it("Should not remove dataset if id undefined", async () => {
    //     const id: string = undefined;
    //     const expectedCode: number = 404;
    //     let response: InsightResponse;

    //     try {
    //         response = await insightFacade.removeDataset(id);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response.code).to.equal(expectedCode);
    //     }
    // });

    // it("Should remove selected datasets", async () => {
    //     const id1: string = "courses";
    //     const id2: string = "coursesD1";
    //     const expectedCode: number = 204;
    //     let response: InsightResponse;

    //     try {
    //         response = await insightFacade.removeDataset(id1);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response.code).to.equal(expectedCode);
    //     }

    //     try {
    //         response = await insightFacade.removeDataset(id2);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response.code).to.equal(expectedCode);
    //     }
    // });

});

describe("InsightFacade list Dataset", function () {
    const datasetsToList: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        oneValidcsv: "./test/data/oneValidcsv.zip",
        // coursesNotCSV: "./test/data/coursesNotCSV.zip",
        // coursesGz: "./test/data/coursesGz.gz",
        // notCalledCourses: "./test/data/notCalledCourses.zip",
        // randomFileGarbage: "./test/data/randomFileGarbage.zip",
        // spacetime: "./test/data/space time.zip",
        // under_score: "./test/data/under_score.zip",
        // woFiles: "./test/data/woFiles.zip",
        // zeroSection: "./test/data/zeroSection.zip",
        // dataset: "./test/data/dataset.zip",
        // ends: "./test/data/ends.zip",
        // is: "./test/data/is.zip",
    };
    let insightFacade: InsightFacade;
    let datasets: { [id: string]: string };

    before(async function () {
        Log.test(`Before: ${this.test.parent.title}`);

        try {
            const loadDatasetPromises: Array<Promise<Buffer>> = [];
            for (const [id, path] of Object.entries(datasetsToList)) {
                loadDatasetPromises.push(TestUtil.readFileAsync(path));
            }
            const loadedDatasets = (await Promise.all(loadDatasetPromises)).map((buf, i) => {
                return { [Object.keys(datasetsToList)[i]]: buf.toString("base64") };
            });
            datasets = Object.assign({}, ...loadedDatasets);
            expect(Object.keys(datasets)).to.have.length.greaterThan(0);
        } catch (err) {
            expect.fail("", "", `Failed to read one or more datasets. ${JSON.stringify(err)}`);
        }

        try {
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        } finally {
            expect(insightFacade).to.be.instanceOf(InsightFacade);
        }
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    it("Should list 2 added datasets", async () => {
        const expectedCode: number = 200;
        // const expectedLength = 2;
        let response: InsightResponse;
        try {
            response = await insightFacade.listDatasets();
        } catch (err) {
            response = err;
        } finally {
            expect(response.code).to.equal(expectedCode);
            // expect((response.body as InsightResponseSuccessBody).result.length).to.equal(expectedLength);
        }
    });

    // it("Should list 2 datasets in cache", async () => {
    //     const newInsightFacade = new InsightFacade();
    //     const expectedCode: number = 200;
    //     const expectedLength = 2;
    //     let response: InsightResponse;
    //     try {
    //         response = await newInsightFacade.listDatasets();
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response.code).to.equal(expectedCode);
    //         expect((response.body as InsightResponseSuccessBody).result.length).to.equal(expectedLength);
    //     }
    // });

});

// This test suite dynamically generates tests from the JSON files in test/queries.
// You should not need to modify it; instead, add additional files to the queries directory.
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        oneValidcsv: "./test/data/oneValidcsv.zip",
        minorRooms: "./test/data/minorRooms.zip",
        rooms: "./test/data/rooms.zip",
    };
    let insightFacade: InsightFacade;
    let testQueries: ITestQuery[] = [];

    // Create a new instance of InsightFacade, read in the test queries from test/queries and
    // add the datasets specified in datasetsToQuery.
    before(async function () {
        Log.test(`Before: ${this.test.parent.title}`);

        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        try {
            testQueries = await TestUtil.readTestQueries();
            expect(testQueries).to.have.length.greaterThan(0);
        } catch (err) {
            expect.fail("", "", `Failed to read one or more test queries. ${JSON.stringify(err)}`);
        }

        try {
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        } finally {
            expect(insightFacade).to.be.instanceOf(InsightFacade);
        }

        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Fail if there is a problem reading ANY dataset.
        try {
            const loadDatasetPromises: Array<Promise<Buffer>> = [];
            for (const [id, path] of Object.entries(datasetsToQuery)) {
                loadDatasetPromises.push(TestUtil.readFileAsync(path));
            }
            const loadedDatasets = (await Promise.all(loadDatasetPromises)).map((buf, i) => {
                return { [Object.keys(datasetsToQuery)[i]]: buf.toString("base64") };
            });
            expect(loadedDatasets).to.have.length.greaterThan(0);

            const responsePromises: Array<Promise<InsightResponse>> = [];
            const datasets: { [id: string]: string } = Object.assign({}, ...loadedDatasets);
            for (const [id, content] of Object.entries(datasets)) {
                responsePromises.push(insightFacade.addDataset(id, content, InsightDatasetKind.Courses));
            }

            // This try/catch is a hack to let your dynamic tests execute enough the addDataset method fails.
            // In D1, you should remove this try/catch to ensure your datasets load successfully before trying
            // to run you queries.
            try {
                const responses: InsightResponse[] = await Promise.all(responsePromises);
                responses.forEach((response) => expect(response.code).to.equal(204));
            } catch (err) {
                Log.warn(`Ignoring addDataset errors. For D1, you should allow errors to fail the Before All hook.`);
            }
        } catch (err) {
            expect.fail("", "", `Failed to read one or more datasets. ${JSON.stringify(err)}`);
        }
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // Dynamically create and run a test for each query in testQueries
    it("Should run test queries", () => {
        describe("Dynamic InsightFacade PerformQuery tests", () => {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, async () => {
                    let response: InsightResponse;

                    try {
                        response = await insightFacade.performQuery(test.query);
                    } catch (err) {
                        response = err;
                    } finally {
                        expect(response.code).to.equal(test.response.code);

                        if (test.response.code >= 400) {
                            expect(response.body).to.have.property("error");
                        } else {
                            expect(response.body).to.have.property("result");
                            const expectedResult = (test.response.body as InsightResponseSuccessBody).result;
                            const actualResult = (response.body as InsightResponseSuccessBody).result;
                            expect(actualResult).to.deep.equal(expectedResult);
                        }
                    }
                });
            }
        });
    });
});
