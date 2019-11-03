import Server from "../src/rest/Server";

import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import * as fs from "fs";
import chai = require("chai");
import {expect} from "chai";
import chaiHttp = require("chai-http");
import TestUtil from "./TestUtil";

describe("Facade D3", function () {

    let facade: InsightFacade = null;
    let server: Server = null;
    const URL: string = "http://127.0.0.1:4321";

    chai.use(chaiHttp);

    before(function () {
        facade = new InsightFacade();
        server = new Server(4321);
        // TODO: start server here once and handle errors properly
        server.start().then(function (val: boolean) {
            Log.test("Facade D3::before() - server started: " + val);
        }).catch(function (err: Error) {
            Log.error("Facade D3::before() - server error: " + err.message);
        });

    });

    after(function () {
        // TODO: stop server here once!
        server.stop();
    });

    beforeEach(function () {
        // might want to add some process logging here to keep track of what"s going on
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    afterEach(function () {
        // might want to add some process logging here to keep track of what"s going on
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // TODO: read your courses and rooms datasets here once!
    let coursesPath: string = "./test/data/threeValidcsvSever.zip";
    let courses: string = "threeValidcsvSever.zip";
    let coursesBuffer: Buffer;
    let roomsPath: string = "./test/data/minorRoomsServer.zip";
    let rooms: string = "minorRoomsServer.zip";
    let roomsBuffer: Buffer;
    try {
        coursesBuffer =  fs.readFileSync(coursesPath);
        roomsBuffer =  fs.readFileSync(roomsPath);
        // Log.trace("coursesBuffer " + coursesBuffer);
    } catch (err) {
        Log.trace("coursesBuffer err " + err);
    }

    // const roomsDataset = Buffer.from(fs.readFileSync("./test/data/rooms.zip")).toString("base64");

    // Hint on how to test PUT requests

    it("PUT test for courses dataset", function () {
        try {
            return chai.request(URL)
                .put("/dataset/threeValidcsvSever/courses")
                .attach("body", coursesBuffer, courses)
                .then(function (res: any) {
                    // some logging here please!
                    Log.trace("res.status: " + res.status);
                    expect(res.status).to.be.equal(204);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace("err: " + err.message);
                    Log.trace("err: " + err);
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            Log.trace("err: " + err.message);
            Log.error(err);
        }
    });

    it("PUT test for rooms dataset", function () {
        try {
            return chai.request(URL)
                .put("/dataset/minorRoomsServer/rooms")
                .attach("body", roomsBuffer, rooms)
                .then(function (res: any) {
                    // some logging here please!
                    Log.trace("res.status: " + res.status);
                    expect(res.status).to.be.equal(204);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace("err: " + err.message);
                    Log.trace("err: " + err);
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            Log.trace("err: " + err.message);
            Log.error(err);
        }
    });

    it("DELETE test for courses", function () {
        try {
            return chai.request(URL)
                .del("/dataset/threeValidcsvSever")
                .then(function (res: any) {
                    // some logging here please!
                    Log.trace("res.status: " + res.status);
                    expect(res.status).to.be.equal(204);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace("err: " + err.message);
                    Log.trace("err: " + err);
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            Log.trace("err: " + err.message);
            Log.error(err);
        }
    });

    it("DELETE test for rooms", function () {
        try {
            return chai.request(URL)
                .del("/dataset/minorRoomsServer")
                .then(function (res: any) {
                    // some logging here please!
                    Log.trace("res.status: " + res.status);
                    expect(res.status).to.be.equal(204);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace("err: " + err.message);
                    Log.trace("err: " + err);
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            Log.trace("err: " + err.message);
            Log.error(err);
        }
    });

    it("POST test for deleted courses dataset", function () {
        try {
            return chai.request(URL)
                .post("/query")
                .set("Content-Type", "application/json")
                .send(JSON.stringify("In courses dataset threeValidcsvSever, find all entries; show UUID."))
                .then(function (res: any) {
                    // some logging here please!
                    Log.trace("res.status: " + res.status);
                    expect(res.status).to.be.equal(400);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace("err.message: " + err.message);
                    Log.trace("err.status: " + err.status);
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            // and some more logging here!
            Log.trace("err: " + err.message);
            Log.trace("err: " + err.message);
            Log.error(err);
        }
    });

    it("POST test for deleted rooms dataset", function () {
        try {
            return chai.request(URL)
                .post("/query")
                .set("Content-Type", "application/json")
                .send(JSON.stringify("In rooms dataset minorRoomsServer, find all entries; show Name."))
                .then(function (res: any) {
                    // some logging here please!
                    Log.trace("res.status: " + res.status);
                    expect(res.status).to.be.equal(400);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace("err: " + err.message);
                    Log.trace("err: " + err);
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            // and some more logging here!
            Log.trace("err: " + err.message);
            Log.error(err);
        }
    });

    it("PUT test for courses dataset", function () {
        try {
            return chai.request(URL)
                .put("/dataset/threeValidcsvSever/courses")
                .attach("body", coursesBuffer, courses)
                .then(function (res: any) {
                    // some logging here please!
                    Log.trace("res.status: " + res.status);
                    expect(res.status).to.be.equal(204);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace("err: " + err.message);
                    Log.trace("err: " + err);
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            Log.trace("err: " + err.message);
            Log.error(err);
        }
    });

    it("PUT test for rooms dataset", function () {
        try {
            return chai.request(URL)
                .put("/dataset/minorRoomsServer/rooms")
                .attach("body", roomsBuffer, rooms)
                .then(function (res: any) {
                    // some logging here please!
                    Log.trace("res.status: " + res.status);
                    expect(res.status).to.be.equal(204);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace("err: " + err.message);
                    Log.trace("err: " + err);
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            Log.trace("err: " + err.message);
            Log.error(err);
        }
    });

    it("POST test query for courses dataset", function () {
        try {
            return chai.request(URL)
                .post("/query")
                .set("Content-Type", "application/json")
                .send(JSON.stringify("In courses dataset threeValidcsvSever, find all entries; show UUID."))
                .then(function (res: any) {
                    // some logging here please!
                    Log.trace("res.status: " + res.status);
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace("err.message: " + err.message);
                    Log.trace("err.status: " + err.status);
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            // and some more logging here!
            Log.trace("err: " + err.message);
            Log.trace("err: " + err.message);
            Log.error(err);
        }
    });

    it("POST test convertedquery for courses dataset", function () {
        let query = {DATASET: "courses",
        FILTER: {AND: [{EQ: {courses_audit: 10}}, {NGT: {courses_avg: 90}}]},
        DISPLAY: ["courses_dept", "courses_fail"],
        ORDER: {dir: "ASC", keys: ["courses_dept", "courses_fail"]},
        GROUP: ["courses_instructor"],
        APPLY: [{minPass: {MIN: ["courses_pass"]}}, {maxPass: {MAX: ["courses_pass"]} },
    ]};
        try {
            return chai.request(URL)
                .post("/query")
                .set("Content-Type", "application/json")
                .send(query)
                .then(function (res: any) {
                    // some logging here please!
                    Log.trace("res.status: " + res.status);
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace("err.message: " + err.message);
                    Log.trace("err.status: " + err.status);
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            // and some more logging here!
            Log.trace("err: " + err.message);
            Log.trace("err: " + err.message);
            Log.error(err);
        }
    });

    it("POST test query for rooms dataset", function () {
        try {
            return chai.request(URL)
                .post("/query")
                .set("Content-Type", "application/json")
                .send(JSON.stringify("In rooms dataset minorRoomsServer, find all entries; show Name."))
                .then(function (res: any) {
                    // some logging here please!
                    Log.trace("res.status: " + res.status);
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace("err: " + err.message);
                    Log.trace("err: " + err);
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            // and some more logging here!
            Log.trace("err: " + err.message);
            Log.error(err);
        }
    });

    it("GET test for dataset", function () {
        try {
            return chai.request(URL)
                .get("/datasets")
                .then(function (res: any) {
                    // some logging here please!
                    Log.trace("res.status: " + res.status);
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace("err: " + err.message);
                    Log.trace("err: " + err);
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            Log.trace("err: " + err.message);
            Log.error(err);
        }
    });

    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
