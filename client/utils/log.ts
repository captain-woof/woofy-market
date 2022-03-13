const isDevEnv = process.env.NODE_ENV === "development";

export const dev = {
    log: (...message: any) => { isDevEnv && console.log(...message) },
    error: (...message: any) => { isDevEnv && console.error(...message) }
}