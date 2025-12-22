// Type declaration for the server route JS module expected by Next's type validator.
// This file provides the shapes for `import("./route.js")` during typechecking.

declare function POST(request: Request): Promise<Response | void> | Response | void

export { POST }
