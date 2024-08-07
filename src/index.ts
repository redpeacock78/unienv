"use strict";
import Utils from "./utils.ts";
import { Maybe, Result, Ok, Ng } from "./types.ts";
import Commons, { RuntimeName } from "./commons.ts";

type versionErrorProp = {
  runtime: string;
  version: { require: string; current: string };
};

class VersionError extends Error {
  constructor(prop: versionErrorProp) {
    const runtime = prop.runtime;
    const require = prop.version.require;
    const current = prop.version.current;
    const errorText = `${runtime} version ${require} or higher is required. Current version: ${current}`;
    super(errorText);
    this.name = "VersionError";
  }
}

const runtime: string = Utils.ucFirst(
  RuntimeName === "node" ? `${RuntimeName}.js` : RuntimeName
);
const version = {
  require: Commons.runtime.version().require,
  current: Commons.runtime.version().current,
};
const genericVersionError: versionErrorProp = {
  runtime: runtime,
  version: version,
};
const nodeVersionError: versionErrorProp = {
  runtime,
  version: { require: "20.6.0", current: version.current },
};
const isSatisfiesVersion: boolean = Utils.versioning.moreThan(
  version.require,
  version.current
);

const setRuntimeMap = {
  /**
   * Sets the value for a key in the Node.js runtime map.
   *
   * @param {string} key - The key to set the value for.
   * @param {string} value - The value to set for the key.
   * @return {Result<void, VersionError | Error>} Success if the value is set successfully, otherwise a VersionError.
   */
  node: (key: string, value: string): Result<void, VersionError | Error> => {
    if (!isSatisfiesVersion)
      return new Ng<VersionError>(new VersionError(genericVersionError));
    try {
      return new Ok<void>(Commons.env.set(key, value));
    } catch (e: unknown) {
      return new Ng<Error>(new Error((e as Error).message));
    }
  },
  /**
   * Sets the value for a key in the Bun runtime map.
   *
   * @param {string} key - The key to set the value for.
   * @param {string} value - The value to set for the key.
   * @return {Result<void, VersionError | Error>} Success if the value is set successfully, otherwise a VersionError.
   */
  bun: (key: string, value: string): Result<void, VersionError | Error> => {
    if (!isSatisfiesVersion)
      return new Ng<VersionError>(new VersionError(genericVersionError));
    try {
      return new Ok<void>(Commons.env.set(key, value));
    } catch (e: unknown) {
      return new Ng<Error>(new Error((e as Error).message));
    }
  },
  /**
   * Sets the value for a key in the Deno runtime map.
   *
   * @param {string} key - The key to set the value for.
   * @param {string} value - The value to set for the key.
   * @return {Result<void, VersionError | Error>} Success if the value is set successfully, otherwise a VersionError.
   */
  deno: (key: string, value: string): Result<void, VersionError | Error> => {
    if (!isSatisfiesVersion)
      return new Ng<VersionError>(new VersionError(genericVersionError));
    try {
      return new Ok<void>(Commons.env.set(key, value));
    } catch (e: unknown) {
      return new Ng<Error>(new Error((e as Error).message));
    }
  },
} as const satisfies Record<
  string,
  (key: string, value: string) => Result<void, VersionError | Error>
>;

const getRuntimeMap = {
  /**
   * Retrieves a value from the Node.js runtime map based on the provided key.
   *
   * @param {string} key - The key to retrieve the value for.
   * @return {Result<Maybe<string>, VersionError | Error>} The value associated with the key or a VersionError.
   */
  node: (key: string): Result<Maybe<string>, VersionError | Error> => {
    if (!isSatisfiesVersion)
      return new Ng<VersionError>(new VersionError(genericVersionError));
    const envFileSpecified: string[] = process.execArgv.filter(
      (execArg: string): boolean => execArg.startsWith("--env-file=")
    );
    if (envFileSpecified.length)
      try {
        return new Ok<Maybe<string>>(Commons.env.get(key));
      } catch {
        return new Ng<VersionError>(new VersionError(nodeVersionError));
      }
    try {
      Utils.loadEnvIfNeeded();
      return new Ok(Commons.env.get(key));
    } catch (e: unknown) {
      return new Ng<Error>(new Error((e as Error).message));
    }
  },
  /**
   * Retrieves a value from the Bun runtime map based on the provided key.
   *
   * @param {string} key - The key to retrieve the value for.
   * @return {Result<Maybe<string>, VersionError | Error>} The value associated with the key or a VersionError.
   */
  bun: (key: string): Result<Maybe<string>, VersionError | Error> => {
    if (!isSatisfiesVersion)
      return new Ng<VersionError>(new VersionError(genericVersionError));
    try {
      return new Ok<Maybe<string>>(Commons.env.get(key));
    } catch (e: unknown) {
      return new Ng<Error>(new Error((e as Error).message));
    }
  },
  /**
   * Retrieves a value from the Deno runtime map based on the provided key.
   *
   * @param {string} key - The key to retrieve the value for.
   * @return {Result<Maybe<string>, VersionError | Error>} The value associated with the key or a VersionError.
   */
  deno: (key: string): Result<Maybe<string>, VersionError | Error> => {
    if (!isSatisfiesVersion)
      return new Ng<VersionError>(new VersionError(genericVersionError));
    try {
      const permission = Commons.permissions({ name: "read" });
      if (permission === "granted") Utils.loadEnvIfNeeded();
      return new Ok<Maybe<string>>(Commons.env.get(key));
    } catch (e: unknown) {
      return new Ng<Error>(new Error((e as Error).message));
    }
  },
} as const satisfies Record<
  string,
  (key: string) => Result<Maybe<string>, VersionError | Error>
