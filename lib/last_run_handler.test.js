const chai = require("chai");
const sinon = require("sinon");
chai.use(require("sinon-chai"));
chai.should();

const LastRunHandler = require("./last_run_handler");

describe("LastRunHandler", () => {
  it("should emit loaded when the lastRun File doesn't exist", done => {
    const loadedSpy = sinon.spy();
    const errorSpy = sinon.spy();
    const lastRunHandler = new LastRunHandler({
      lastRunFilePath: "notExist"
    });
    lastRunHandler.on("loaded", loadedSpy);
    lastRunHandler.on("error", errorSpy);
    lastRunHandler.loadLastRun();

    setTimeout(() => {
      loadedSpy.should.have.been.all.calledOnce;
      loadedSpy.should.have.been.calledWithExactly(null);
      errorSpy.should.not.have.been.all.calledOnce;
      done();
    }, 5);
  });

  it("should emit loaded when the lastRun File exist", done => {
    const loadedSpy = sinon.spy();
    const errorSpy = sinon.spy();
    const lastRunFilePath = __dirname + "/testdata/lastrun";
    const lastRunHandler = new LastRunHandler({
      lastRunFilePath
    });
    lastRunHandler.on("loaded", loadedSpy);
    lastRunHandler.on("error", errorSpy);
    lastRunHandler.loadLastRun();

    setTimeout(() => {
      loadedSpy.should.have.been.all.calledOnce;
      loadedSpy.should.not.have.been.calledWithExactly(null);
      errorSpy.should.not.have.been.all.calledOnce;
      done();
    }, 5);
  });
});
