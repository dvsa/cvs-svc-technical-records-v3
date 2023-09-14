# Technical Records v3

This collections of lambdas interact with the `flat-tech-records` database. Entry points to the lambdas are in `./src/handler`.

**Requirements**

- node v18.*
- [SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
- npm 8+

**Prerequisites**
- Create a `.env`
    ```shell
    cp .env.example .env
    ```

**Build**

- `npm i`
- `npm run build:dev`

**Watch**

To watch for changes and automatically trigger a new build:
- `npm run watch:dev`


**Run Lambdas Locally**

- Build the files first
- `npm run start:dev`
- To ensure that the lambdas have been successfully served, make requests to the port the lambda is running on e.g. `localhost:3000` through [Postman](https://postman.com/) or `curl`.
- To run a specific lambda: `npm run invoke -- {lambda}`


**Debug Lambdas Locally (VS Code only)**

- Run lambdas in debug mode: `npm run start:dev -- -d 5858`
- Add a breakpoint to the lambda being tested (`src/handler/get.ts`)
- Run the debug config from VS Code that corresponds to lambda being tested (`GetLambdaFunction`)
- Send an HTTP request to the lambda's URI e.g. `curl --request GET http://localhost:3000`
- To debug a specific lambda: `npm run invoke -- {lambda} -d 5858`


**Local DynamoDB Table**

A local DynamoDB table is available for local testing. [DynamoDB Admin](https://github.com/aaronshaf/dynamodb-admin) is also spun up  at [localhost:8001](http://localhost:8001), allowing a view of the local tables and the data in them for easy local debugging. 

**Tests**

- The [Jest](https://jestjs.io/) framework is used to run tests and collect code coverage
- To run the tests, run the following command within the root directory of the project: `npm test`
- Coverage results will be displayed on terminal and stored in the `coverage` directory
    - The coverage requirements can be set in `jest.config.js`

**Integration tests**

- Running locally
The are two ways of running the integration tests locally
    1. With two terminals 

        _This is the recommended way if writing new integration tests as it gives more feedback as it is possible to see the logs of the local lambdas_
        - In one terminal run `npm run build:dev && npm run start:dev`
        - In another terminal, run `npm run test:integration`

    2. With one terminal 

        _This is the recommended way if running the tests to test functionality is not broken. There are no logs output to the console, but the tests run faster than the above method_

        - Run `npm run dynamo:start` to spin up the dynamoDB container
        - Run `npm run test:integration:github` to run the tests
        - _Optional_ `npm run docker:clean` to stop and remove the lambda containers the tests have spun up. These can build up overtime. This will remove all containers using the `public.ecr.aws/lambda/nodejs:18-rapid-x86_64` base image


**Documentation** 

An OpenAPI Specification can be found under [docs/spec.yml](docs/spec.yml). 

An `npm run swagger:open`, can be used to open the file in the [Swagger editor](https://swagger.io/tools/swagger-editor/) running in a container. 
> Note that any updates made to the file in the editor will not be reflected in the local version of the file. The file has to be downloaded and then updated manually.

**Logging**

Logging is handled by `https://github.com/winstonjs/winston`. A pre-configured logger is available, and can be used like so:

```ts
import logger from "../utils/logger";

logger.info('Hello world');
logger.error('Hello world');
logger.warn('Hello world');
```
