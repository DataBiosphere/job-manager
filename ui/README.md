# Job Manager UI

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.4.1.

## Setup

Install the Angular CLI following the instructions in [Step 1](https://angular.io/guide/quickstart#devenv) of the Angular QuickStart guide.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).
Before running the tests make sure you are serving the app via `ng serve`.

## Updating the API using swagger-codegen

We use [swagger-codegen](https://github.com/swagger-api/swagger-codegen) to automatically implement the API as defined in ../api/jobs.yaml.
Whenever the API is updated, follow these steps to update the UI implementation:

If you do not already have the jar, you can download it using `wget http://central.maven.org/maven2/io/swagger/swagger-codegen-cli/2.2.3/swagger-codegen-cli-2.2.3.jar -O swagger-codegen-cli.jar`

Regenerate the definitions using `java -jar swagger-codegen-cli.jar generate -i api/jobs.yaml -l typescript-angular2 -o ui/src/app`

Finally, update the UI implementation to resolve any broken dependencies on old API definitions or implement additional functionality to match the new specs.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
