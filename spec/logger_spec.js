"use strict";

const Logger = require('../server/logger');
const stream = require('stream');

class MemoryStream extends stream.Writable {
  constructor() {
    super({ decodeStrings: false })
  }

  _write(chunk, encoding, next) {
    this.messages().push({ chunk: chunk, encoding: encoding });
    next();
  }

  messages() {
    if (!this._messages) {
      this._messages = [];
    }
    return this._messages;
  }
}

describe("Logger", () => {
  beforeEach(() => {
    this.stdout = new MemoryStream();
    this.stderr = new MemoryStream();
    this.logger = new Logger(this.stdout, this.stderr);
  });

  it("uses the process.stdout and process.stderr or the values passed on creation", () => {
    let defaultedLogger = new Logger();
    expect(defaultedLogger.outStream()).toBe(process.stdout);
    expect(defaultedLogger.errorStream()).toBe(process.stderr);

    let stderrDefaultedLogger = new Logger(this.stdout);
    expect(stderrDefaultedLogger.outStream()).toBe(this.stdout);
    expect(stderrDefaultedLogger.errorStream()).toBe(process.stderr);

    let stdoutDefaultedLogger = new Logger(null, this.stderr);
    expect(stdoutDefaultedLogger.outStream()).toBe(process.stdout);
    expect(stdoutDefaultedLogger.errorStream()).toBe(this.stderr);

    expect(this.logger.outStream()).toBe(this.stdout);
    expect(this.logger.errorStream()).toBe(this.stderr);
  });

  describe("#log", () => {
    it("writes a message to the output stream with a timestamp", () => {
      let originalMessage = "Computers are great at telephone";
      this.logger.log(originalMessage);

      expect(this.stderr.messages().length).toEqual(0);

      let messages = this.stdout.messages();
      expect(messages.length).toBe(2);

      expect(messages[0].chunk).toMatch(`^\\[\\d{2}/\\d{2}/\\d{4}, \\d{2}:\\d{2}:\\d{2} GMT\\] ${originalMessage}$`);
      expect(messages[1].chunk).toEqual("\n");
    });
  });

  describe("#error", () => {
    it("writes the error stack to the error stream with a timestamp", () => {
      let fakeError = {
        stack: 'MyError: some reason\nat something\nat something else'
      };

      this.logger.error(fakeError);

      expect(this.stdout.messages().length).toEqual(0);

      let messages = this.stderr.messages();
      expect(messages.length).toBe(3);

      expect(messages[0].chunk).toMatch("^\\[\\d{2}/\\d{2}/\\d{4}, \\d{2}:\\d{2}:\\d{2} GMT\\]");
      expect(messages[1].chunk).toEqual(fakeError.stack);
      expect(messages[2].chunk).toEqual("\n");
    });
  });

  describe("#tagged", () => {
    it("returns a logger that tags messages with the given information", () => {
      let tag = 'ip: 127.0.0.1';
      let taggedLogger = this.logger.tagged(tag);
      taggedLogger.log('a message');

      let messages = this.stdout.messages();
      expect(messages.length).toBe(2);

      expect(messages[0].chunk).toContain(`[${tag}]`);

      taggedLogger.error({ stack: 'a stack' });

      messages = this.stderr.messages();
      expect(messages.length).toBe(3);

      expect(messages[0].chunk).toContain(`[${tag}]`);
    });

    it("adds more tags on subsequent calls", () => {
      let tag1 = 'ip: 127.0.0.1';
      let tag2 = 'userId: 1234';
      let taggedLogger = this.logger.tagged(tag1).tagged(tag2);
      taggedLogger.log('a message');

      let messages = this.stdout.messages();
      expect(messages.length).toBe(2);

      expect(messages[0].chunk).toContain(`[${tag1}]`);
      expect(messages[0].chunk).toContain(`[${tag2}]`);

      taggedLogger.error({ stack: 'a stack' });

      messages = this.stderr.messages();
      expect(messages.length).toBe(3);

      expect(messages[0].chunk).toContain(`[${tag1}]`);
      expect(messages[0].chunk).toContain(`[${tag2}]`);
    });
  });

  describe('#addTag', () => {
    it("adds a tag to the log messages", () => {
      let tag1 = 'abc: def';
      let tag2 = 'userId: 4321';
      this.logger.addTag(tag1);
      this.logger.addTag(tag2);

      this.logger.log('a message');

      let messages = this.stdout.messages();
      expect(messages.length).toBe(2);

      expect(messages[0].chunk).toContain(`[${tag1}]`);
      expect(messages[0].chunk).toContain(`[${tag2}]`);

      this.logger.error({ stack: 'a stack' });

      messages = this.stderr.messages();
      expect(messages.length).toBe(3);

      expect(messages[0].chunk).toContain(`[${tag1}]`);
      expect(messages[0].chunk).toContain(`[${tag2}]`);
    });
  });
});
