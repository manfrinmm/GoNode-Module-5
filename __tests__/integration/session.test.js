const request = require("supertest");
const nodemailer = require("nodemailer");

const app = require("../../src/app");
const truncate = require("../utils/truncate");
const factory = require("../factories");

jest.mock("nodemailer");

const transport = {
  sendMail: jest.fn()
};

describe("Authentication", () => {
  //antes de cada teste
  beforeEach(async () => {
    await truncate();
  });

  beforeAll(() => {
    nodemailer.createTransport.mockReturnValue(transport);
  });

  it("should be able to authenticate with valid credentials", async () => {
    const user = await factory.create("User", {
      password: "10123"
    });

    //faz a "conexão" com a api
    const response = await request(app)
      .post("/sessions")
      .send({ email: user.email, password: "10123" });

    expect(response.status).toBe(200);
  });

  it("should not be able to authenticate with valid credentials", async () => {
    const user = await factory.create("User", {
      password: "10123"
    });

    //faz a "conexão" com a api
    const response = await request(app)
      .post("/sessions")
      .send({ email: user.email, password: "101231ww" });

    expect(response.status).toBe(401);
  });

  it("should return jwt token when authenticated", async () => {
    const user = await factory.create("User", {
      password: "10123"
    });

    //faz a "conexão" com a api
    const response = await request(app)
      .post("/sessions")
      .send({ email: user.email, password: "10123" });

    expect(response.body).toHaveProperty("token");
  });

  it("should be able to access private routes when authenticated", async () => {
    const user = await factory.create("User");

    //faz a "conexão" com a api
    const response = await request(app)
      .get("/dashboard")
      .set("Authorization", `Bearer ${user.generateToken()}`);

    expect(response.status).toBe(200);
  });

  it("should not be able to access private routes when not authenticated", async () => {
    //faz a "conexão" com a api
    const response = await request(app).get("/dashboard");

    expect(response.status).toBe(401);
  });

  it("should not be able to access private routes when not authenticated", async () => {
    //faz a "conexão" com a api
    const response = await request(app)
      .get("/dashboard")
      .set("Authorization", `Bearer 312123`);

    expect(response.status).toBe(401);
  });

  it("should receive email notification when authenticated", async () => {
    const user = await factory.create("User", {
      password: "10123"
    });

    //faz a "conexão" com a api
    await request(app)
      .post("/sessions")
      .send({ email: user.email, password: "10123" });

    expect(transport.sendMail).toHaveBeenCalledTimes(1);
    expect(transport.sendMail.mock.calls[0][0].to).toBe(
      `${user.name} <${user.email}>`
    );
  });
});