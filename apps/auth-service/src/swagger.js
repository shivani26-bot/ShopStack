import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    title: "Auth Service API",
    description: "Automatically generated Swagger docs",
    version: "1.0.0",
  },
  host: "localhost:6001",
  schemes: ["http"],
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./routes/auth.router.ts"];
swaggerAutogen()(outputFile, endpointsFiles, doc);

// swaggerAutogen: tool that scans your API routes and generates a Swagger/OpenAPI JSON file automatically.
// That JSON file can later be used by Swagger UI to display interactive API documentation
// info → General API info
// title → Name of your API (“Auth Service API”).
// description → Brief summary for the docs (“Automatically generated Swagger docs”).
// version → Version of your API (“1.0.0”).
// host → Where your API is running (localhost:6001).
// schemes → Protocols the API supports (http in this case).
// swagger-output.json:File where generated Swagger JSON will be saved

// endpointsFiles:List of files containing your API route definitions,swagger-autogen will scan these files for your routes (GET, POST, etc.) and any comments to auto-document them.

// swaggerAutogen() returns a function.
// Passing (outputFile, endpointsFiles, doc) tells it:
// Where to save the JSON (outputFile).
// Which files to scan for routes (endpointsFiles).
// Base metadata for the docs (doc).

// This script scans your API routes → creates a Swagger JSON file → which you can serve in Swagger UI for interactive API documentation.
