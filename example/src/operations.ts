import assert from "assert";
import {
  NotFoundError,
  TPatientResource,
  ValidationError,
} from "@aidbox/server-sdk";
import { TOperation } from "./helpers";

export const createPatient: TOperation<{
  // Typing "resource" (POST payload)
  resource: {
    name: string;
    active: boolean;
  };
  // Optionally typing query/route params & form payload
  params: {
    foo: string;
  };
  "form-params": {
    foo: string;
  };
  "route-params": {
    foo: string;
  };
}> = {
  method: "POST",
  path: ["createPatient"],
  handlerFn: async (req, { ctx }) => {
    const {
      // "resource" contains POST payload
      resource,
      // "params", "form-params" & "route-params" are also accessible
      params,
      "form-params": formParams,
      "route-params": routeParams,
    } = req;
    assert.ok(resource, new ValidationError("resource required"));
    const { active, name } = resource;

    assert.ok(
      typeof active !== "undefined",
      new ValidationError('"active" required')
    );
    assert.ok(name, new ValidationError('"name" required'));

    const { data: patient } = await ctx.request<TPatientResource>({
      url: "/Patient",
      method: "POST",
      data: {
        active: active,
        name: [{ text: name }],
      },
    });
    return { resource: patient };
  },
};

export const test: TOperation<{ resource: { active: boolean } }> = {
  method: "GET",
  path: ["test"],
  handlerFn: async (req, { ctx, helpers }) => {
    // Test helpers
    console.log("Testing helpers");
    const { resources: patients, total: patientsTotal } =
      await helpers.findResources<TPatientResource>("Patient", {
        _sort: "-createdAt",
        _count: 3,
      });
    console.log({ patientsTotal, patients });

    // Test log
    console.log("Testing log");
    await ctx.log({
      message: { error: "Testing log" },
      v: "2020.02",
      fx: "testOperation",
      type: "backend-test",
    });

    // Test query
    console.log("Testing query");
    const { rowCount, rows } = await ctx.query(
      "SELECT * FROM patient WHERE id=$1",
      ["d60c37ec-e5c3-4ac0-9c1c-e5239e601a08"]
    );
    console.log({ rowCount, rows });

    return { status: 200 };
  },
};

export const testError: TOperation<{ params: { type: string } }> = {
  method: "GET",
  path: ["testError"],
  handlerFn: async (req, { ctx }) => {
    switch (req.params.type) {
      case "ValidationError":
        throw new ValidationError("Testing ValidationError");
      case "NotFoundError":
        throw new NotFoundError("Something", {
          foo: "foo",
          bar: "bar",
        });
      case "AxiosError":
        await ctx.request({ url: "http://xxx" });
        return {};
      default:
        throw new Error("Testing default error");
    }
  },
};