>;

const deleteRuntimeMap = {
  /**
   * Deletes a key from the Node.js runtime map if the runtime version is greater than or equal to the required version.
   *
   * @param {string} key - The key to delete from the Node.js runtime map.
   * @return {Result<void, VersionError | Error>} - Returns a Result object containing a void value if the key is successfully deleted, or a VersionError if the runtime version is less than the required version.
   */
  node: (key: string): Result<void, VersionError | Error> => {
    if (!isSatisfiesVersion)
      return new Ng<VersionError>(new VersionError(genericVersionError));
    try {
      return new Ok<void>(Commons.env.delete(key));
    } catch (e: unknown) {
      return new Ng<Error>(new Error((e as Error).message));
    }
  },
  /**
   * Deletes a key from the Bun runtime map if the runtime version is greater than or equal to the required version.
   *
   * @param {string} key - The key to delete from the Bun runtime map.
   * @return {Result<void, VersionError | Error>} - Returns a Result object containing a void value if the key is successfully deleted, or a VersionError if the runtime version is less than the required version.
   */
  bun: (key: string): Result<void, VersionError | Error> => {
    if (!isSatisfiesVersion)
      return new Ng<VersionError>(new VersionError(genericVersionError));
    try {
      return new Ok<void>(Commons.env.delete(key));
    } catch (e: unknown) {
      return new Ng<Error>(new Error((e as Error).message));
    }
  },
  /**
   * Deletes a key from the Deno runtime map if the runtime version is greater than or equal to the required version.
   *
   * @param {string} key - The key to delete from the Deno runtime map.
   * @return {Result<void, VersionError | Error>} - Returns a Result object containing a void value if the key is successfully deleted, or a VersionError if the runtime version is less than the required version.
   */
  deno: (key: string): Result<void, VersionError | Error> => {
    if (!isSatisfiesVersion)
      return new Ng<VersionError>(new VersionError(genericVersionError));
    try {
      return new Ok<void>(Commons.env.delete(key));
    } catch (e: unknown) {
      return new Ng<Error>(new Error((e as Error).message));
    }
  },
} as const satisfies Record<
  string,
  (key: string) => Result<void, VersionError | Error>
>;

const UniEnv = {
  /**
   * Sets a key-value pair in the runtime map based on the runtime's name.
   *
   * @param {string} key - The key to set.
   * @param {string} value - The value to associate with the key.
   * @return {Result<void, VersionError | Error>} The result of setting the key-value pair.
   */
  set: (key: string, value: string): Result<void, VersionError | Error> =>
    setRuntimeMap[RuntimeName]?.(key, value),
  /**
   * Retrieves a value from the runtime map based on the provided key.
   *
   * @param {string} key - The key to retrieve the value for.
   * @return {Result<Maybe<string>, VersionError | Error>} The value associated with the key or a VersionError.
   */
  get: (key: string): Result<Maybe<string>, VersionError | Error> =>
    getRuntimeMap[RuntimeName]?.(key),
  /**
   * Deletes a key-value pair in the runtime map based on the runtime's name.
   *
   * @param {string} key - The key to delete.
   * @return {Result<void, VersionError | Error>} The result of deleting the key-value pair.
   */
  delete: (key: string): Result<void, VersionError | Error> =>
    deleteRuntimeMap[RuntimeName]?.(key),
} as const satisfies Record<
  string,
  (
    key: string,
    value: string
  ) => Result<void | Maybe<string>, VersionError | Error>
>;

export default UniEnv;
